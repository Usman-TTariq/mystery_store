# PowerShell script to push code to GitHub
# Run this script: .\push-to-github.ps1

Write-Host "=== Pushing to GitHub Repository ===" -ForegroundColor Cyan
Write-Host "Repository: https://github.com/Yasalkhan99/mystery_store" -ForegroundColor Yellow
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Green
    git init
} else {
    Write-Host "Git repository already initialized" -ForegroundColor Green
}

# Remove existing remote if it exists
Write-Host "Checking remote repository..." -ForegroundColor Green
$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    Write-Host "Removing existing remote..." -ForegroundColor Yellow
    git remote remove origin
}

Write-Host "Adding remote repository..." -ForegroundColor Green
git remote add origin https://github.com/Yasalkhan99/mystery_store.git

Write-Host "Adding all files..." -ForegroundColor Green
git add .

Write-Host "Committing changes..." -ForegroundColor Green
git commit -m "Initial commit: Converted Firebase to Supabase - Complete coupon store with admin panel"

Write-Host "Setting branch to main..." -ForegroundColor Green
git branch -M main

Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Green
Write-Host "Note: You will need to authenticate with GitHub" -ForegroundColor Yellow
Write-Host "Use your Personal Access Token (PAT) as password" -ForegroundColor Yellow
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "Check: https://github.com/Yasalkhan99/mystery_store" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Push failed. Please check:" -ForegroundColor Red
    Write-Host "1. GitHub authentication (use PAT token)" -ForegroundColor Yellow
    Write-Host "2. Internet connection" -ForegroundColor Yellow
    Write-Host "3. Repository permissions" -ForegroundColor Yellow
}

