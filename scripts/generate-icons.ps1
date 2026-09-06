Add-Type -AssemblyName System.Drawing

$iconsDir = Join-Path $PSScriptRoot "..\public\icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

$srcPath = Join-Path $PSScriptRoot "..\public\logo.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source logo not found at $srcPath"
    exit 1
}

$srcBytes = [System.IO.File]::ReadAllBytes($srcPath)
$ms = New-Object System.IO.MemoryStream($srcBytes, 0, $srcBytes.Length)
$srcImage = [System.Drawing.Image]::FromStream($ms)

function Export-ResizedPng {
    param(
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height,
        [string]$OutPath,
        [double]$PaddingPercent = 0.0,
        [System.Drawing.Color]$BackgroundColor = [System.Drawing.Color]::Transparent
    )

    $bmp = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear($BackgroundColor)

    $padW = [int]($Width * $PaddingPercent)
    $padH = [int]($Height * $PaddingPercent)
    $drawW = $Width - (2 * $padW)
    $drawH = $Height - (2 * $padH)
    $destRect = New-Object System.Drawing.Rectangle($padW, $padH, $drawW, $drawH)
    
    $g.DrawImage($Image, $destRect)
    $g.Dispose()

    $fullOut = Join-Path $iconsDir $OutPath
    $bmp.Save($fullOut, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created: $fullOut ($Width x $Height)"
}

# 1. Standard 192x192
Export-ResizedPng -Image $srcImage -Width 192 -Height 192 -OutPath "icon-192.png"

# 2. Standard 512x512
Export-ResizedPng -Image $srcImage -Width 512 -Height 512 -OutPath "icon-512.png"

# 3. Maskable 512x512 with safe-zone margin (12% padding on background)
$bg = [System.Drawing.Color]::FromArgb(255, 247, 248, 250)
Export-ResizedPng -Image $srcImage -Width 512 -Height 512 -OutPath "icon-maskable-512.png" -PaddingPercent 0.12 -BackgroundColor $bg

# 4. Apple Touch Icon 180x180 (iOS Home Screen)
Export-ResizedPng -Image $srcImage -Width 180 -Height 180 -OutPath "apple-touch-icon.png"

# 5. Monochrome / Alpha Notification Badge 96x96
Export-ResizedPng -Image $srcImage -Width 96 -Height 96 -OutPath "notification-badge.png"

$srcImage.Dispose()
$ms.Dispose()
Write-Host "All PWA icons generated successfully!"
