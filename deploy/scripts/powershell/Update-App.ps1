#Requires -Version 5.1
<#
.SYNOPSIS
    Pull latest code from GitHub, rebuild containers, migrate, and restart.
    Client data in Docker volumes is never deleted by this script.
#>

. "$PSScriptRoot\_common.ps1"

try {
    Ensure-DeployEnvironment

    $envVars = Import-DeployEnv
    $branch = if ($envVars.GIT_BRANCH) { $envVars.GIT_BRANCH } else { "main" }

    Write-Step "Pulling latest code from GitHub (branch: $branch)..."
    Push-Location $Script:ProjectRoot
    try {
        if (-not (Test-Path (Join-Path $Script:ProjectRoot ".git"))) {
            throw "This folder is not a git repository. Clone from GitHub first."
        }

        git fetch origin
        if ($LASTEXITCODE -ne 0) { throw "git fetch failed." }

        git pull origin $branch
        if ($LASTEXITCODE -ne 0) { throw "git pull failed." }
    } finally {
        Pop-Location
    }
    Write-Success "Code updated."

    Write-Step "Rebuilding Docker images..."
    Invoke-Compose @("build")

    Write-Step "Restarting services (migrations run automatically on backend start)..."
    Invoke-Compose @("up", "-d")

    Write-Step "Running migrations explicitly..."
    Invoke-Compose @("exec", "-T", "backend", "python", "manage.py", "migrate", "--noinput")

    Write-Step "Collecting static files..."
    Invoke-Compose @("exec", "-T", "backend", "python", "manage.py", "collectstatic", "--noinput")

    Wait-ForHealthyBackend

    $url = Get-AppUrl
    Write-Host ""
    Write-Success "Update completed successfully."
    Write-Host "Application URL: $url" -ForegroundColor Yellow
    Write-Host "Database and uploaded files were preserved." -ForegroundColor Green
    Write-Host ""
    exit 0
} catch {
    Write-Failure $_.Exception.Message
    Write-Host ""
    Write-Host "Update failed. Your existing data volumes were not removed." -ForegroundColor Yellow
    Write-Host "Check Docker logs: docker compose -f deploy/docker-compose.yml logs" -ForegroundColor Yellow
    exit 1
}
