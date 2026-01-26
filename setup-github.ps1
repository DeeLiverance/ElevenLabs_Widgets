# Simple GitHub repository setup script

Write-Host "Setting up GitHub repository..." -ForegroundColor Yellow

# Check Git
try {
    git --version | Out-Null
    Write-Host "Git found" -ForegroundColor Green
} catch {
    Write-Host "Please install Git first" -ForegroundColor Red
    exit 1
}

# Check GitHub CLI
try {
    gh --version | Out-Null
    Write-Host "GitHub CLI found" -ForegroundColor Green
} catch {
    Write-Host "Please install GitHub CLI first" -ForegroundColor Red
    exit 1
}

# Initialize Git repo
if (-not (Test-Path ".git")) {
    git init
    Write-Host "Git repository initialized" -ForegroundColor Green
}

# Get repo details
$repoName = "ElevenLabs_Widgets"
$description = "ElevenLabs Widgets project"

# Create repo
Write-Host "Creating GitHub repository..." -ForegroundColor Yellow
gh repo create $repoName --public --description $description --source=. --push

Write-Host "Repository created successfully!" -ForegroundColor Green
