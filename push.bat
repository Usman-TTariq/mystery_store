@echo off
echo ========================================
echo Pushing to GitHub Repository
echo Repository: https://github.com/Yasalkhan99/mystery_store.git
echo ========================================
echo.

echo [1/6] Initializing Git...
git init
echo.

echo [2/6] Removing existing remote (if any)...
git remote remove origin 2>nul
echo.

echo [3/6] Adding remote repository...
git remote add origin https://github.com/Yasalkhan99/mystery_store.git
echo.

echo [4/6] Adding all files...
git add .
echo.

echo [5/6] Committing changes...
git commit -m "Initial commit: Converted Firebase to Supabase - Complete coupon store with admin panel"
echo.

echo [6/6] Setting branch to main...
git branch -M main
echo.

echo ========================================
echo Pushing to GitHub...
echo NOTE: You will need to authenticate!
echo Use your GitHub username and Personal Access Token (PAT)
echo ========================================
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Code pushed to GitHub
    echo Check: https://github.com/Yasalkhan99/mystery_store
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ERROR: Push failed
    echo Please check:
    echo 1. GitHub authentication (use PAT token)
    echo 2. Internet connection
    echo 3. Repository permissions
    echo ========================================
)

pause

