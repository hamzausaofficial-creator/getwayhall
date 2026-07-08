#Requires -Version 5.1
<#
.SYNOPSIS
    Backup the PostgreSQL database to deploy/backups/.
#>

. "$PSScriptRoot\_common.ps1"

try {
    Ensure-DeployEnvironment

    $envVars = Import-DeployEnv
    $dbName = if ($envVars.DB_NAME) { $envVars.DB_NAME } else { "hallora" }
    $dbUser = if ($envVars.DB_USER) { $envVars.DB_USER } else { "hallora" }

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = Join-Path $Script:BackupsDir "backup_${dbName}_${timestamp}.sql"

    Write-Step "Creating database backup..."
    New-Item -ItemType Directory -Force -Path $Script:BackupsDir | Out-Null

    Invoke-Compose @(
        "exec", "-T", "db",
        "pg_dump", "-U", $dbUser, "-d", $dbName, "--no-owner", "--no-acl"
    ) | Set-Content -Path $backupFile -Encoding UTF8

    if (-not (Test-Path $backupFile) -or (Get-Item $backupFile).Length -eq 0) {
        throw "Backup file was not created or is empty."
    }

    Write-Success "Backup saved to: $backupFile"
    exit 0
} catch {
    Write-Failure $_.Exception.Message
    exit 1
}
