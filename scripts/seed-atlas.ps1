# Seed the LIVE MongoDB Atlas database using the values in server\.env.atlas.
#   powershell -ExecutionPolicy Bypass -File scripts\seed-atlas.ps1
# WARNING: wipes and re-creates all TRPB data in that database.

$root = Split-Path -Parent $PSScriptRoot
$node = Get-ChildItem "$root\.tools" -Directory -Filter 'node-v*' -ErrorAction SilentlyContinue | Select-Object -First 1
if ($node) { $env:Path = "$($node.FullName);$env:Path" }

$envFile = Join-Path $root 'server\.env.atlas'
$values = Get-Content $envFile | Where-Object { $_ -match '^(MONGODB_URI|ADMIN_EMAIL|ADMIN_PASSWORD)=(.+)$' }
if ($values.Count -lt 3) { throw "Fill in MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD in $envFile first." }

Set-Location (Join-Path $root 'server')
$env:DOTENV_CONFIG_PATH = $envFile   # dotenv/config reads this file instead of .env
node src/seed/seed.js
