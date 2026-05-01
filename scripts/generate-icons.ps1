# Generate all app icon sizes from a source PNG
# Usage: pwsh scripts/generate-icons.ps1 -Source "path/to/icon.png"
param(
    [Parameter(Mandatory=$true)]
    [string]$Source
)

Add-Type -AssemblyName System.Drawing

if (!(Test-Path $Source)) {
    Write-Error "Source file not found: $Source"
    exit 1
}

$src = [System.Drawing.Image]::FromFile((Resolve-Path $Source).Path)
Write-Host "Source: $($src.Width)x$($src.Height)"

$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Leaf
$webPublic = Join-Path $PSScriptRoot "..\public"
$flutterIcon = Join-Path $PSScriptRoot "..\flutter_app\assets\icon"

# Ensure directories exist
New-Item -ItemType Directory -Force -Path $webPublic | Out-Null
New-Item -ItemType Directory -Force -Path $flutterIcon | Out-Null

function Resize-Image {
    param([System.Drawing.Image]$img, [int]$size, [string]$outPath)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($img, 0, 0, $size, $size)
    $g.Dispose()
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "  -> $outPath ($size x $size)"
}

Write-Host "`nGenerating Web icons..."
Resize-Image $src 512 (Join-Path $webPublic "icon-512.png")
Resize-Image $src 192 (Join-Path $webPublic "icon-192.png")
Resize-Image $src 180 (Join-Path $webPublic "apple-touch-icon.png")
Resize-Image $src 32  (Join-Path $webPublic "favicon-32.png")
Resize-Image $src 16  (Join-Path $webPublic "favicon-16.png")

# Generate ICO (32x32)
$ico32 = New-Object System.Drawing.Bitmap(32, 32)
$g = [System.Drawing.Graphics]::FromImage($ico32)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, 0, 0, 32, 32)
$g.Dispose()
$icoPath = Join-Path $webPublic "favicon.ico"
$ico32.Save($icoPath, [System.Drawing.Imaging.ImageFormat]::Icon)
$ico32.Dispose()
Write-Host "  -> $icoPath (32x32 ICO)"

Write-Host "`nGenerating Flutter icons..."
Resize-Image $src 1024 (Join-Path $flutterIcon "app_icon.png")
Resize-Image $src 1024 (Join-Path $flutterIcon "app_icon_fg.png")

$src.Dispose()
Write-Host "`nDone! All icons generated."
Write-Host "Next steps:"
Write-Host "  1. Web: Icons are in public/ - ready to use"
Write-Host "  2. Flutter: Run 'flutter pub run flutter_launcher_icons' in flutter_app/"
