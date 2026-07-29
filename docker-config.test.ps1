$ErrorActionPreference = 'Stop'

function Assert-Contains([string]$Content, [string]$Pattern, [string]$Message) {
  if ($Content -notmatch $Pattern) { throw $Message }
}

function Assert-NotContains([string]$Content, [string]$Pattern, [string]$Message) {
  if ($Content -match $Pattern) { throw $Message }
}

$dockerfile = (Get-Content "$PSScriptRoot/Dockerfile" -Raw) -replace "`r`n", "`n"
$compose = (Get-Content "$PSScriptRoot/docker-compose.yml" -Raw) -replace "`r`n", "`n"
$entrypoint = (Get-Content "$PSScriptRoot/docker/api-entrypoint.sh" -Raw) -replace "`r`n", "`n"
$snapshot = "$PSScriptRoot/apps/api/scripts/crawler/output/demo-data.json"

Assert-Contains $dockerfile '(?m)^FROM .* AS mssql$' 'Dockerfile must define the mssql target.'
Assert-Contains $dockerfile 'mssql-server-fts' 'SQL Server image must install Full-Text Search.'
Assert-Contains $dockerfile '(?m)^FROM .* AS bootstrap$' 'Dockerfile must define the bootstrap target.'
Assert-Contains $dockerfile 'COPY apps/api/scripts/crawler/output/demo-data\.json /app/apps/api/scripts/crawler/output/demo-data\.json' 'Bootstrap image must copy demo-data.json into the API image.'
Assert-Contains $dockerfile 'sed -i' 'Bootstrap image must normalize API entrypoint line endings.'
Assert-Contains $entrypoint 'prisma migrate deploy' 'API bootstrap must deploy migrations.'
Assert-Contains $entrypoint 'DEMO_SNAPSHOT=1 npx prisma db seed' 'API bootstrap must seed only the demo accounts before snapshot restore.'
Assert-Contains $entrypoint 'seed:snapshot' 'API bootstrap must restore the selected demo snapshot.'
Assert-NotContains $entrypoint 'seed:crawled' 'API bootstrap must not seed crawler data.'
Assert-NotContains $entrypoint 'exec node dist/src/main' 'API bootstrap must not start the API server (HR runs npm run dev locally).'
Assert-NotContains $entrypoint 'RAW_DATABASE_URL|db:raw:push|gearvn_raw' 'API bootstrap must not use the raw crawler database.'
Assert-NotContains $compose 'RAW_DATABASE_URL|db:raw:push|gearvn_raw' 'Compose must not use the raw crawler database.'
Assert-Contains $compose '(?m)^  mssql:' 'Compose must define mssql.'
Assert-Contains $compose '(?m)^  db-bootstrap:' 'Compose must define db-bootstrap.'
Assert-NotContains $compose '(?m)^  api:' 'Compose must not define an api service (HR runs dev servers locally).'
Assert-NotContains $compose '(?m)^  web:' 'Compose must not define a web service (HR runs dev servers locally).'
Assert-NotContains $compose '(?m)^  admin:' 'Compose must not define an admin service (HR runs dev servers locally).'
if (-not (Test-Path $snapshot)) { throw 'demo-data.json is required.' }
& git -C $PSScriptRoot ls-files --error-unmatch 'apps/api/scripts/crawler/output/demo-data.json' *> $null
if ($LASTEXITCODE -ne 0) { throw 'demo-data.json must be tracked.' }

Write-Output 'Docker config self-check passed.'
