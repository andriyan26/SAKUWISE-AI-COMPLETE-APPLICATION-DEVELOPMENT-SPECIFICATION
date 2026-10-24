Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$distPath = (Resolve-Path 'client/dist').Path
$zipPath = Join-Path (Resolve-Path '.').Path 'sakuwise-ai-hostinger.zip'

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)

$files = Get-ChildItem -Path $distPath -Recurse -File
foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($distPath.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relativePath, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
}

$zip.Dispose()
Write-Host "ZIP created successfully with forward slashes: sakuwise-ai-hostinger.zip"

