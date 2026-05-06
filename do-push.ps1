Set-Location -LiteralPath 'c:\Users\STEIN\Desktop\Wipulscan proffesional 030526\Wipulscan-professional-c96dd126f5b7cb244636e10047c78096164032c9'
$status = git status --short
Write-Host "STATUS: $status"
if ($status) {
    git add index.html
    git commit -m "feat: uk lang, radar disabled, autoplay audio, sw-free"
    git push origin main
    Write-Host "PUSH DONE"
} else {
    Write-Host "Nothing to commit"
}
