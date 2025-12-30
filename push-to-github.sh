#!/bin/bash
# Bash script to push code to GitHub
# Run this script: bash push-to-github.sh

echo "Initializing Git repository..."
git init

echo "Adding all files..."
git add .

echo "Committing changes..."
git commit -m "Initial commit: Converted Firebase to Supabase"

echo "Adding remote repository..."
git remote add origin https://github.com/Yasalkhan99/mystery_store.git

echo "Setting branch to main..."
git branch -M main

echo "Pushing to GitHub..."
echo "Note: You may need to authenticate with GitHub"
git push -u origin main

echo "Done! Check https://github.com/Yasalkhan99/mystery_store"

