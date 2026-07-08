#Requires -Version 5.1
<#
.SYNOPSIS
    Stop Gateway Marriage Hall containers (data volumes are preserved).
#>

. "$PSScriptRoot\_common.ps1"

try {
    Ensure-DeployEnvironment

    Write-Step "Stopping services..."
    Invoke-Compose @("down")

    Write-Success "All services stopped. Database and uploads are preserved in Docker volumes."
    exit 0
} catch {
    Write-Failure $_.Exception.Message
    exit 1
}
