# Script tu dong build lai va cap nhat UI len dien thoai
Write-Host "`n=== DANG CAP NHAT CODE UI MOI LEN DIEN THOAI ===" -ForegroundColor Cyan

# 1. Build APK
Write-Host "[1/4] Dang build lai APK (dong goi ma UI moi)..." -ForegroundColor Yellow
Set-Location E:\Alumnect\alumnect-mobile\android
.\gradlew.bat app:assembleRelease -x lint -x test

if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Build that bai! Vui long kiem tra loi tren." -ForegroundColor Red
    Set-Location E:\Alumnect
    exit 1
}

# 2. Cai dat APK len dien thoai
Write-Host "`n[2/4] Dang cai de APK len dien thoai..." -ForegroundColor Yellow
$apk = Get-ChildItem app\build\outputs\apk\release\*.apk | Select-Object -First 1
adb install -r $apk.FullName

# 3. Thong cong mang Backend
Write-Host "`n[3/4] Kich hoat adb reverse cong 8081 (Metro). Backend dung VPS nen khong can 8080..." -ForegroundColor Yellow
adb reverse tcp:8081 tcp:8081

# 4. Khoi chay lai App
Write-Host "`n[4/4] Dang khoi chay lai Alumnect tren dien thoai..." -ForegroundColor Yellow
adb shell monkey -p vn.edu.fpt.alumnect -c android.intent.category.LAUNCHER 1

# Kiem tra mo scrcpy neu chua co
$scrcpy = Get-Process scrcpy -ErrorAction SilentlyContinue
if (-not $scrcpy) {
    Start-Process scrcpy
}

Set-Location E:\Alumnect
Write-Host "`n>>> HOAN TAT! App da duoc cap nhat giao dien moi nhat!" -ForegroundColor Green

