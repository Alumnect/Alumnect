# ==============================================================================
# Script Khởi Chạy & Cập Nhật Giao Diện Alumnect Mobile + Mở Màn Hình Điện Thoại
# ==============================================================================
[CmdletBinding()]
param (
    [switch]$ClearCache, # Xóa cache Metro Bundler (npx expo start -c)
    [switch]$ReloadOnly  # Chỉ reload lại app trên điện thoại, không bật lại server
)

$ErrorActionPreference = "Continue"

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "     ALUMNECT MOBILE - AUTO LAUNCH & MIRROR TOOL        " -ForegroundColor Cyan
Write-Host "=======================================================`n" -ForegroundColor Cyan

# 1. Xác định thư mục dự án
$rootDir = $PSScriptRoot
if (-not $rootDir -or -not (Test-Path $rootDir)) {
    $rootDir = (Get-Location).Path
}
$mobileDir = Join-Path $rootDir "alumnect-mobile"
if (-not (Test-Path $mobileDir)) {
    Write-Host "[!] Khong tim thay thu muc alumnect-mobile tai: $mobileDir" -ForegroundColor Red
    exit 1
}

# 2. Tìm công cụ ADB (Android Debug Bridge)
$adb = "adb"
if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
    $foundAdb = Get-ChildItem -Path "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Filter "adb.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    if (-not $foundAdb) {
        $foundAdb = Get-ChildItem -Path "$env:LOCALAPPDATA\Android\Sdk\platform-tools" -Filter "adb.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    }
    if ($foundAdb) { $adb = $foundAdb }
}

# 3. Tìm công cụ SCRCPY (Chiếu màn hình điện thoại)
$scrcpy = "scrcpy"
$scrcpyDir = ""
if (-not (Get-Command scrcpy -ErrorAction SilentlyContinue)) {
    $foundScrcpy = Get-ChildItem -Path "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Filter "scrcpy.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    if ($foundScrcpy) { 
        $scrcpy = $foundScrcpy 
        $scrcpyDir = Split-Path $scrcpy
    }
} else {
    $cmd = Get-Command scrcpy
    $scrcpyDir = Split-Path $cmd.Source
}

# 4. Kiểm tra kết nối thiết bị qua USB
Write-Host "[1/5] Kiem tra ket noi dien thoai qua ADB..." -ForegroundColor Yellow
& $adb start-server 2>$null | Out-Null
$devices = & $adb devices | Where-Object { $_ -match "\bdevice\b" }

if (-not $devices) {
    Write-Host "[!] Chua tim thay dien thoai nao duoc ket noi qua cap USB!" -ForegroundColor Red
    Write-Host "    -> Vui long cam cap USB va bat 'Che do go loi USB' (USB Debugging) tren dien thoai." -ForegroundColor Gray
    Write-Host "    -> Cho den khi dien thoai hien thong bao 'Cho phep go loi USB' thi bam OK.`n" -ForegroundColor Gray
} else {
    $devName = ($devices | Select-Object -First 1) -replace "\s+device.*", ""
    Write-Host "  -> Da ket noi thiet bi: $devName" -ForegroundColor Green
}

# 5. Thiết lập cổng mạng đảo chiều (Reverse Port 8081 cho Metro Bundler)
Write-Host "`n[2/5] Thong cong mang USB: adb reverse tcp:8081 tcp:8081..." -ForegroundColor Yellow
& $adb reverse tcp:8081 tcp:8081 2>$null
Write-Host "  -> Cong 8081 da duoc forward truc tiep vao dien thoai." -ForegroundColor Green

# 6. Kiểm tra & Khởi động Expo Metro Bundler (Nếu chưa chạy)
Write-Host "`n[3/5] Kiem tra Expo Metro Bundler tren may tinh..." -ForegroundColor Yellow
$metroListening = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue

if (-not $metroListening -and -not $ReloadOnly) {
    Write-Host "  -> Metro Bundler chua chay. Dang mo cua so chay Expo moi..." -ForegroundColor Cyan
    $expoCmd = "npx expo start"
    if ($ClearCache) { $expoCmd = "npx expo start --clear" }
    
    $startScript = @"
Write-Host '===================================================' -ForegroundColor Cyan
Write-Host '       ALUMNECT MOBILE - EXPO METRO BUNDLER        ' -ForegroundColor Cyan
Write-Host '===================================================' -ForegroundColor Cyan
Set-Location '$mobileDir'
$expoCmd
"@
    Start-Process powershell -WorkingDirectory $mobileDir -ArgumentList "-NoExit", "-Command", $startScript
    Write-Host "  -> Dang doi Metro Bundler san sang tren cong 8081..." -ForegroundColor Gray
    
    # Đợi tối đa 15 giây để port 8081 sẵn sàng
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Seconds 1
        $metroListening = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
        if ($metroListening) { break }
    }
}

if ($metroListening) {
    Write-Host "  -> Metro Bundler da san sang (Port 8081: ACTIVE)." -ForegroundColor Green
} else {
    Write-Host "  -> Cua so Expo Metro da duoc mo. Vui long doi vai giay de Metro khoi dong xong." -ForegroundColor Yellow
}

# 7. Đánh thức màn hình điện thoại & Khởi chạy ứng dụng Alumnect
Write-Host "`n[4/5] Danh thuc man hinh & Khoi chay Alumnect tren dien thoai..." -ForegroundColor Yellow
& $adb shell input keyevent KEYCODE_WAKEUP 2>$null
# Mở trực tiếp dự án trên Expo Go qua giao thức deep-link exp://
& $adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" host.exp.exponent 2>$null | Out-Null
Write-Host "  -> Da gui lenh mo Alumnect tren Expo Go len dien thoai!" -ForegroundColor Green

# 8. Mở cửa sổ chiếu màn hình điện thoại (scrcpy) lên máy tính
Write-Host "`n[5/5] Khoi dong cua so chieu man hinh dien thoai (scrcpy)..." -ForegroundColor Yellow
$env:ADB = $adb

# Đóng tiến trình scrcpy cũ (nếu bị treo hoặc ẩn) để bật cửa sổ mới lên trên cùng
$oldScrcpy = Get-Process scrcpy -ErrorAction SilentlyContinue
if ($oldScrcpy) {
    Stop-Process -Name scrcpy -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 400
}

Write-Host "  -> Dang bat cua so moi chieu man hinh dien thoai len may tinh..." -ForegroundColor Cyan
$scrcpyArgs = @("--stay-awake", "--always-on-top", "--window-title=`"Alumnect Mobile`"")
if ($devName) {
    $scrcpyArgs = @("-s", $devName) + $scrcpyArgs
}

if ($scrcpyDir -and (Test-Path $scrcpyDir)) {
    Start-Process -FilePath $scrcpy -WorkingDirectory $scrcpyDir -ArgumentList $scrcpyArgs -WindowStyle Normal
} else {
    Start-Process -FilePath $scrcpy -ArgumentList $scrcpyArgs -WindowStyle Normal
}
Write-Host "  -> Cua so chieu man hinh dien thoai da duoc bat!" -ForegroundColor Green

Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host ">>> HOAN TAT! Ung dung da chay va mo cua so rieng!  <<<" -ForegroundColor Green
Write-Host "=======================================================`n" -ForegroundColor Green
