$ErrorActionPreference = 'Stop'

Write-Host "========================================================================="
Write-Host "       BHOOMISETU -- STATE ADMIN PHASE 0 END-TO-END VERIFICATION SUITE   "
Write-Host "========================================================================="

$baseUrl = "http://localhost:5000/api/v1"
$passedCount = 0
$failedCount = 0

function Assert-Test([string]$testName, [bool]$condition, [string]$details) {
    if ($condition) {
        Write-Host "  [PASS] $testName $details" -ForegroundColor Green
        $global:passedCount++
    } else {
        Write-Host "  [FAIL] $testName $details" -ForegroundColor Red
        $global:failedCount++
    }
}

# -------------------------------------------------------------------------
# TEST 1: State Admin Authentication & State Scope
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 1: Authentication and State Scope ---"

$loginBody = @{
    username = "state.admin"
    password = "State@123"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$stateToken = $loginRes.data.accessToken
$stateHeaders = @{ Authorization = "Bearer $stateToken" }

Assert-Test "State Admin Login" ($loginRes.success -eq $true) "(User: $($loginRes.data.user.username))"
Assert-Test "Role Enforcement" ($loginRes.data.user.role -eq "StateAdmin") "(Role: $($loginRes.data.user.role))"
Assert-Test "State Jurisdiction Bound" ($loginRes.data.user.stateName -eq "Uttar Pradesh") "(State: $($loginRes.data.user.stateName))"

# -------------------------------------------------------------------------
# TEST 2: State Operations Dashboard
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 2: State Operations Dashboard Aggregation ---"

$dash = Invoke-RestMethod -Uri "$baseUrl/state/dashboard" -Method Get -Headers $stateHeaders
Assert-Test "Dashboard Status 200 OK" ($dash.success -eq $true) ""
Assert-Test "State Scoped to UP" ($dash.data.stateName -eq "Uttar Pradesh") ""
Assert-Test "Total Projects KPI" ($dash.data.kpis.totalProjects -ge 4) "(Total: $($dash.data.kpis.totalProjects))"
Assert-Test "Acquisition Percentage Calculated" ($dash.data.kpis.landAcquisitionPercentage -ge 0) "(Pct: $($dash.data.kpis.landAcquisitionPercentage))"
Assert-Test "Compensation Disbursed Tracked" ($dash.data.kpis.totalCompensationDisbursed -ge 0) "(Disbursed: INR $($dash.data.kpis.totalCompensationDisbursed))"
Assert-Test "Pipeline Funnel Stages" ($dash.data.pipeline.Count -eq 7) "(Stages: $($dash.data.pipeline.Count))"
Assert-Test "District Progress Matrix" ($dash.data.districtProgress.Count -ge 2) "(Districts: $($dash.data.districtProgress.Count))"
Assert-Test "Proposal Summary Counts" ($dash.data.proposalSummary.pendingReview -ge 1) "(Pending: $($dash.data.proposalSummary.pendingReview))"

# -------------------------------------------------------------------------
# TEST 3: State Proposals Listing & Detailed Inspection
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 3: Proposals Review and Inspection ---"

$proposals = Invoke-RestMethod -Uri "$baseUrl/state/proposals" -Method Get -Headers $stateHeaders
Assert-Test "Proposals List Status 200 OK" ($proposals.success -eq $true) ""
Assert-Test "UP Proposals Returned" ($proposals.data.Count -ge 4) "(Count: $($proposals.data.Count))"

# Find proposal in StateReview
$reviewProp = $proposals.data | Where-Object { $_.status -eq "StateReview" } | Select-Object -First 1
if (-not $reviewProp) {
    $reviewProp = $proposals.data[0]
}

Write-Host "  Inspecting Proposal: $($reviewProp.proposalNumber) ($($reviewProp.projectName))"
$detail = Invoke-RestMethod -Uri "$baseUrl/state/proposals/$($reviewProp.id)" -Method Get -Headers $stateHeaders
Assert-Test "Proposal Detail Retrieved" ($detail.success -eq $true) ""
Assert-Test "Land Details Centroid Mapped" ($detail.data.landDetails.latitude -ne 0 -and $detail.data.landDetails.longitude -ne 0) "(Lat: $($detail.data.landDetails.latitude), Lng: $($detail.data.landDetails.longitude))"
Assert-Test "Statutory Documents Attached" ($detail.data.documents.Count -ge 1) "(Documents: $($detail.data.documents.Count))"
Assert-Test "Affected Families Details" ($detail.data.affectedFamilies.totalAffected -gt 0) "(Families: $($detail.data.affectedFamilies.totalAffected))"
Assert-Test "Timeline Audit Log Recorded" ($detail.data.timeline.Count -ge 1) "(Timeline steps: $($detail.data.timeline.Count))"

# -------------------------------------------------------------------------
# TEST 4: Statutory Workflow Actions (Approve, Return, Reject)
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 4: Statutory Workflow State Machine ---"

# 4A: Return without reason MUST fail (Validation Rule)
try {
    $emptyReturnBody = @{ reason = "" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/state/proposals/$($reviewProp.id)/return" -Method Post -ContentType "application/json" -Body $emptyReturnBody -Headers $stateHeaders
    Assert-Test "Return Without Reason Blocked" $false "Expected 400 Bad Request"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test "Return Without Reason Blocked (400 Bad Request)" ($statusCode -eq 400) "(Status Code: $statusCode)"
}

# 4B: Return with Valid Reason MUST succeed
$validReturnBody = @{ reason = "Environmental Impact Assessment certificate missing cadastral survey schedule verification." } | ConvertTo-Json
$returnRes = Invoke-RestMethod -Uri "$baseUrl/state/proposals/$($reviewProp.id)/return" -Method Post -ContentType "application/json" -Body $validReturnBody -Headers $stateHeaders
Assert-Test "Return With Reason Succeeded" ($returnRes.success -eq $true) "($($returnRes.message))"

# Verify proposal status transitioned to ReturnedForCorrection
$detailAfterReturn = Invoke-RestMethod -Uri "$baseUrl/state/proposals/$($reviewProp.id)" -Method Get -Headers $stateHeaders
Assert-Test "Proposal State Machine Transitioned to ReturnedForCorrection" ($detailAfterReturn.data.status -eq "ReturnedForCorrection") ""

# 4C: Approve Proposal (Statutory Administrative Sanction)
$approveBody = @{ comments = "Granted Administrative Sanction under Section 11 of RFCTLARR Act 2013." } | ConvertTo-Json
$approveRes = Invoke-RestMethod -Uri "$baseUrl/state/proposals/$($reviewProp.id)/approve" -Method Post -ContentType "application/json" -Body $approveBody -Headers $stateHeaders
Assert-Test "Approve Proposal Succeeded" ($approveRes.success -eq $true) "($($approveRes.message))"

# Verify proposal status transitioned to Approved
$detailAfterApprove = Invoke-RestMethod -Uri "$baseUrl/state/proposals/$($reviewProp.id)" -Method Get -Headers $stateHeaders
Assert-Test "Proposal State Machine Transitioned to Approved" ($detailAfterApprove.data.status -eq "Approved") ""

# -------------------------------------------------------------------------
# TEST 5: State Projects and GIS Endpoints
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 5: State Projects and GIS GeoJSON Mapping ---"

$gisProjects = Invoke-RestMethod -Uri "$baseUrl/state/gis/projects" -Method Get -Headers $stateHeaders
Assert-Test "GIS Projects Status 200 OK" ($gisProjects.success -eq $true) ""
Assert-Test "GIS Projects Contain Coordinates" ($gisProjects.data.Count -ge 4 -and $gisProjects.data[0].latitude -ne 0) "(Project 1 Lat: $($gisProjects.data[0].latitude), Lng: $($gisProjects.data[0].longitude))"

$gisParcels = Invoke-RestMethod -Uri "$baseUrl/state/gis/parcels" -Method Get -Headers $stateHeaders
Assert-Test "GIS Parcels Status 200 OK" ($gisParcels.success -eq $true) ""
Assert-Test "GIS Parcels Contain GeoJSON Polygons" ($gisParcels.data.Count -ge 2 -and $gisParcels.data[0].geoJsonGeometry -like "*Polygon*") "(Geometry: $($gisParcels.data[0].geoJsonGeometry.Substring(0, 30))...)"

# -------------------------------------------------------------------------
# TEST 6: State Acquisition Progress Analytics
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 6: Acquisition Analytics (Compensation, Possession, R and R) ---"

$acq = Invoke-RestMethod -Uri "$baseUrl/state/acquisition" -Method Get -Headers $stateHeaders
Assert-Test "Acquisition Progress 200 OK" ($acq.success -eq $true) ""
Assert-Test "Compensation Assessed vs Disbursed" ($acq.data.compensation.totalAssessed -gt 0) "(Assessed: $($acq.data.compensation.totalAssessed), Paid: $($acq.data.compensation.totalPaid))"
Assert-Test "Possession Completion Percentage" ($acq.data.possession.completionPercentage -ge 0) "(Pct: $($acq.data.possession.completionPercentage))"
Assert-Test "Rehabilitation Packages Count" ($acq.data.rehabilitation.totalAffectedFamilies -gt 0) "(Affected Families: $($acq.data.rehabilitation.totalAffectedFamilies))"

# -------------------------------------------------------------------------
# TEST 7: Cross-State Security Isolation and RBAC Protection
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 7: Security Isolation and RBAC ---"

# 7A: State Admin cannot tamper with query parameter to access Maharashtra data
$mhState = Invoke-RestMethod -Uri "$baseUrl/auth/geography" -Method Get
$mhId = ($mhState.data | Where-Object { $_.code -eq "MH" }).id

$tamperDash = Invoke-RestMethod -Uri "$baseUrl/state/dashboard?stateId=$mhId" -Method Get -Headers $stateHeaders
Assert-Test "Cross-State Tampering Ignored/Isolated (Still UP)" ($tamperDash.data.stateName -eq "Uttar Pradesh") "(Protected State: $($tamperDash.data.stateName))"

# 7B: Unauthenticated user rejected with 401 Unauthorized
try {
    Invoke-RestMethod -Uri "$baseUrl/state/dashboard" -Method Get
    Assert-Test "Unauthenticated Access Blocked" $false "Expected 401"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test "Unauthenticated Access Blocked (401 Unauthorized)" ($statusCode -eq 401) ""
}

# -------------------------------------------------------------------------
# TEST 8: Regression Tests (Landing, SuperAdmin, CentralAdmin)
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 8: Platform Regression Suite ---"

# Super Admin Login & Health
$superLoginBody = @{ username = "super.admin"; password = "Admin@123" } | ConvertTo-Json
$superLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $superLoginBody
$superHeaders = @{ Authorization = "Bearer $($superLoginRes.data.accessToken)" }

$superDash = Invoke-RestMethod -Uri "$baseUrl/Admin/dashboard" -Method Get -Headers $superHeaders
Assert-Test "Super Admin Dashboard Operational" ($superDash.success -eq $true) "(Total Users: $($superDash.data.totalUsers))"

# Central Admin Login & Dashboard
$centralLoginBody = @{ username = "central.admin"; password = "Central@123" } | ConvertTo-Json
$centralLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $centralLoginBody
$centralHeaders = @{ Authorization = "Bearer $($centralLoginRes.data.accessToken)" }

$centralDash = Invoke-RestMethod -Uri "$baseUrl/central/dashboard" -Method Get -Headers $centralHeaders
Assert-Test "Central Admin Dashboard Operational" ($centralDash.success -eq $true) "(National Projects: $($centralDash.data.kpis.totalProjects))"

Write-Host "`n========================================================================="
Write-Host "                      FINAL TEST SUMMARY RESULT                          "
Write-Host "========================================================================="
Write-Host " Total Tests Executed: $($passedCount + $failedCount)"
Write-Host " Passed: $passedCount" -ForegroundColor Green
if ($failedCount -gt 0) {
    Write-Host " Failed: $failedCount" -ForegroundColor Red
} else {
    Write-Host " Failed: $failedCount" -ForegroundColor Green
}

if ($failedCount -eq 0) {
    Write-Host "`n>>> [SUCCESS] 100% OF BHOOMISETU STATE ADMIN TESTS PASSED! <<<`n" -ForegroundColor Green
} else {
    Write-Host "`n>>> [FAILURE] SOME TESTS FAILED. PLEASE REVIEW LOGS. <<<`n" -ForegroundColor Red
}
