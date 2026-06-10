@echo off
chcp 65001 >nul
echo.
echo ==========================================
echo   Persis IK - GitHub Token Kurulumu
echo ==========================================
echo.
echo Bu pencere SADECE BIR KEZ acilir.
echo Token'i girdikten sonra bir daha sormaz.
echo.
echo Token almak icin:
echo 1. https://github.com/settings/tokens adresine gidin
echo 2. "Generate new token (classic)" tiklayin
echo 3. "repo" kutucugunu isaretle
echo 4. "Generate token" tiklayin
echo 5. Cikan kodu kopyala ve asagiya yapistir
echo.
set /p TOKEN=GitHub Token: 

if "%TOKEN%"=="" (
    echo HATA: Token bos birakıldı!
    pause
    exit /b 1
)

REM Windows kullanıcı environment'a kalici kaydet
setx GH_TOKEN "%TOKEN%" >nul

echo.
echo Token kaydedildi! Artik otomatik yayinlama calısacak.
echo.
echo Simdi guncelleme yayinlaniyor...
echo.

set GH_TOKEN=%TOKEN%
cd /d "C:\Users\muhasebe2\.gemini\antigravity\persis-desktop"
npm run app:publish

echo.
echo Tamamlandi! Bu dosyayi silebilirsiniz.
pause
