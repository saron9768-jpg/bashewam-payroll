# Bashewam Payroll — one-time setup: install tools, publish to Google, open Search Console
$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
$ProjectId = "bashewam-school-payroll"
$SiteUrl = "https://$ProjectId.web.app"
$LoginUrl = "$SiteUrl/login.html"

Set-Location $ProjectRoot

function Write-Step($n, $msg) {
  Write-Host ""
  Write-Host "[$n] $msg" -ForegroundColor Cyan
}

function Refresh-Path {
  $machine = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $user = [Environment]::GetEnvironmentVariable("Path", "User")
  $env:Path = "$machine;$user"
}

function Get-NodeExe {
  $candidates = @(
    "$env:ProgramFiles\nodejs\node.exe",
    "${env:ProgramFiles(x86)}\nodejs\node.exe",
    "$env:LOCALAPPDATA\Programs\node\node.exe"
  )
  foreach ($p in $candidates) {
    if (Test-Path $p) { return $p }
  }
  $cmd = Get-Command node -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  return $null
}

function Ensure-Node {
  $node = Get-NodeExe
  if ($node) {
    Write-Host "  Node found: $node" -ForegroundColor Green
    return
  }

  Write-Host "  Node.js is required (one-time install)." -ForegroundColor Yellow
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $winget) {
    Write-Host ""
    Write-Host "  Please install Node.js manually, then run this script again:" -ForegroundColor Red
    Write-Host "  https://nodejs.org/  (click Download LTS, install, restart PC)" -ForegroundColor White
    Start-Process "https://nodejs.org/"
    exit 1
  }

  Write-Host "  Installing Node.js LTS via winget (may take a few minutes)..." -ForegroundColor Yellow
  winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
  Refresh-Path
  $node = Get-NodeExe
  if (-not $node) {
    Write-Host ""
    Write-Host "  Node installed. Please CLOSE this window, restart your PC, then double-click START-HERE.bat again." -ForegroundColor Yellow
    exit 0
  }
}

function Ensure-FirebaseCli {
  Refresh-Path
  $firebase = Get-Command firebase -ErrorAction SilentlyContinue
  if ($firebase) {
    Write-Host "  Firebase CLI found." -ForegroundColor Green
    return
  }
  Write-Host "  Installing Firebase tools..." -ForegroundColor Yellow
  npm install -g firebase-tools
  Refresh-Path
  if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    throw "Firebase CLI did not install. Try running as Administrator or restart your PC."
  }
}

function Ensure-FirebaseLogin {
  Write-Host "  Checking Google sign-in..." -ForegroundColor Yellow
  $list = firebase projects:list 2>&1
  if ($LASTEXITCODE -eq 0 -and $list -match "projects") {
    Write-Host "  Already signed in to Google." -ForegroundColor Green
    return
  }

  Write-Host ""
  Write-Host "  A browser window will open. Sign in with your Google account" -ForegroundColor White
  Write-Host "  (school Gmail is fine). Allow access, then return here." -ForegroundColor White
  Write-Host ""
  firebase login
  if ($LASTEXITCODE -ne 0) {
    throw "Google sign-in failed. Run START-HERE.bat again and complete login in the browser."
  }
}

function Ensure-FirebaseProject {
  $exists = firebase projects:list 2>&1 | Select-String -SimpleMatch $ProjectId
  if ($exists) {
    Write-Host "  Firebase project '$ProjectId' found." -ForegroundColor Green
    return $ProjectId
  }

  Write-Host ""
  Write-Host "  We need to create your Firebase project in the browser (one time)." -ForegroundColor Yellow
  Write-Host "  1. Click 'Add project'" -ForegroundColor White
  Write-Host "  2. Project name: Bashewam School Payroll" -ForegroundColor White
  Write-Host "  3. IMPORTANT: set Project ID to exactly:" -ForegroundColor White
  Write-Host "     $ProjectId" -ForegroundColor Green
  Write-Host "  4. Finish (Google Analytics optional — you can skip)" -ForegroundColor White
  Write-Host ""
  Start-Process "https://console.firebase.google.com/"
  Read-Host "Press Enter after you have created the project in the browser"

  $exists = firebase projects:list 2>&1 | Select-String -SimpleMatch $ProjectId
  if (-not $exists) {
    Write-Host ""
    Write-Host "  Project not found yet. If you used a different Project ID, type it here." -ForegroundColor Yellow
    $custom = Read-Host "Project ID (or press Enter to try again with $ProjectId)"
    if ($custom.Trim()) {
      $script:ProjectId = $custom.Trim()
      $script:SiteUrl = "https://$ProjectId.web.app"
      $script:LoginUrl = "$SiteUrl/login.html"
      @(
        @{ Path = ".firebaserc"; Content = "{`n  `"projects`": {`n    `"default`": `"$ProjectId`"`n  }`n}`n" }
      ) | ForEach-Object {
        Set-Content -Path (Join-Path $ProjectRoot $_.Path) -Value $_.Content -Encoding UTF8
      }
      (Get-Content (Join-Path $ProjectRoot "robots.txt") -Raw) -replace "bashewam-school-payroll", $ProjectId | Set-Content (Join-Path $ProjectRoot "robots.txt")
      (Get-Content (Join-Path $ProjectRoot "sitemap.xml") -Raw) -replace "bashewam-school-payroll", $ProjectId | Set-Content (Join-Path $ProjectRoot "sitemap.xml")
      (Get-Content (Join-Path $ProjectRoot "login.html") -Raw) -replace "bashewam-school-payroll", $ProjectId | Set-Content (Join-Path $ProjectRoot "login.html")
    }
  }
  return $ProjectId
}

function Deploy-Site {
  Write-Host "  Uploading your site to Google..." -ForegroundColor Yellow
  firebase deploy --only hosting --project $ProjectId
  if ($LASTEXITCODE -ne 0) {
    throw "Deploy failed. Check that the Firebase project exists and Hosting is enabled (Firebase Console -> Build -> Hosting -> Get started)."
  }
}

function Open-GoogleSearchSetup {
  Write-Host ""
  Write-Host "  Last step for Google Search (2 minutes in the browser):" -ForegroundColor Cyan
  Write-Host "  1. Add your site URL" -ForegroundColor White
  Write-Host "  2. Verify ownership (HTML tag or URL — follow on-screen steps)" -ForegroundColor White
  Write-Host "  3. Sitemaps -> add: $SiteUrl/sitemap.xml" -ForegroundColor White
  Write-Host "  4. URL inspection -> paste $LoginUrl -> Request indexing" -ForegroundColor White
  Write-Host ""
  Start-Process "https://search.google.com/search-console/welcome"
  Start-Process $LoginUrl
}

# --- Main ---
Clear-Host
Write-Host "Bashewam School Payroll — publish to the internet" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

try {
  Write-Step 1 "Install Node.js (if needed)"
  Ensure-Node
  Refresh-Path

  Write-Step 2 "Install Firebase tools"
  Ensure-FirebaseCli

  Write-Step 3 "Sign in to Google"
  Ensure-FirebaseLogin

  Write-Step 4 "Firebase project"
  Ensure-FirebaseProject | Out-Null

  Write-Step 5 "Publish website"
  Deploy-Site

  Write-Host ""
  Write-Host "SUCCESS! Your site is online:" -ForegroundColor Green
  Write-Host "  $SiteUrl" -ForegroundColor White
  Write-Host "  Teachers sign in at: $LoginUrl" -ForegroundColor White
  Write-Host ""
  Write-Host "Share that link with staff. Default login (change in login.js):" -ForegroundColor Yellow
  Write-Host "  Username: admin" -ForegroundColor White
  Write-Host "  Password: Bashewam@2026" -ForegroundColor White
  Write-Host ""
  Write-Host "Google Search: new sites take a few days to a few weeks to appear." -ForegroundColor Yellow
  Write-Host "Complete Search Console when the browser opens (step 6)." -ForegroundColor Yellow

  Write-Step 6 "Google Search setup (browser)"
  Open-GoogleSearchSetup

  # Save link for teachers
  @"
Bashewam School — Payroll Portal
================================
Website: $LoginUrl

Sign in:
  Username: admin
  Password: (see login.js — change before sharing widely)

Google: search for ""Bashewam School payroll"" after Search Console is set up.
"@ | Set-Content (Join-Path $ProjectRoot "YOUR-WEBSITE-LINK.txt") -Encoding UTF8

}
catch {
  Write-Host ""
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host ""
  Write-Host "If stuck, read START-SIMPLE.txt or ask for help with the message above." -ForegroundColor Yellow
  exit 1
}
