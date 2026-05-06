Set-Location -LiteralPath 'c:\Users\STEIN\Desktop\Wipulscan proffesional 030526\Wipulscan-professional-c96dd126f5b7cb244636e10047c78096164032c9'
Write-Host "PULL..."
git pull origin main --no-edit
Write-Host "ADD..."
git add index.html
Write-Host "COMMIT..."
git commit -m "feat: uk lang, radar disabled, autoplay audio, sw-free" --allow-empty
Write-Host "PUSH..."
git push origin main --force
Write-Host "DONE"
