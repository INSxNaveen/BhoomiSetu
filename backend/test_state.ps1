$ErrorActionPreference = 'Stop'

Write-Host "--- 1. Testing State Admin Login ---"
$loginBody = @{
    username = "state.admin"
    password = "State@123"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$token = $loginRes.data.accessToken
Write-Host "Logged in as:" $loginRes.data.user.username "Role:" $loginRes.data.user.role "State:" $loginRes.data.user.stateName

$headers = @{
    Authorization = "Bearer $token"
}

Write-Host "`n--- 2. Testing State Dashboard ---"
$dashboard = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/state/dashboard" -Method Get -Headers $headers
Write-Host "State Name:" $dashboard.data.stateName
Write-Host "Total Projects:" $dashboard.data.kpis.totalProjects
Write-Host "Land Acquisition %:" $dashboard.data.kpis.landAcquisitionPercentage
Write-Host "Districts Count:" $dashboard.data.districtProgress.Count

Write-Host "`n--- 3. Testing State Proposals ---"
$proposals = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/state/proposals" -Method Get -Headers $headers
Write-Host "Proposals returned:" $proposals.data.Count
foreach ($p in $proposals.data) {
    Write-Host " - Proposal:" $p.proposalNumber "Project:" $p.projectName "Status:" $p.status
}

Write-Host "`n--- 4. Testing State GIS Projects ---"
$gisProjects = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/state/gis/projects" -Method Get -Headers $headers
Write-Host "GIS Projects count:" $gisProjects.data.Count

Write-Host "`n--- 5. Testing State Acquisition Analytics ---"
$acq = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/state/acquisition" -Method Get -Headers $headers
Write-Host "Acquisition State:" $acq.data.stateName
Write-Host "Total Assessed INR:" $acq.data.compensation.totalAssessed

Write-Host "`n>>> ALL STATE ADMIN API TESTS PASSED SUCCESSFULLY! <<<"
