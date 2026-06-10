const { app, BrowserWindow, dialog, clipboard, screen, ipcMain } = require('electron');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');

// Register ID as early as possible for taskbar icon management
try {
    app.setAppUserModelId('com.persis.ik');
} catch (e) {
    console.error('setAppUserModelId failed:', e);
}

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

// Global Error Handler
process.on('uncaughtException', (error) => {
    if (dialog) {
        dialog.showErrorBox('Uygulama Kritik Hatası', error.stack || error.message || error);
    } else {
        console.error('Kritik Hata:', error);
    }
});

let mainWindow;
let nextProcess;
let isQuitting = false;
let pendingSgkCredentials = null;
let isUpdating = false;
const isProd = app.isPackaged;

/**
 * Otomatik Yedekleme Fonksiyonu
 * Çıkışta sqlite.db dosyasını backups klasörüne kopyalar.
 * Max 10 yedek tutar.
 */
function autoBackup() {
    try {
        const userDataPath = app.getPath('userData');
        const dbPath = path.join(userDataPath, 'sqlite.db');
        const backupDir = path.join(userDataPath, 'backups');

        if (!fs.existsSync(dbPath)) return null;

        // Klasör yoksa oluştur
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .split('Z')[0];

        const backupPath = path.join(backupDir, `auto_backup_${timestamp}.db`);

        // Kopya oluştur
        fs.copyFileSync(dbPath, backupPath);
        // mtime'i su anki zamana ayarla (copyFileSync kaynak mtime'ini kopyalayabilir)
        const now = new Date();
        fs.utimesSync(backupPath, now, now);
        console.log('Otomatik yedek alindi:', backupPath);

        // Yedek rotasyonu (Max 10 dosya) - dosya adindan timestamp parse et
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('auto_backup_') && f.endsWith('.db'))
            .sort() // alfabetik = kronolojik (ISO timestamp)
            .reverse(); // yeniden eskiye

        if (files.length > 10) {
            const filesToDelete = files.slice(10);
            filesToDelete.forEach(f => {
                fs.unlinkSync(path.join(backupDir, f));
                console.log('Eski yedek silindi:', f);
            });
        }

        return { backupPath, backupDir };
    } catch (error) {
        console.error('Otomatik yedekleme hatası:', error);
        return null;
    }
}

app.commandLine.appendSwitch('ignore-certificate-errors', 'true');

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    // On certificate error we disable default behaviour (stop loading the page)
    // and we then say "it is all fine - true" to the callback
    event.preventDefault();
    callback(true);
});

function createWindow() {
    // Determine icon path
    const isWindows = process.platform === 'win32';
    const iconFile = isWindows ? 'icon.ico' : 'icon.png';
    const iconPath = path.resolve(__dirname, 'build', iconFile);

    console.log('Using icon path:', iconPath);

    // Get primary display work area to dynamically size the window
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: displayWidth, height: displayHeight } = primaryDisplay.workAreaSize;
    
    // Set width and height to 90% of the screen, with minimums to prevent it from being too small
    const winWidth = Math.max(1200, Math.floor(displayWidth * 0.9));
    const winHeight = Math.max(800, Math.floor(displayHeight * 0.9));

    mainWindow = new BrowserWindow({
        width: winWidth,
        height: winHeight,
        center: true,
        icon: iconPath,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            zoomFactor: 1.0,
            devTools: true
        },
        show: false
    });

    if (isWindows) {
        mainWindow.setAppDetails({
            appId: 'com.persis.ik',
            relaunchCommand: `"${process.execPath}"`,
            relaunchDisplayName: 'Persis IK',
            appIconPath: iconPath
        });
        mainWindow.setIcon(iconPath);
    }

    mainWindow.once('ready-to-show', () => {
        if (mainWindow) {
            mainWindow.setIcon(iconPath);
            mainWindow.show();
            // Guncelleme sonrasi baslatildiysa toast gonder
            if (process.argv.includes('--updated')) {
                setTimeout(() => {
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.executeJavaScript(
                            'if(window.__showUpdateToast) window.__showUpdateToast();'
                        ).catch(() => {});
                    }
                }, 3000);
            }
        }
    });

    // Load the "starting" screen briefly before the server is up
    mainWindow.loadFile(path.join(__dirname, 'loading.html'));

    mainWindow.on('close', (event) => {
        isQuitting = true;
    });

    // Periyodik yedekleme: her 30 dakikada bir (server acikken de calisir)
    setInterval(() => {
        const r = autoBackup();
        if (r) log.info('Periyodik yedek alindi:', r.backupPath);
    }, 30 * 60 * 1000);

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    // Zooming functionality via Ctrl + Scroll
    mainWindow.webContents.on('zoom-changed', (event, zoomDirection) => {
        if (!mainWindow) return;
        const currentZoom = mainWindow.webContents.getZoomLevel();
        if (zoomDirection === 'in') {
            mainWindow.webContents.setZoomLevel(currentZoom + 0.2);
        }
        if (zoomDirection === 'out') {
            mainWindow.webContents.setZoomLevel(currentZoom - 0.2);
        }
    });

    // DevTools ve Menü çubuğunu test için görünür yapalım
    mainWindow.setMenuBarVisibility(false);

    // Auto-fill handling for newly opened windows
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        const allowedWindowOptions = {
            autoHideMenuBar: true,
            icon: iconPath,
            webPreferences: { nodeIntegration: false, contextIsolation: true }
        };

        // SGK, ebildirge harici siteler
        if (url.includes('sgk.gov.tr') || url.includes('ebildirge')) {
            return { action: 'allow', overrideBrowserWindowOptions: allowedWindowOptions };
        }

        // blob: ve data: URL'leri (PDF/izin formu yazdirma)
        if (url.startsWith('blob:') || url.startsWith('data:')) {
            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    width: 900, height: 750, autoHideMenuBar: true,
                    webPreferences: { nodeIntegration: false, contextIsolation: true }
                }
            };
        }

        // localhost URL'leri (dokuman, ISG, ozluk evragi yazdirma)
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    width: 900, height: 750, autoHideMenuBar: true,
                    webPreferences: { nodeIntegration: false, contextIsolation: true }
                }
            };
        }

        // Dis URL'ler tarayicide ac
        if (url.startsWith('https://') || url.startsWith('http://')) {
            require('electron').shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    // When a new window is fully created, inject the clipboard reading script
    mainWindow.webContents.on('did-create-window', (childWindow) => {
        childWindow.webContents.on('did-finish-load', () => {
            // localhost veya app sayfalarında doldurma yapma
            const currentUrl = childWindow.webContents.getURL();
            if (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) return;
            const isSgkPage = (
                currentUrl.includes('sgk.gov.tr') ||
                currentUrl.includes('ebildirge') ||
                currentUrl.includes('istanbul.smmmo.org.tr')
            );
            if (!isSgkPage) return;
            {
                // IPC'den gelen credentials'i kullan, yoksa clipboard'a yuksel
                const creds = pendingSgkCredentials;
                const clipText = creds
                    ? [
                        creds.username ? `Kullanıcı Adı: ${creds.username}` : '',
                        creds.systemPassword ? `Sistem Şifresi: ${creds.systemPassword}` : '',
                        creds.workplacePassword ? `İşyeri Şifresi: ${creds.workplacePassword}` : '',
                        creds.code ? `Kod: ${creds.code}` : '',
                        creds.userCode ? `Kullanıcı Kodu: ${creds.userCode}` : '',
                      ].filter(Boolean).join('\n')
                    : clipboard.readText();
                pendingSgkCredentials = null;
                if (!clipText) return;

                // Full SGK Autofill Script
                childWindow.webContents.executeJavaScript(`
                    setTimeout(() => {
                        (function() {
                            try {
                                const text = ${JSON.stringify(clipText)};
                                let u='', s='', w='', c='', uc='';
                                text.split('\\n').forEach(l => {
                                    let line = l.trim();
                                    if(line.startsWith('Kullanıcı Adı:')) u = line.substring(line.indexOf(':')+1).trim();
                                    else if(line.startsWith('Sistem Şifresi:')) s = line.substring(line.indexOf(':')+1).trim();
                                    else if(line.startsWith('İşyeri Şifresi:')) w = line.substring(line.indexOf(':')+1).trim();
                                    else if(line.startsWith('Kod:')) c = line.substring(line.indexOf(':')+1).trim();
                                    else if(line.startsWith('Kullanıcı Kodu:')) uc = line.substring(line.indexOf(':')+1).trim();
                                });
                                
                                function executeFill() {
                                    const loc = window.location.href;
                                    function setVal(el, val) {
                                        if(el && val) {
                                            el.value = val;
                                            el.dispatchEvent(new Event('input', { bubbles: true }));
                                            el.dispatchEvent(new Event('change', { bubbles: true }));
                                        }
                                    }
                                    function trySet(selectors, val) {
                                        for (let sel of selectors) {
                                            let el = document.querySelector(sel);
                                            if (el) { setVal(el, val); return true; }
                                        }
                                        return false;
                                    }
                                    // uc = sgk_user_code (36775...) → TUM sitelerde login kullanici adi
                                    // u  = sgk_number (cok uzun) → login icin kullanilmaz
                                    // fc = sgk_code padded (016, 012...) → kucuk kod kutusu
                                    // s  = sistem sifresi, w = isyeri sifresi
                                    let fc = c ? c : '';
                                    let loginUser = uc || u;

                                    if (loc.includes('EBildirgeV2')) {
                                        // EBildirgeV2: fields[0]=KullaniciAdi(uc), [1]=Kod(fc), [2]=SistemSifresi, [3]=IsyeriSifresi
                                        let fields = Array.from(document.querySelectorAll(
                                            'input[type="text"], input[type="password"]'
                                        )).filter(el => el.type !== 'hidden');
                                        if (fields.length >= 4) {
                                            setVal(fields[0], loginUser);
                                            setVal(fields[1], fc);
                                            setVal(fields[2], s);
                                            setVal(fields[3], w);
                                        }
                                    } else {
                                        // uyg.sgk.gov.tr: SigortaliTescil, IsKazasi, Vizite vb.
                                        // Tam pozisyonel yaklasim: text[0]=loginUser, text[1]=fc(kod)
                                        // pass alanlari: 2 tane varsa [0]=sistem [1]=isyeri; 1 tane varsa [0]=isyeri

                                        let textInputs = Array.from(document.querySelectorAll(
                                            'input[type="text"], input:not([type])'
                                        )).filter(el => {
                                            const t = (el.type || '').toLowerCase();
                                            return !['hidden','submit','button','reset','image','checkbox','radio','password'].includes(t);
                                        });
                                        let passInputs = Array.from(document.querySelectorAll('input[type="password"]'));

                                        // Kullanici adi: once named selector, olmassa ilk text input
                                        let uFill = trySet(['input[name="j_username"]', 'input[id="j_username"]'], loginUser);
                                        if (!uFill && textInputs.length > 0) {
                                            setVal(textInputs[0], loginUser);
                                            uFill = true;
                                        }

                                        // Kucuk kod kutusu: ikinci text input
                                        if (textInputs.length > 1 && fc) {
                                            setVal(textInputs[1], fc);
                                        }

                                        // Sifreler: 2 password alani -> [0]=sistem, [1]=isyeri; 1 alan -> [0]=isyeri
                                        if (passInputs.length >= 2) {
                                            setVal(passInputs[0], s);
                                            setVal(passInputs[1], w);
                                        } else if (passInputs.length === 1) {
                                            setVal(passInputs[0], w);
                                        }
                                    }
                                }
                                // Sadece kullanıcı adı ve şifre alanı olan sayfalarda doldur
                                var usernameField = document.querySelector('input[type="text"], input[name*="user"], input[name*="User"], input[id*="user"], input[id*="User"], input[name*="tcno"], input[id*="tcno"]');
                                var passwordField = document.querySelector('input[type="password"]');
                                if (!usernameField || !passwordField) return; // Giriş sayfası değilse durdur

                                executeFill();
                            } catch(e) { console.error('Persis fill error:', e); }
                        })();
                    }, 800);
                `).catch(() => { });
            }
        });
    });
}



// Start Next.js server and handle its lifecycle

const { exec } = require('child_process');

function startNextJsServer() {
    const isProd = app.isPackaged;
    const nextCmd = isProd ? process.execPath : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
    const cleanEnv = { ...process.env };

    delete cleanEnv.ELECTRON_RUN_AS_NODE;
    delete cleanEnv.npm_config_runtime;
    delete cleanEnv.npm_config_node_gyp;
    delete cleanEnv.NODE_OPTIONS;

    if (isProd) {
        cleanEnv.ELECTRON_RUN_AS_NODE = '1';
    }

    let safePath = cleanEnv.PATH || cleanEnv.Path || '';
    if (!safePath.toLowerCase().includes('system32')) {
        safePath += ';C:\\Windows\\System32';
    }
    cleanEnv.PATH = safePath;
    cleanEnv.Path = safePath;
    cleanEnv.ComSpec = cleanEnv.ComSpec || 'C:\\Windows\\System32\\cmd.exe';

    // Before starting, forcefully kill any orphaned process on port 3000 asynchronously
    const killPort3000 = (callback) => {
        if (process.platform === 'win32') {
            console.log('Checking for processes on port 3000...');
            exec('netstat -aon | findstr :3000', (err, stdout) => {
                if (stdout) {
                    const lines = stdout.trim().split(/\r?\n/);
                    let killedCount = 0;
                    for (const line of lines) {
                        const parts = line.trim().split(/\s+/);
                        // Expected format eg: TCP  0.0.0.0:3000  0.0.0.0:0  LISTENING  37348
                        if (parts.length >= 5) {
                            const pid = parseInt(parts[4], 10);
                            if (pid && pid > 0) {
                                console.log(`Killing process ${pid} on port 3000...`);
                                // Use taskkill for more reliable process tree termination on Windows
                                try { spawn('taskkill', ['/F', '/T', '/PID', pid.toString()]); killedCount++; } catch (e) { }
                            }
                        }
                    }
                    if (killedCount > 0) {
                        // Give Windows a moment to actually free the port
                        setTimeout(callback, 500);
                        return;
                    }
                }
                callback();
            });
        } else {
            exec('lsof -t -i:3000 | xargs kill -9', () => {
                setTimeout(callback, 300);
            });
        }
    };

    killPort3000(() => {
        const userDataPath = app.getPath('userData');
        console.log('Database Path (userData):', userDataPath);
        let lastError = "";

        // Start the Next.js server (dev or production standalone)
        const serverDir = isProd
            ? path.join(process.resourcesPath, 'standalone')
            : __dirname;

        const serverPath = isProd
            ? path.join(serverDir, 'server.js')
            : 'run';

        const args = isProd
            ? [serverPath]
            : ['run', 'dev'];

        if (isProd && !fs.existsSync(serverPath)) {
            console.error('Next.js server.js bulunamadı:', serverPath);
            dialog.showErrorBox('Sunucu Hatası', `Next.js sunucu dosyası bulunamadı: ${serverPath}`);
            return;
        }

        // Quote paths for Windows to handle spaces
        const quotedCmd = nextCmd.includes(' ') ? `"${nextCmd}"` : nextCmd;
        const quotedArgs = args.map(arg => arg.includes(' ') ? `"${arg}"` : arg);

        const uploadsDir = path.join(userDataPath, 'uploads', 'documents');
        fs.mkdirSync(uploadsDir, { recursive: true });
        const uploadsBase = path.join(userDataPath, 'uploads');

        nextProcess = spawn(quotedCmd, quotedArgs, {
            cwd: serverDir,
            env: {
                ...cleanEnv,
                PORT: 3000,
                USERDATA_PATH: userDataPath,
                RESOURCES_PATH: process.resourcesPath,
                UPLOAD_DIR: uploadsDir,
                UPLOAD_BASE: uploadsBase
            },
            shell: true // Set to true to ensure command quoting works on Windows
        });

        nextProcess.stdout.on('data', (data) => {
            console.log(`Next.js stdout: ${data}`);
        });

        nextProcess.stderr.on('data', (data) => {
            const msg = data.toString();
            console.error(`Next.js stderr: ${msg}`);
            lastError += msg;
            if (lastError.length > 2000) lastError = lastError.substring(lastError.length - 2000);
        });

        nextProcess.on('error', (err) => {
            console.error('Failed to start Next.js process:', err);
        });

        nextProcess.on('exit', (code, signal) => {
            console.error(`Next.js process exited with code ${code} and signal ${signal}`);
            // Uygulama bilerek kapanıyorsa, zorla öldürüldüğü için çıkan bu hatayı yoksay
            if (code !== 0 && !isQuitting && !isUpdating) {
                if (dialog) {
                    dialog.showErrorBox('Next.js Başlatılamadı', `Hata Kodu: ${code}\nSinyal: ${signal}\n\nHata Detayı:\n${lastError || "Detay yok"}`);
                }
                if (mainWindow) {
                    mainWindow.webContents.executeJavaScript(`
                        const loader = document.querySelector('.loader'); if(loader) loader.style.display = 'none';
                        const status = document.querySelector('.status-text'); if(status) status.innerHTML = "Sunucu Hatası";
                        const sub = document.querySelector('.sub-text'); if(sub) sub.innerHTML = "Next.js sunucusu başlatılamadı. Hata detayını ana pencerede gördüyseniz lütfen kontrol edin.";
                        document.body.style.background = 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)';
                    `).catch(() => { });
                }
            }
        });

        // Check when server is ready
        let retryCount = 0;
        const maxRetries = 20; // 20 seconds timeout
        const checkServer = setInterval(() => {
            retryCount++;
            if (mainWindow) {
                mainWindow.webContents.executeJavaScript(`
                    const sub = document.querySelector('.sub-text'); 
                    if(sub) sub.innerHTML = "Sunucu başlatılıyor... Deneme ${retryCount}/${maxRetries}";
                `).catch(() => { });
            }

            // Because of our Auth Middleware, requesting '/' might result in a 307 Redirect to '/login'
            http.get('http://127.0.0.1:3000', (res) => {
                const status = res.statusCode;
                if (status === 200 || (status >= 300 && status < 400)) {
                    clearInterval(checkServer);
                    if (mainWindow) {
                        mainWindow.loadURL('http://localhost:3000');
                    }
                }
            }).on('error', (err) => {
                if (retryCount >= maxRetries) {
                    clearInterval(checkServer);
                    if (dialog) {
                        dialog.showErrorBox('Sunucu Başlatma Zaman Aşımı', `Next.js sunucusu 20 saniye içinde yanıt vermedi.\n\nHata: ${err.message}\n\nSon Hata Çıktısı:\n${lastError || "Çıktı yok"}`);
                    }
                }
            });
        }, 1000);
    });
}

app.on('ready', () => {
    try {
        autoUpdater.logger = log;
        autoUpdater.logger.transports.file.level = 'info';
        log.info('Uygulama hazır, başlatılıyor...');

        // SECURITY: Force login on every fresh app start by deleting the session cookie
        const { session } = require('electron');
        session.defaultSession.cookies.remove('http://localhost:3000', 'persis_session')
            .then(() => console.log('Session cookie cleared for fresh login'))
            .catch((error) => console.error('Failed to clear auth cookie on boot:', error));

        // Intercept /uploads/ requests and serve from userData via local HTTP file server
        const uploadsPath = path.join(app.getPath('userData'), 'uploads');
        fs.mkdirSync(uploadsPath, { recursive: true });

        // Start a local HTTP server to serve uploaded files
        const http = require('http');
        const fileServer = http.createServer((req, res) => {
            try {
                const decodedPath = decodeURIComponent(req.url.split('?')[0]);
                // Check new location first (userData), then fallback to old location (resources/standalone/public)
                let filePath = path.join(app.getPath('userData'), decodedPath);
                if (!fs.existsSync(filePath)) {
                    const oldPath = path.join(process.resourcesPath, 'standalone', 'public', decodedPath);
                    if (fs.existsSync(oldPath)) filePath = oldPath;
                }
                if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                    const ext = path.extname(filePath).toLowerCase();
                    const mimeTypes = {
                        '.pdf': 'application/pdf',
                        '.png': 'image/png',
                        '.jpg': 'image/jpeg',
                        '.jpeg': 'image/jpeg',
                        '.gif': 'image/gif',
                        '.webp': 'image/webp',
                        '.bmp': 'image/bmp'
                    };
                    const mime = mimeTypes[ext] || 'application/octet-stream';
                    res.writeHead(200, {
                        'Content-Type': mime,
                        'Access-Control-Allow-Origin': '*',
                        'Cache-Control': 'no-cache'
                    });
                    fs.createReadStream(filePath).pipe(res);
                } else {
                    res.writeHead(404);
                    res.end('Not found');
                }
            } catch (e) {
                res.writeHead(500);
                res.end(e.message);
            }
        });
        fileServer.listen(0, '127.0.0.1', () => {
            global.fileServerPort = fileServer.address().port;
            log.info(`File server started on port ${global.fileServerPort}`);
        });

        // Intercept /uploads/ requests and redirect to local file server
        const { session: interceptSession } = require('electron');
        interceptSession.defaultSession.webRequest.onBeforeRequest(
            { urls: ['http://localhost:*/uploads/*'] },
            (details, callback) => {
                try {
                    const url = new URL(details.url);
                    if (url.pathname.startsWith('/uploads/') && global.fileServerPort) {
                        const redirectURL = `http://127.0.0.1:${global.fileServerPort}${url.pathname}`;
                        callback({ redirectURL });
                        return;
                    }
                } catch (e) {}
                callback({});
            }
        );

        createWindow();
        startNextJsServer();

        // Check for updates slightly delayed to ensure window is ready
        setTimeout(() => {
            log.info('Güncelleme kontrolü başlatılıyor...');
            autoUpdater.checkForUpdatesAndNotify().catch(e => log.error('Update check failed:', e));
        }, 3000);

        const { globalShortcut } = require('electron');
        globalShortcut.register('F12', () => {
            if (mainWindow) {
                mainWindow.webContents.toggleDevTools();
            }
        });
    } catch (error) {
        if (dialog) dialog.showErrorBox('Başlatma Hatası', error.stack || error.message || error);
        console.error('Startup Error:', error);
    }
});

// IPC Handlers
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('get-backup-info', () => {
    const userDataPath = app.getPath('userData');
    const backupDir = path.join(userDataPath, 'backups');
    let lastBackup = null;
    let backupCount = 0;
    if (fs.existsSync(backupDir)) {
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('auto_backup_'))
            .sort().reverse();
        backupCount = files.length;
        if (files.length > 0) {
            const stat = fs.statSync(path.join(backupDir, files[0]));
            lastBackup = stat.mtime.toISOString();
        }
    }
    return { backupDir, backupCount, lastBackup };
});

ipcMain.handle('open-backup-folder', () => {
    const userDataPath = app.getPath('userData');
    const backupDir = path.join(userDataPath, 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    require('electron').shell.openPath(backupDir);
});

// Yazdir: tam URL'yi gizli pencerede yukle, print dialog goster
ipcMain.handle('print-file', async (_, filePath) => {
    return new Promise((resolve) => {
        // Relatif URL ise tam URL'ye cevir
        let fileUrl = filePath;
        if (!filePath.startsWith('http') && !filePath.startsWith('file://')) {
            fileUrl = 'http://localhost:3000' + (filePath.startsWith('/') ? '' : '/') + filePath;
        }

        const printWin = new BrowserWindow({
            show: false,
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                plugins: true  // PDF plugin icin
            }
        });

        // Pencereyi print dialog acilinca goster (dialog için visible olmasi gerekebilir)
        printWin.loadURL(fileUrl);

        let didPrint = false;
        const doPrint = () => {
            if (didPrint) return;
            didPrint = true;
            // Kisa bekleme: PDF render tamamlansin
            setTimeout(() => {
                printWin.webContents.print({ silent: false, printBackground: true }, (success) => {
                    setTimeout(() => { printWin.destroy(); }, 500);
                    resolve(success);
                });
            }, 800);
        };

        printWin.webContents.once('did-finish-load', doPrint);
        printWin.webContents.once('did-fail-load', () => {
            printWin.destroy();
            resolve(false);
        });

        // Fallback: 5 saniye sonra hala basmadigiysa iptal
        setTimeout(() => {
            if (!didPrint) {
                didPrint = true;
                printWin.destroy();
                resolve(false);
            }
        }, 5000);
    });
});

ipcMain.handle('set-sgk-credentials', (_, credentials) => {
    pendingSgkCredentials = credentials;
    return true;
});

ipcMain.handle('upload-file', async (event, { fileBuffer, fileName, subDir }) => {
    try {
        const uploadsBase = path.join(app.getPath('userData'), 'uploads');
        const uploadDir = path.join(uploadsBase, subDir || 'isg');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const timestamp = Date.now();
        const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filename = `${timestamp}_${safeName}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, Buffer.from(fileBuffer));
        return { success: true, filePath: `/uploads/${subDir || 'isg'}/${filename}`, fileName: fileName };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

app.on('before-quit', () => {
    isQuitting = true;
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    // Once server'i oldurek DB kilidi kaldir, sonra yedek al
    if (nextProcess) {
        try {
            if (process.platform === 'win32') {
                require('child_process').execSync(`taskkill /pid ${nextProcess.pid} /f /t`);
            } else {
                process.kill(-nextProcess.pid);
            }
        } catch (e) {
            console.error('Next.js sonlandirma hatasi:', e);
        }
        nextProcess = null;
    }
    // Server kapandiktan sonra guvenli backup
    try {
        const result = autoBackup();
        log.info('Cikis yedegi:', result ? result.backupPath : 'BASARISIZ');
    } catch(e) {
        log.error('will-quit backup hatasi:', e);
    }
});

// Update Event Listeners
let updateWindow = null;

function createUpdateWindow() {
    updateWindow = new BrowserWindow({
        width: 420,
        height: 220,
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        center: true,
        backgroundColor: '#ffffff',
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,'Segoe UI',sans-serif; }
  body { background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;padding:32px; }
  .logo { font-size:20px;font-weight:700;color:#1a1a1a;margin-bottom:6px; }
  .subtitle { font-size:13px;color:#666;margin-bottom:24px; }
  .status { font-size:13px;color:#444;margin-bottom:12px;text-align:center; }
  .bar-bg { width:100%;height:8px;background:#e5e7eb;border-radius:99px;overflow:hidden; }
  .bar-fill { height:100%;background:linear-gradient(90deg,#7c3aed,#a78bfa);border-radius:99px;width:0%;transition:width 0.4s ease; }
  .info { font-size:11px;color:#999;margin-top:10px; }
</style>
</head>
<body>
  <div class="logo">Persis İK</div>
  <div class="subtitle">Güncelleme İndiriliyor</div>
  <div class="status" id="status">Hazırlanıyor...</div>
  <div class="bar-bg"><div class="bar-fill" id="bar"></div></div>
  <div class="info" id="info"></div>
  <script>
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('update-progress', (_, d) => {
      document.getElementById('bar').style.width = d.percent.toFixed(1) + '%';
      document.getElementById('status').textContent = 'İndiriliyor... %' + d.percent.toFixed(1);
      const mb = (d.transferred/1024/1024).toFixed(1);
      const total = (d.total/1024/1024).toFixed(1);
      const speed = (d.bytesPerSecond/1024/1024).toFixed(2);
      document.getElementById('info').textContent = mb + ' MB / ' + total + ' MB • ' + speed + ' MB/s';
    });
    ipcRenderer.on('update-done', () => {
      document.getElementById('bar').style.width = '100%';
      document.getElementById('status').textContent = 'İndirme tamamlandı!';
      document.getElementById('info').textContent = 'Kurulum penceresi açılıyor...';
    });
    ipcRenderer.on('installing', () => {
      document.getElementById('bar').style.width = '100%';
      document.querySelector('.subtitle').textContent = 'Kurulum Yapılıyor';
      document.getElementById('status').textContent = 'Lütfen bekleyin...';
      document.getElementById('info').textContent = 'Program güncelleniyor, bu pencere kapanınca kurulum tamamdır.';
      document.getElementById('bar').style.background = 'linear-gradient(90deg,#059669,#34d399)';
      document.body.style.background = '#f0fdf4';
    });
  </script>
</body>
</html>`;
    updateWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
}

autoUpdater.on('checking-for-update', () => {
    log.info('Güncelleme kontrol ediliyor...');
});

autoUpdater.on('update-available', (info) => {
    log.info('Güncelleme bulundu:', info.version);
    createUpdateWindow();
});

autoUpdater.on('update-not-available', (info) => {
    log.info('Güncelleme yok. Mevcut versiyon güncel:', info.version);
});

autoUpdater.on('download-progress', (progress) => {
    log.info('İndirme:', progress.percent.toFixed(1) + '%');
    if (updateWindow && !updateWindow.isDestroyed()) {
        updateWindow.webContents.send('update-progress', {
            percent: progress.percent,
            transferred: progress.transferred,
            total: progress.total,
            bytesPerSecond: progress.bytesPerSecond
        });
    }
});

autoUpdater.on('update-downloaded', (info) => {
    log.info('Güncelleme indirildi:', info.version);
    if (updateWindow && !updateWindow.isDestroyed()) {
        updateWindow.webContents.send('update-done');
    }
    setTimeout(() => {
        if (updateWindow && !updateWindow.isDestroyed()) updateWindow.destroy();
        // Ana pencereyi öne getir, dialog arkada kalmasın
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.show();
            mainWindow.focus();
        }
        const parentWin = (mainWindow && !mainWindow.isDestroyed()) ? mainWindow : null;
        dialog.showMessageBox(parentWin, {
            type: 'info',
            title: 'Güncelleme Hazır',
            message: `v${info.version} başarıyla indirildi.`,
            detail: 'Uygulama kapatılarak kurulum başlatılacak.',
            buttons: ['Kurulumu Başlat', 'Daha Sonra']
        }).then((result) => {
            if (result.response === 0) {
                isUpdating = true;
                const installerPath = info.downloadedFile;
                log.info('Installer yolu:', installerPath);

                // Progress penceresini "Kuruluyor..." olarak guncelle, kapatma
                if (updateWindow && !updateWindow.isDestroyed()) {
                    updateWindow.webContents.send('installing');
                }

                setTimeout(() => {
                    if (nextProcess) {
                        try {
                            if (process.platform === 'win32') {
                                require('child_process').execSync(`taskkill /pid ${nextProcess.pid} /f /t`);
                            } else {
                                process.kill(-nextProcess.pid);
                            }
                        } catch (e) {
                            log.error('Update oncesi Next.js sonlandirma hatasi:', e);
                        }
                        nextProcess = null;
                    }
                    BrowserWindow.getAllWindows().forEach(win => {
                        if (updateWindow && !updateWindow.isDestroyed() && win.id === updateWindow.id) return;
                        win.removeAllListeners('close');
                        win.removeAllListeners('closed');
                        win.destroy();
                    });
                    // updateWindow'u kurulum bittikten sonra kapat (app.quit kapatir)
                    app.once('quit', () => {
                        if (installerPath) {
                            log.info('Uygulama kapandı, installer başlatılıyor...');
                            const { spawn } = require('child_process');
                            spawn(installerPath, ['--updated'], {
                                detached: true,
                                stdio: 'ignore'
                            }).unref();
                        }
                    });
                    app.quit();
                }, 2000);
            }
        });
    }, 1500);
});

autoUpdater.on('error', (err) => {
    log.error('Güncelleme hatası:', err);
    if (updateWindow && !updateWindow.isDestroyed()) updateWindow.destroy();
    // Hata detayını göster (geliştirme amaçlı, sessiz hata yerine)
    const errMsg = err ? (err.message || err.toString()) : 'Bilinmeyen hata';
    log.error('Güncelleme hata detayı:', errMsg);
});


app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
