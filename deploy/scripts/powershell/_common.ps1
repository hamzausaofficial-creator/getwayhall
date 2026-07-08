#Requires -Version 5.1
<#
.SYNOPSIS
    Shared helpers for Gateway Marriage Hall Windows deployment scripts.
#>

$ErrorActionPreference = "Stop"

$Script:DeployRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Script:ProjectRoot = Split-Path -Parent $Script:DeployRoot
$Script:ComposeFile = Join-Path $Script:DeployRoot "docker-compose.yml"
$Script:EnvFile = Join-Path $Script:DeployRoot ".env"
$Script:BackupsDir = Join-Path $Script:DeployRoot "backups"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "OK: $Message" -ForegroundColor Green
}

function Write-Failure {
    param([string]$Message)
    Write-Host "ERROR: $Message" -ForegroundColor Red
}

function Test-DockerRunning {
    try {
        docker info *> $null
        return $true
    } catch {
        return $false
    }
}

function Ensure-DeployEnvironment {
    if (-not (Test-DockerRunning)) {
        throw "Docker is not running. Start Docker Desktop and try again."
    }

    if (-not (Test-Path $Script:ComposeFile)) {
        throw "docker-compose.yml not found at: $Script:ComposeFile"
    }

    if (-not (Test-Path $Script:EnvFile)) {
        throw @"
Missing deploy/.env file.

Copy deploy/.env.example to deploy/.env and set SECRET_KEY and DB_PASSWORD:
  copy deploy\.env.example deploy\.env
"@
    }

    New-Item -ItemType Directory -Force -Path $Script:BackupsDir | Out-Null
}

function Import-DeployEnv {
    if (-not (Test-Path $Script:EnvFile)) {
        return @{}
    }

    $envVars = @{}
    Get-Content $Script:EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line -match "^\s*([^=]+)=(.*)$") {
            $envVars[$Matches[1].Trim()] = $Matches[2].Trim()
        }
    }
    return $envVars
}

function Invoke-Compose {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    $allArgs = @(
        "compose",
        "--project-directory", $Script:DeployRoot,
        "-f", $Script:ComposeFile,
        "--env-file", $Script:EnvFile
    ) + $Arguments

    & docker @allArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Docker command failed: docker $($allArgs -join ' ')"
    }
}

function Wait-ForHealthyBackend {
    param([int]$TimeoutSeconds = 120)

    Write-Step "Waiting for backend health check..."
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $deadline) {
        try {
            $envVars = Import-DeployEnv
            $healthPort = if ($envVars.APP_PORT) { $envVars.APP_PORT } else { "8080" }
            $response = Invoke-RestMethod -Uri "http://127.0.0.1:$healthPort/api/health/" -TimeoutSec 5
            if ($response.status -eq "ok") {
                Write-Success "Backend is healthy."
                return
            }
        } catch {
            Start-Sleep -Seconds 3
        }
    }

    throw "Backend did not become healthy within $TimeoutSeconds seconds."
}

function Get-AppUrl {
    $envVars = Import-DeployEnv
    $port = if ($envVars.APP_PORT) { $envVars.APP_PORT } else { "8080" }
    return "http://localhost:$port"
}
