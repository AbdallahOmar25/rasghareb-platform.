@echo off
setlocal
cd /d "%~dp0"

echo =======================================================
echo          منصة رأس غارب - بناء تطبيق الأندرويد
echo =======================================================
echo.

echo [1/3] تحديث ومزامنة ملفات الويب والأيقونات...
call npm.cmd run cap:sync
if errorlevel 1 (
    echo [خطأ] فشلت مزامنة الملفات.
    pause
    exit /b 1
)

echo.
echo [2/3] فحص بيئة الجافا و Gradle...
where java.exe >nul 2>&1
if errorlevel 1 (
    echo [ملاحظة] لم يتم العثور على Java JDK مثبت على المسار العام.
    echo يمكنك فتح المشروع مباشرة عبر Android Studio لبنائه بسهولة:
    echo سيتم الآن محاولة فتح المشروع في Android Studio...
    call npx.cmd cap open android
    echo.
    echo تم إرسال أمر فتح Android Studio.
    echo في Android Studio اضغط: Build -> Build Bundle(s) / APK(s) -> Build APK(s)
    pause
    exit /b 0
)

echo [3/3] جاري تجميع ملف الـ APK (Debug)...
cd android
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo [خطأ] فشل البناء عبر Gradle، يمكنك فتح المشروع في Android Studio.
    cd ..
    call npx.cmd cap open android
    pause
    exit /b 1
)

cd ..
echo.
echo =======================================================
echo [نجاح] تم بناء ملف الـ APK بنجاح!
echo مكان الملف: android\app\build\outputs\apk\debug\app-debug.apk
echo =======================================================
pause

