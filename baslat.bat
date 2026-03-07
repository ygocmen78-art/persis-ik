@echo off
echo ===================================================
echo Uygulama baslatiliyor... (App is starting...)
echo ===================================================
echo.
cd /d "%~dp0"

echo Bagimliliklar kontrol ediliyor...
if not exist node_modules (
    echo node_modules bulunamadi. Yukleniyor...
    call npm install
)

echo.
echo Uygulama calistiriliyor. Lutfen tarayicinizdan su adrese gidin:
echo http://localhost:3000
echo.
echo Durdurmak icin bu pencereyi kapatin veya Ctrl+C tusuna basin.
echo ===================================================
echo.

call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo Bir hata olustu.
    pause
)
