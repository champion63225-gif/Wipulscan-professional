# WiFi Hunter — Native Build Script (Windows)
# Run: .\build-native.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WiFi Hunter — Native Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Sync web assets to native projects
Write-Host "`n[1/4] Syncing web assets..." -ForegroundColor Yellow
npx cap sync

# 2. Check Android
Write-Host "`n[2/4] Android project ready at: .\android" -ForegroundColor Green
Write-Host "Open in Android Studio: npx cap open android" -ForegroundColor Gray

# 3. Check iOS
if (Test-Path ".\ios\App\App.xcodeproj") {
    Write-Host "`n[3/4] iOS project ready at: .\ios" -ForegroundColor Green
    Write-Host "Open in Xcode: npx cap open ios" -ForegroundColor Gray
} else {
    Write-Host "`n[3/4] iOS project not found (macOS only)" -ForegroundColor Red
}

# 4. Build APK (debug)
Write-Host "`n[4/4] Building Android Debug APK..." -ForegroundColor Yellow
Push-Location android
.\gradlew assembleDebug
Pop-Location

if (Test-Path ".\android\app\build\outputs\apk\debug\app-debug.apk") {
    Write-Host "`n✅ SUCCESS! APK built:" -ForegroundColor Green
    Write-Host "   .\android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Cyan
    Write-Host "`nInstall on device: adb install .\android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Gray
} else {
    Write-Host "`n❌ Build failed. Check Android Studio output." -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
