# ApexGear Phase 1A setup script
# Run from repo root:  powershell -ExecutionPolicy Bypass -File scripts/setup-phase1a.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "==> Initializing git (if needed)..." -ForegroundColor Cyan
if (-not (Test-Path .git)) {
  git init -b main
}

Write-Host "==> Installing npm workspaces..." -ForegroundColor Cyan
npm install

Write-Host "==> Generating Prisma client..." -ForegroundColor Cyan
Push-Location apps\api
npx prisma generate

Write-Host "==> Running migrations (requires SQL Server at DATABASE_URL)..." -ForegroundColor Cyan
Write-Host "    Ensure apps/api/.env DATABASE_URL is correct." -ForegroundColor Yellow
npx prisma migrate deploy

Write-Host "==> Applying filtered unique indexes (soft-delete + googleId)..." -ForegroundColor Cyan
# Prefer migrate deploy (includes 20260714183000_filtered_unique_indexes).
# Re-runnable SQL kept for recovery if migration history was baselined without it.
$sqlFile = Join-Path (Get-Location) "prisma\filtered_indexes.sql"
if (Test-Path $sqlFile) {
  sqlcmd -S localhost -d apexgear -E -I -i $sqlFile
  if ($LASTEXITCODE -ne 0) {
    Write-Host "    sqlcmd fallback failed (exit $LASTEXITCODE). If migrate deploy already applied filtered indexes, this is OK." -ForegroundColor Yellow
  }
}

Write-Host "==> Seeding database..." -ForegroundColor Cyan
npx prisma db seed

Pop-Location

Write-Host "==> Starting API (Ctrl+C to stop)..." -ForegroundColor Cyan
npm run dev:api
