<#
.SYNOPSIS
    Script tu dong kiem tra, giai phong cong, build lai va chay Alumnect Mobile tren Android.

.DESCRIPTION
    1. Tu dong kiem tra va thiet lap JAVA_HOME, ANDROID_HOME.
    2. Kiem tra ket noi thiet bi qua ADB (dien thoai that / may ao).
    3. Tu dong quet va dong (kill) cac tien trinh treo chiem giu cong Metro (8081, 8082).
    4. Thiet lap reverse port 8081 cho Metro Bundler.
    5. Tu dong mo scrcpy chieu man hinh dien thoai (neu chua mo).
    6. Ho tro don dep sach cache (--Clean) bang gradlew clean.
    7. Build APK va khoi chay ung dung tren dien thoai.

.PARAMETER Variant
    Kieu build: 'release' (mac dinh - chay muot, it lag) hoac 'debug'.

.PARAMETER Clean
    Don dep triet de cache Gradle truoc khi build.

.PARAMETER NoScrcpy
    Khong mo cua so chieu man hinh scrcpy.

.PARAMETER Ports
    Danh sach cac port can giai phong truoc khi chay (mac dinh: 8081, 8082).

.PARAMETER NoKillPort
    Bo qua buoc kill port neu muon tu quan ly.

.EXAMPLE
    .\rebuild-mobile.ps1
    # Tu dong kill port 8081 neu dang bi chiem, build release va chay len dien thoai

.EXAMPLE
    .\rebuild-mobile.ps1 -Clean
    # Giai phong port, xoa sach cache Gradle roi build lai tu dau

.EXAMPLE
    .\rebuild-mobile.ps1 -Variant debug
    # Build ban debug co Dev Menu day du
#>

[CmdletBinding()]
param (
    [ValidateSet("release", "debug")]
    [string]$Variant = "release",

    [switch]$Clean,

    [switch]$NoScrcpy,

    [int[]]$Ports = @(8081, 8082),

    [switch]$NoKillPort
)

$ErrorActionPreference = "Continue"
$ScriptDir = $PSScriptRoot
$MobileDir = Join-Path $ScriptDir "alumnect-mobile"
$AndroidDir = Join-Path $MobileDir "android"

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "        ALUMNECT MOBILE - BUILD & RUN HELPER" -ForegroundColor Cyan
Write-Host "=======================================================`n" -ForegroundColor Cyan

# -------------------------------------------------------------
# Ham ho tro: Giai phong port dang bi chiem
# -------------------------------------------------------------
function Stop-PortProcess {
    param ([int[]]$TargetPorts)
    foreach ($p in $TargetPorts) {
        $pids = @()
        try {
            $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
            if ($conns) {
                $pids += ($conns | Select-Object -ExpandProperty OwningProcess -Unique)
            }
        } catch {}

        # Fallback bang netstat neu Get-NetTCPConnection bi chan quyen hoac khong thay
        if ($pids.Count -eq 0) {
            try {
                $lines = netstat -ano | Select-String ":$p\s+"
                foreach ($line in $lines) {
                    $parts = ($line.ToString().Trim() -split '\s+')
                    if ($parts.Count -ge 5) {
                        $pidCandidate = [int]$parts[-1]
                        if ($pidCandidate -gt 4) { $pids += $pidCandidate }
                    }
                }
            } catch {}
        }

        $uniquePids = @($pids | Select-Object -Unique)
        if ($uniquePids.Count -gt 0) {
            foreach ($pidToKill in $uniquePids) {
                if ($pidToKill -gt 4) {
                    try {
                        $proc = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue
                        $procName = if ($proc) { $proc.ProcessName } else { "PID $pidToKill" }
                        Write-Host "  -> Dang tat tien trinh '$procName' (PID $pidToKill) dang chiem cong $p..." -ForegroundColor Yellow
                        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                        Start-Sleep -Milliseconds 300
                        Write-Host "  [OK] Da giai phong cong $p thanh cong." -ForegroundColor Green
                    } catch {
                        Write-Host "  [!] Khong the dong tien trinh PID $($pidToKill): $_" -ForegroundColor DarkGray
                    }
                }
            }
        } else {
            Write-Host "  [OK] Cong $p dang trong (san sang)." -ForegroundColor Green
        }
    }
}

# -------------------------------------------------------------
# 1. Thiet lap & Kiem tra bien moi truong (Java, Android SDK)
# -------------------------------------------------------------
Write-Host "[1/6] Kiem tra moi truong phat trien..." -ForegroundColor Yellow

if (-not $env:JAVA_HOME) {
    $jbrPath = "C:\Program Files\Android\Android Studio\jbr"
    if (Test-Path $jbrPath) {
        $env:JAVA_HOME = $jbrPath
        $env:PATH = "$jbrPath\bin;" + $env:PATH
        Write-Host "  -> Tu dong gan JAVA_HOME = $jbrPath" -ForegroundColor DarkGray
    }
}

if (-not $env:ANDROID_HOME) {
    $sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
    if (Test-Path $sdkPath) {
        $env:ANDROID_HOME = $sdkPath
        $env:PATH = "$sdkPath\platform-tools;" + $env:PATH
        Write-Host "  -> Tu dong gan ANDROID_HOME = $sdkPath" -ForegroundColor DarkGray
    }
}

# Tang dung luong Node.js Heap an toan (2GB) cho he thong 8GB RAM
$env:NODE_OPTIONS = "--max-old-space-size=2048"

if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
    Write-Host "[X] Khong tim thay lenh 'adb'. Hay cai dat Android Platform Tools hoac them vao PATH." -ForegroundColor Red
    exit 1
}

Write-Host "  [OK] Java va Android SDK da san sang." -ForegroundColor Green

# -------------------------------------------------------------
# 2. Giai phong cac port bi chiem (Metro 8081, 8082...)
# -------------------------------------------------------------
if (-not $NoKillPort) {
    Write-Host "[2/6] Kiem tra va giai phong cac port bi chiem..." -ForegroundColor Yellow
    Stop-PortProcess -TargetPorts $Ports
} else {
    Write-Host "[2/6] Bo qua giai phong port theo yeu cau (-NoKillPort)." -ForegroundColor DarkGray
}

# -------------------------------------------------------------
# 3. Kiem tra thiet bi Android qua ADB
# -------------------------------------------------------------
Write-Host "[3/6] Kiem tra ket noi thiet bi qua ADB..." -ForegroundColor Yellow
$rawAdb = @(adb devices)
$adbText = $rawAdb -join "`n"

if ($adbText -match "unauthorized") {
    Write-Host "`n[!] Dien thoai dang o trang thai: UNAUTHORIZED" -ForegroundColor Red
    Write-Host ">>> Hay mo man hinh dien thoai len, ban se thay hop thoai:" -ForegroundColor Magenta
    Write-Host "    'Cho phep go loi USB? (Allow USB debugging?)'" -ForegroundColor Magenta
    Write-Host ">>> Tich chon 'Luon cho phep tu may tinh nay' va bam 'Cho phep' (OK)!" -ForegroundColor Magenta
    exit 1
}

$deviceLines = @($rawAdb | Where-Object { $_ -match "\s+device$" })
if ($deviceLines.Count -eq 0) {
    Write-Host "`n[!] Khong tim thay thiet bi Android nao dang ket noi." -ForegroundColor Red
    Write-Host "    - Hay dam bao da cam cap USB chac chan hoac bat may ao (Emulator)." -ForegroundColor Red
    Write-Host "    - Kiem tra 'Go loi qua USB' (USB Debugging) trong Tuy chon nha phat trien." -ForegroundColor Red
    exit 1
}

$firstDeviceLine = $deviceLines[0].Trim()
$deviceId = ($firstDeviceLine -split "\s+")[0]
$deviceModel = (adb -s $deviceId shell getprop ro.product.model 2>$null)
if ($deviceModel) { $deviceModel = $deviceModel.Trim() } else { $deviceModel = "Android Device" }
Write-Host "  [OK] Da ket noi thiet bi: $deviceModel (ID: $deviceId)" -ForegroundColor Green

# -------------------------------------------------------------
# 4. Chieu man hinh bang scrcpy (neu co)
# -------------------------------------------------------------
if (-not $NoScrcpy) {
    Write-Host "[4/6] Kiem tra scrcpy chieu man hinh..." -ForegroundColor Yellow
    $scrcpyRunning = Get-Process scrcpy -ErrorAction SilentlyContinue
    if ($scrcpyRunning) {
        Write-Host "  [OK] Cua so scrcpy dang mo san." -ForegroundColor DarkGray
    } elseif (Get-Command scrcpy -ErrorAction SilentlyContinue) {
        Write-Host "  -> Khoi chay scrcpy trong nen..." -ForegroundColor DarkGray
        Start-Process scrcpy -WindowStyle Normal
        Write-Host "  [OK] Da mo scrcpy chieu man hinh!" -ForegroundColor Green
    } else {
        Write-Host "  (Bo qua scrcpy vi chua duoc cai dat trong PATH)" -ForegroundColor DarkGray
    }
} else {
    Write-Host "[4/6] Bo qua scrcpy theo yeu cau (-NoScrcpy)." -ForegroundColor DarkGray
}

# -------------------------------------------------------------
# 5. Thiet lap Reverse Port cho Metro Bundler
# -------------------------------------------------------------
Write-Host "[5/6] Chuyen huong cong 8081 (Metro) den dien thoai..." -ForegroundColor Yellow
adb -s $deviceId reverse tcp:8081 tcp:8081 | Out-Null
Write-Host "  [OK] Da noi cong tcp:8081 <-> tcp:8081." -ForegroundColor Green

# -------------------------------------------------------------
# 6. Build va chay Mobile App
# -------------------------------------------------------------
Write-Host "[6/6] Chuan bi build va khoi chay ($Variant mode)..." -ForegroundColor Yellow

if (-not (Test-Path $MobileDir)) {
    Write-Host "[X] Khong tim thay thu muc: $MobileDir" -ForegroundColor Red
    exit 1
}

# Neu nguoi dung yeu cau don dep cache
if ($Clean) {
    Write-Host "  -> Dang don dep sach cache Gradle (gradlew clean)..." -ForegroundColor Magenta
    Push-Location $AndroidDir
    try {
        & .\gradlew.bat clean
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[!] Canh bao: gradlew clean co loi nhung se tiep tuc build." -ForegroundColor Yellow
        } else {
            Write-Host "  [OK] Da don dep Gradle cache thanh cong." -ForegroundColor Green
        }
    } finally {
        Pop-Location
    }
}

Set-Location $MobileDir

Write-Host "`n>>> DANG TIEN HANH BUILD & RUN ALUMNECT MOBILE..." -ForegroundColor Cyan

if ($Variant -eq "release") {
    Write-Host "    Chế độ Release: Biên dịch trực tiếp bằng Gradle và nạp APK qua ADB`n" -ForegroundColor White
    Push-Location $AndroidDir
    try {
        Write-Host "    [1/3] Biên dịch APK Release bằng Gradle..." -ForegroundColor White
        if ($Clean) {
            & .\gradlew.bat app:assembleRelease -x lint -x test --no-build-cache
        } else {
            & .\gradlew.bat app:assembleRelease -x lint -x test
        }
        if ($LASTEXITCODE -ne 0) {
            Write-Host "`n[X] Biên dịch Gradle thất bại với mã lỗi: $LASTEXITCODE" -ForegroundColor Red
            exit $LASTEXITCODE
        }

        $apkPath = Join-Path $AndroidDir "app\build\outputs\apk\release\app-release.apk"
        if (-not (Test-Path $apkPath)) {
            Write-Host "`n[X] Không tìm thấy file APK tại: $apkPath" -ForegroundColor Red
            exit 1
        }

        Write-Host "    [2/3] Cài đặt APK Release lên $deviceModel..." -ForegroundColor White
        & adb -s $deviceId install -r $apkPath
        if ($LASTEXITCODE -ne 0) {
            Write-Host "`n[X] Cài đặt APK qua ADB thất bại!" -ForegroundColor Red
            exit $LASTEXITCODE
        }

        Write-Host "    [3/3] Khởi chạy Alumnect trên điện thoại..." -ForegroundColor White
        & adb -s $deviceId shell am start -n vn.edu.fpt.alumnect/vn.edu.fpt.alumnect.MainActivity
    } finally {
        Pop-Location
    }
} else {
    Write-Host "    Lenh: npx expo run:android --variant debug`n" -ForegroundColor White
    if ($Clean) {
        npx expo run:android --variant debug --no-build-cache
    } else {
        npx expo run:android --variant debug
    }
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[X] Build that bai voi ma loi: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Goi y khac phuc:" -ForegroundColor Yellow
    Write-Host "  1. Chay thu voi co Clean: .\rebuild-mobile.ps1 -Clean" -ForegroundColor Yellow
    Write-Host "  2. Kiem tra keystore bang script: .\setup-keystore.ps1" -ForegroundColor Yellow
    Write-Host "  3. Dam bao man hinh dien thoai da mo khoa de chap nhan cai dat APK." -ForegroundColor Yellow
    exit $LASTEXITCODE
}

Write-Host "`n[OK] Chuc mung! Alumnect Mobile da duoc build va cai dat thanh cong len $deviceModel!" -ForegroundColor Green
