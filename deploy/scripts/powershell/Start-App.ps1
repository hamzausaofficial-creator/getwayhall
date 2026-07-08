#Requires -Version 5.1
<#
.SYNOPSIS
    Start Gateway Marriage Hall (build if needed, then run all services).
#>

. "$PSScriptRoot\_common.ps1"

try {
    Ensure-DeployEnvironment

    Write-Step "Building and starting services..."
    Invoke-Compose @("up", "-d", "--build")

    Wait-ForHealthyBackend

    $url = Get-AppUrl
    Write-Host ""
    Write-Success "Gateway Marriage Hall is running."
    Write-Host "Open in browser: $url" -ForegroundColor Yellow
    Write-Host ""
    exit 0
} catch {
    Write-Failure $_.Exception.Message
    exit 1
}
