<#
.SYNOPSIS
    Simple script to create GitHub repository and push code
.DESCRIPTION
    Creates a GitHub repository and pushes the current directory to it
#>

# Check if Git is installed
try {
    git --version | Out-Null
    Write-Host "✓ Git is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Git is not installed. Please install Git first." -ForegroundColor Red
    exit 1
}

# Check if GitHub CLI is installed
try {
    gh --version | Out-Null
    Write-Host "✓ GitHub CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ GitHub CLI is not installed. Please install GitHub CLI first." -ForegroundColor Red
    Write-Host "Download from: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Check if authenticated with GitHub
try {
    $authStatus = gh auth status 2>&1
    if ($authStatus -match "Logged in to github.com") {
        Write-Host "✓ Authenticated with GitHub" -ForegroundColor Green
    } else {
        Write-Host "✗ Not authenticated with GitHub. Please run: gh auth login" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Not authenticated with GitHub. Please run: gh auth login" -ForegroundColor Red
    exit 1
}

# Initialize Git repository if needed
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
}

# Get repository name
$repoName = Read-Host "Enter repository name (default: ElevenLabs_Widgets)"
if ([string]::IsNullOrWhiteSpace($repoName)) {
    $repoName = "ElevenLabs_Widgets"
}

# Get repository description
$repoDesc = Read-Host "Enter repository description (optional)"

# Ask if repository should be private
$privateChoice = Read-Host "Make repository private? (y/n, default: public)"
$isPrivate = $privateChoice.ToLower() -eq 'y'

# Create GitHub repository
Write-Host "Creating GitHub repository '$repoName'..." -ForegroundColor Yellow

try {
    $createArgs = @("repo", "create", $repoName, "--source=.")
    if ($isPrivate) { $createArgs += "--private" } else { $createArgs += "--public" }
    if ($repoDesc) { $createArgs += "--description", $repoDesc }
    
    $output = & gh $createArgs 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Repository created successfully!" -ForegroundColor Green
        
        # Get repository URL
        $username = gh api user --jq '.login' | ForEach-Object { $_.Trim() }
        $repoUrl = "https://github.com/$username/$repoName.git"
        
        # Add remote if not exists
        $remotes = git remote -v
        if (-not ($remotes -match "origin")) {
            git remote add origin $repoUrl
            Write-Host "✓ Remote 'origin' added" -ForegroundColor Green
        }
        
        # Stage all files
        git add .
        
        # Check if there are staged changes
        $staged = git status --porcelain
        if ($staged) {
            # Create initial commit
            git commit -m "Initial commit: Add ElevenLabs Widgets project"
            Write-Host "✓ Initial commit created" -ForegroundColor Green
        }
        
        # Push to GitHub
        Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
        git push -u origin main 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
            Write-Host "Repository URL: $repoUrl" -ForegroundColor Cyan
        } else {
            # Try with master branch
            git push -u origin master 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Successfully pushed to GitHub (master branch)!" -ForegroundColor Green
                Write-Host "Repository URL: $repoUrl" -ForegroundColor Cyan
            } else {
                Write-Host "✗ Failed to push to GitHub" -ForegroundColor Red
                Write-Host "You may need to push manually: git push -u origin main" -ForegroundColor Yellow
            }
        }
        
    } else {
        Write-Host "✗ Failed to create repository: $output" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ Error creating repository: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
