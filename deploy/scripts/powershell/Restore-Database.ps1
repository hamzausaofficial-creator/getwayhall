#Requires -Version 5.1
<#
.SYNOPSIS
    Restore PostgreSQL database from a .sql backup file.
    WARNING: This overwrites the current database contents.
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile
)

. "$PSScriptRoot\_common.ps1"

try {
    Ensure-DeployEnvironment

    if (-not (Test-Path $BackupFile)) {
        throw "Backup file not found: $BackupFile"
    }

    $envVars = Import-DeployEnv
    $dbName = if ($envVars.DB_NAME) { $envVars.DB_NAME } else { "hallora" }
    $dbUser = if ($envVars.DB_USER) { $envVars.DB_USER } else { "hallora" }

    Write-Host ""
    Write-Host "WARNING: This will REPLACE all data in database '$dbName'." -ForegroundColor Red
    Write-Host "Backup file: $BackupFile" -ForegroundColor Yellow
    $confirm = Read-Host "Type YES to continue"
    if ($confirm -ne "YES") {
        Write-Host "Restore cancelled."
        exit 0
    }

    Write-Step "Stopping backend to release database connections..."
    Invoke-Compose @("stop", "backend")

    Write-Step "Restoring database..."
    Get-Content -Path $BackupFile -Raw | Invoke-Compose @(
        "exec", "-T", "db",
        "psql", "-U", $dbUser, "-d", $dbName
    )

    Write-Step "Starting backend..."
    Invoke-Compose @("start", "backend")
    Wait-ForHealthyBackend

    Write-Success "Database restored from: $BackupFile"
    exit 0
} catch {
    Write-Failure $_.Exception.Message
    exit 1
}
