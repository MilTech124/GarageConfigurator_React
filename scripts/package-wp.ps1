$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$pluginDir = Join-Path $root 'wordpress-plugin\configurator-plugin'
$manifestPath = Join-Path $pluginDir 'assets\dist\.vite\manifest.json'
$zipPath = Join-Path $root 'wordpress-plugin\configurator-plugin-wp.zip'

if (-not (Test-Path -LiteralPath $pluginDir)) {
  throw "Plugin directory not found: $pluginDir"
}

if (-not (Test-Path -LiteralPath $manifestPath)) {
  throw "WordPress build manifest not found. Run npm run build:wp first."
}

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  $files = Get-ChildItem -LiteralPath $pluginDir -Recurse -File
  foreach ($file in $files) {
    $relative = $file.FullName.Substring($pluginDir.Length).TrimStart('\', '/')
    $entryName = 'configurator-plugin/' + ($relative -replace '\\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $zip,
      $file.FullName,
      $entryName,
      [System.IO.Compression.CompressionLevel]::Optimal
    ) | Out-Null
  }
} finally {
  $zip.Dispose()
}

Write-Host "Created WordPress plugin package: $zipPath"
