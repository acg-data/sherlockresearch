# Sherlock Backend — one-shot Cloudflare setup.
# Run this AFTER `npx wrangler login` has succeeded.

$ErrorActionPreference = "Stop"

function Write-Step($n, $msg) {
  Write-Host "`n[$n] $msg" -ForegroundColor Cyan
}

function Write-Ok($msg) {
  Write-Host "  ✓ $msg" -ForegroundColor Green
}

# Verify we're authenticated
Write-Step 0 "Verifying wrangler login..."
$whoami = & npx wrangler whoami 2>&1 | Out-String
if ($whoami -match "not authenticated") {
  Write-Host "  ✗ Not logged in. Run 'npx wrangler login' first, then re-run this script." -ForegroundColor Red
  exit 1
}
Write-Ok "Authenticated"

# Step 1: Create D1 database (idempotent — won't error if already exists)
Write-Step 1 "Creating D1 database 'sherlock-research'..."
$d1Output = & npx wrangler d1 create sherlock-research 2>&1 | Out-String
$databaseId = $null
if ($d1Output -match 'database_id\s*=\s*"([0-9a-f-]+)"') {
  $databaseId = $matches[1]
  Write-Ok "Created D1: $databaseId"
} elseif ($d1Output -match "already exists") {
  Write-Host "  ℹ Database already exists — fetching ID via 'd1 list'..." -ForegroundColor Yellow
  $listOutput = & npx wrangler d1 list --json 2>&1 | Out-String
  $list = $listOutput | ConvertFrom-Json
  $existing = $list | Where-Object { $_.name -eq "sherlock-research" } | Select-Object -First 1
  if ($existing -and $existing.uuid) {
    $databaseId = $existing.uuid
    Write-Ok "Found existing D1: $databaseId"
  } else {
    Write-Host "  ✗ Couldn't find database in list output. Manual fix needed." -ForegroundColor Red
    Write-Host $listOutput
    exit 1
  }
} else {
  Write-Host "  ✗ Unexpected output from 'd1 create':" -ForegroundColor Red
  Write-Host $d1Output
  exit 1
}

# Step 2: Patch wrangler.toml with the database_id
Write-Step 2 "Patching wrangler.toml with database_id..."
$tomlPath = Join-Path $PSScriptRoot "wrangler.toml"
$toml = Get-Content $tomlPath -Raw
$patched = $toml -replace 'database_id\s*=\s*"[^"]*"', "database_id = `"$databaseId`""
if ($patched -eq $toml) {
  Write-Host "  ✗ Pattern not matched in wrangler.toml — file format may have changed." -ForegroundColor Red
  exit 1
}
Set-Content -Path $tomlPath -Value $patched -NoNewline -Encoding utf8
Write-Ok "wrangler.toml updated"

# Step 3: Create R2 bucket (idempotent)
Write-Step 3 "Creating R2 bucket 'sherlock-reports'..."
$r2Output = & npx wrangler r2 bucket create sherlock-reports 2>&1 | Out-String
if ($r2Output -match "Created bucket|already exists") {
  Write-Ok "R2 bucket ready"
} else {
  Write-Host "  ✗ Unexpected output from r2 create:" -ForegroundColor Red
  Write-Host $r2Output
  exit 1
}

# Step 4: Apply migrations
Write-Step 4 "Applying D1 migrations..."
& npx wrangler d1 migrations apply sherlock-research --remote
if ($LASTEXITCODE -ne 0) {
  Write-Host "  ✗ Migration failed" -ForegroundColor Red
  exit 1
}
Write-Ok "Migrations applied"

# Step 5: Set ADMIN_TOKEN secret
Write-Step 5 "Setting ADMIN_TOKEN secret..."
$adminToken = Read-Host "  Enter an admin token (any random string; press Enter to auto-generate)"
if ([string]::IsNullOrWhiteSpace($adminToken)) {
  $bytes = New-Object byte[] 24
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $adminToken = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('/','_').Replace('+','-')
  Write-Host "  Generated: $adminToken" -ForegroundColor Yellow
  Write-Host "  ⚠ Save this — you'll need it to sign in to /admin" -ForegroundColor Yellow
}
$adminToken | & npx wrangler secret put ADMIN_TOKEN
if ($LASTEXITCODE -ne 0) {
  Write-Host "  ✗ Secret put failed" -ForegroundColor Red
  exit 1
}
Write-Ok "ADMIN_TOKEN set"

# Step 6: Deploy
Write-Step 6 "Deploying Worker..."
& npx wrangler deploy
if ($LASTEXITCODE -ne 0) {
  Write-Host "  ✗ Deploy failed" -ForegroundColor Red
  exit 1
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  ✓ All done!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nNext steps:"
Write-Host "  1. Visit the Worker URL printed above + /admin/login"
Write-Host "  2. Sign in with: $adminToken"
Write-Host "  3. Commit + push the wrangler.toml change with the database_id:"
Write-Host "     git add sherlock-backend/wrangler.toml"
Write-Host "     git commit -m `"Wire D1 database_id`""
Write-Host "     git push"
