@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo          رفع منصة وتطبيقات رأس غارب إلى GitHub
echo ============================================================
echo.
echo جاري الرفع إلى المستودع:
echo https://github.com/AbdallahOmar25/rasghareb-platform.
echo.

git push -u origin main

if errorlevel 1 (
    echo.
    echo [ملاحظة] إذا طلب منك تسجيل الدخول، اختر (Sign in with your browser)
    echo أو تأكد من إكمال المصادقة.
    echo.
) else (
    echo.
    echo ============================================================
    echo [نجاح] تم رفع جميع ملفات المشروع إلى GitHub بنجاح!
    echo رابط مستودعك: https://github.com/AbdallahOmar25/rasghareb-platform.
    echo ============================================================
)

echo.
pause
