# Run TRPB on this machine using the portable Node.js and MongoDB in .tools/
# (used because Windows Application Control blocks the MSI installers here).
#
#   powershell -ExecutionPolicy Bypass -File scripts\dev-local.ps1          # start Mongo + API + web
#   powershell -ExecutionPolicy Bypass -File scripts\dev-local.ps1 -Seed    # reseed first

param([switch]$Seed)

$root  = Split-Path -Parent $PSScriptRoot
$node  = Get-ChildItem "$root\.tools" -Directory -Filter 'node-v*' | Select-Object -First 1
$mongo = Get-ChildItem "$root\.tools" -Directory -Filter 'mongodb-*' | Select-Object -First 1
if (-not $node -or -not $mongo) { throw "Portable Node/MongoDB not found in $root\.tools" }

$env:Path = "$($node.FullName);$env:Path"

if (-not (Get-NetTCPConnection -LocalPort 27017 -State Listen -ErrorAction SilentlyContinue)) {
  New-Item -ItemType Directory -Force "$root\.mongo-data" | Out-Null
  Start-Process -WindowStyle Hidden -FilePath "$($mongo.FullName)\bin\mongod.exe" `
    -ArgumentList '--dbpath', "`"$root\.mongo-data`"", '--bind_ip', '127.0.0.1', '--port', '27017', '--quiet'
  Write-Host 'Started MongoDB on 127.0.0.1:27017'
  Start-Sleep -Seconds 2
}

Set-Location $root
if ($Seed) { npm run seed }
npm run dev
