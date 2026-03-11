"use server"

import fs from "fs"
import path from "path"
import { revalidatePath } from "next/cache"
import { exec } from "child_process"

export async function openBackupFolder() {
    try {
        const dbDirectory = process.env.USERDATA_PATH || process.cwd();
        const backupDir = path.join(dbDirectory, 'backups');
        
        // Ensure directory exists
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // Use Platform-specific command exactly suited for Windows
        if (process.platform === 'win32') {
            exec(`start "" "${backupDir}"`);
        } else if (process.platform === 'darwin') {
            exec(`open "${backupDir}"`);
        } else {
            exec(`xdg-open "${backupDir}"`);
        }
        
        return { success: true, message: "Yedek klasörü açılıyor..." };
    } catch (error: any) {
        console.error("Open folder error:", error);
        return { success: false, message: `Klasör açılamadı: ${error.message}` };
    }
}

export async function restoreBackup(formData: FormData) {
    try {
        const file = formData.get("file") as File
        if (!file) {
            return { success: false, message: "Dosya seçilmedi." }
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const dbDirectory = process.env.USERDATA_PATH || process.cwd();
        const dbPath = path.join(dbDirectory, "sqlite.db");
        const backupPath = path.join(dbDirectory, "sqlite.db.bak");

        // 1. Mevcut veritabanını geçici olarak yedekle
        if (fs.existsSync(dbPath)) {
            fs.copyFileSync(dbPath, backupPath)
        }

        // 2. Yeni veritabanı dosyasını yaz
        // Not: sqlite-better3 bağlantısı açıksa burada "busy" hatası alabiliriz.
        // Ancak Next.js Server Action ortamında genellikle dosya yazılabilir.
        fs.writeFileSync(dbPath, buffer)

        revalidatePath("/", "layout")
        return { success: true, message: "Veritabanı başarıyla geri yüklendi. Değişikliklerin tam yansıması için uygulamayı yeniden başlatmanız önerilir." }
    } catch (error: any) {
        console.error("Restore error:", error)
        return { success: false, message: `Geri yükleme hatası: ${error.message}` }
    }
}
