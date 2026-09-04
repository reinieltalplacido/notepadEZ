# notepadEZ Windows One-Click Installer
# Usage: irm https://raw.githubusercontent.com/reinieltalplacido/notepadEZ/main/install.ps1 | iex

$ErrorActionPreference = 'Stop'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  📝 Installing notepadEZ..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$repo = "reinieltalplacido/notepadEZ"
$releasesUrl = "https://api.github.com/repos/$repo/releases/latest"

try {
    Write-Host "🔍 Fetching latest release info from GitHub..." -ForegroundColor Yellow
    $release = Invoke-RestMethod -Uri $releasesUrl -Headers @{ "User-Agent" = "PowerShell-Installer" }
    
    # Target Setup exe or installer exe
    $asset = $release.assets | Where-Object { $_.name -like "*Setup*.exe" -or $_.name -like "*.exe" } | Select-Object -First 1

    if (-not $asset) {
        Write-Host "⚠️ No .exe asset found in latest GitHub release." -ForegroundColor Red
        Write-Host "Please build and upload an executable release asset to GitHub Releases." -ForegroundColor Yellow
        return
    }

    $downloadUrl = $asset.browser_download_url
    $tempExePath = Join-Path $env:TEMP $asset.name

    Write-Host "📥 Downloading $($asset.name)..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $downloadUrl -OutFile $tempExePath -UseBasicParsing

    Write-Host "⚡ Launching installer..." -ForegroundColor Green
    Start-Process -FilePath $tempExePath -Wait

    Write-Host "🎉 notepadEZ installed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Installation failed: $_" -ForegroundColor Red
    Write-Host "You can manually download the installer from: https://github.com/$repo/releases" -ForegroundColor Gray
}
