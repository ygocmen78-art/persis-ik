@echo off
chcp 65001 >nul
cd /d "C:\Users\muhasebe2\.gemini\antigravity\persis-desktop"

REM GH_TOKEN kayitli mi kontrol et
if "%GH_TOKEN%"=="" (
    echo.
    echo HATA: GH_TOKEN bulunamadi!
    echo Lutfen once ILKEZ_TOKEN_KUR.bat dosyasini calistirin.
    echo.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   Persis IK - Guncelleme Yayinlaniyor
echo ==========================================
echo.
npm run app:publish

echo.
echo Tamamlandi! Kullanicilar programa girince otomatik guncelleme alacak.
pause
