$ErrorActionPreference = 'Stop'

Write-Host "========================================================================="
Write-Host "     BHOOMISETU -- DISTRICT ADMIN PHASE 0 END-TO-END VERIFICATION        "
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
# TEST 1: District Admin Authentication & District Scope
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 1: Authentication and District Jurisdiction Scope ---"

$loginBody = @{
    username = "district.admin"
    password = "District@123"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$distToken = $loginRes.data.accessToken
$distHeaders = @{ Authorization = "Bearer $distToken" }

Assert-Test "District Admin Login" ($loginRes.success -eq $true) "(User: $($loginRes.data.user.username))"
Assert-Test "Role Enforcement" ($loginRes.data.user.role -eq "DistrictAdmin") "(Role: $($loginRes.data.user.role))"
Assert-Test "District Jurisdiction Bound" ($loginRes.data.user.districtName -eq "Meerut") "(District: $($loginRes.data.user.districtName))"
Assert-Test "State Jurisdiction Bound" ($loginRes.data.user.stateName -eq "Uttar Pradesh") "(State: $($loginRes.data.user.stateName))"

# -------------------------------------------------------------------------
# TEST 2: District Operations Dashboard
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 2: District Operations Dashboard Aggregation ---"

$dash = Invoke-RestMethod -Uri "$baseUrl/district/dashboard" -Method Get -Headers $distHeaders
Assert-Test "Dashboard Status 200 OK" ($dash.success -eq $true) ""
Assert-Test "District Scoped to Meerut" ($dash.data.districtName -eq "Meerut") ""
Assert-Test "Active Projects KPI" ($dash.data.kpis.activeProjects -ge 1) "(Active: $($dash.data.kpis.activeProjects))"
Assert-Test "Land Parcels Tracked" ($dash.data.kpis.totalLandParcels -ge 2) "(Parcels: $($dash.data.kpis.totalLandParcels))"
Assert-Test "Compensation Disbursed Tracked" ($dash.data.kpis.totalCompensationDisbursed -ge 0) "(Disbursed: INR $($dash.data.kpis.totalCompensationDisbursed))"
Assert-Test "Pipeline Funnel Stages" ($dash.data.pipeline.Count -eq 7) "(Stages: $($dash.data.pipeline.Count))"
Assert-Test "Tehsil Breakdown Returned" ($dash.data.tehsilBreakdown.Count -ge 1) "(Tehsils: $($dash.data.tehsilBreakdown.Count))"
Assert-Test "Verification Summary Counts" ($dash.data.verificationSummary.pending -ge 0) "(Pending: $($dash.data.verificationSummary.pending))"

# -------------------------------------------------------------------------
# TEST 3: District Projects
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 3: District Projects Repository ---"

$projects = Invoke-RestMethod -Uri "$baseUrl/district/projects" -Method Get -Headers $distHeaders
Assert-Test "Projects List Status 200 OK" ($projects.success -eq $true) ""
Assert-Test "Meerut Projects Returned" ($projects.data.Count -ge 1) "(Count: $($projects.data.Count))"

$p1 = $projects.data[0]
$pDetail = Invoke-RestMethod -Uri "$baseUrl/district/projects/$($p1.id)" -Method Get -Headers $distHeaders
Assert-Test "Project Detail Retrieved" ($pDetail.success -eq $true) "(Project: $($pDetail.data.name))"

# -------------------------------------------------------------------------
# TEST 4: Field Verification Workflow (Verify & Return with Reason)
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 4: CALA Field Verification Workflow ---"

$verifs = Invoke-RestMethod -Uri "$baseUrl/district/verifications" -Method Get -Headers $distHeaders
Assert-Test "Verifications List Status 200 OK" ($verifs.success -eq $true) "(Records: $($verifs.data.Count))"

$targetItem = $verifs.data[0]
Write-Host "  Testing on Survey No: $($targetItem.surveyNumber) (Parcel: $($targetItem.parcelNumber))"

# 4A: Return without reason MUST fail (Validation Rule)
try {
    $emptyReturnBody = @{ reason = "" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/district/verifications/$($targetItem.id)/return" -Method Post -ContentType "application/json" -Body $emptyReturnBody -Headers $distHeaders
    Assert-Test "Return Without Reason Blocked" $false "Expected 400 Bad Request"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test "Return Without Reason Blocked (400 Bad Request)" ($statusCode -eq 400) "(Status Code: $statusCode)"
}

# 4B: Return with Valid Reason MUST succeed
$validReturnBody = @{ reason = "Khasra boundary mismatch with Village Gram Sabha land in Dabathwa." } | ConvertTo-Json
$returnRes = Invoke-RestMethod -Uri "$baseUrl/district/verifications/$($targetItem.id)/return" -Method Post -ContentType "application/json" -Body $validReturnBody -Headers $distHeaders
Assert-Test "Return With Reason Succeeded" ($returnRes.success -eq $true) "($($returnRes.message))"

# 4C: Verify Field Parcel MUST succeed
$verifyBody = @{ comments = "Boundary pegs fixed, DGPS coordinates verified on site by CALA Meerut." } | ConvertTo-Json
$verifyRes = Invoke-RestMethod -Uri "$baseUrl/district/verifications/$($targetItem.id)/verify" -Method Post -ContentType "application/json" -Body $verifyBody -Headers $distHeaders
Assert-Test "Verify Parcel Succeeded" ($verifyRes.success -eq $true) "($($verifyRes.message))"

# -------------------------------------------------------------------------
# TEST 5: Joint Measurement Surveys (JMS)
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 5: Joint Measurement Surveys (JMS) ---"

$surveys = Invoke-RestMethod -Uri "$baseUrl/district/surveys" -Method Get -Headers $distHeaders
Assert-Test "Surveys List Status 200 OK" ($surveys.success -eq $true) "(Count: $($surveys.data.Count))"

$sTarget = $surveys.data[0]
$statusBody = @{ comments = "DGPS coordinates verified on ground." } | ConvertTo-Json
$statusRes = Invoke-RestMethod -Uri "$baseUrl/district/surveys/$($sTarget.id)/status" -Method Post -ContentType "application/json" -Body $statusBody -Headers $distHeaders
Assert-Test "Update Survey Status Succeeded" ($statusRes.success -eq $true) "($($statusRes.message))"

# -------------------------------------------------------------------------
# TEST 6: District GIS (PostGIS Parcels & Corridors)
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 6: District GIS & PostGIS Polygons ---"

$gisProj = Invoke-RestMethod -Uri "$baseUrl/district/gis/projects" -Method Get -Headers $distHeaders
Assert-Test "GIS Projects Status 200 OK" ($gisProj.success -eq $true) ""
Assert-Test "GIS Projects Contain Coordinates" ($gisProj.data.Count -ge 1 -and $gisProj.data[0].latitude -ne 0) "(Lat: $($gisProj.data[0].latitude), Lng: $($gisProj.data[0].longitude))"

$gisParcels = Invoke-RestMethod -Uri "$baseUrl/district/gis/parcels" -Method Get -Headers $distHeaders
Assert-Test "GIS Parcels Status 200 OK" ($gisParcels.success -eq $true) ""
Assert-Test "GIS Parcels Contain GeoJSON Polygons" ($gisParcels.data.Count -ge 2 -and $gisParcels.data[0].geoJsonGeometry -like "*Polygon*") "(Geometry: $($gisParcels.data[0].geoJsonGeometry.Substring(0, 30))...)"

# -------------------------------------------------------------------------
# TEST 7: Compensation Direct Benefit Transfer (DBT)
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 7: Compensation Direct Benefit Transfer (DBT) ---"

$comp = Invoke-RestMethod -Uri "$baseUrl/district/compensation" -Method Get -Headers $distHeaders
Assert-Test "Compensation Status 200 OK" ($comp.success -eq $true) ""
Assert-Test "Total Assessed Awards" ($comp.data.totalAssessed -gt 0) "(Assessed: INR $($comp.data.totalAssessed))"
Assert-Test "Total DBT Disbursed" ($comp.data.totalDisbursed -ge 0) "(Disbursed: INR $($comp.data.totalDisbursed))"
Assert-Test "Assessments Items List" ($comp.data.assessments.Count -ge 1) "(Assessments: $($comp.data.assessments.Count))"

# -------------------------------------------------------------------------
# TEST 8: Land Possession & RoR Mutation Handover
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 8: Land Possession & Section 38 Handover ---"

$poss = Invoke-RestMethod -Uri "$baseUrl/district/possession" -Method Get -Headers $distHeaders
Assert-Test "Possession Status 200 OK" ($poss.success -eq $true) ""
Assert-Test "Total Possession Parcels" ($poss.data.totalParcels -ge 1) "(Total: $($poss.data.totalParcels))"

$possTarget = $poss.data.records[0]
$takePossBody = @{ comments = "Section 38 Panchnama executed and RoR mutated." } | ConvertTo-Json
$takePossRes = Invoke-RestMethod -Uri "$baseUrl/district/possession/$($possTarget.parcelId)/take-possession" -Method Post -ContentType "application/json" -Body $takePossBody -Headers $distHeaders
Assert-Test "Take Possession Succeeded" ($takePossRes.success -eq $true) "($($takePossRes.message))"

# -------------------------------------------------------------------------
# TEST 9: Rehabilitation & Resettlement (R&R)
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 9: Rehabilitation and Resettlement (R and R) ---"

$rehab = Invoke-RestMethod -Uri "$baseUrl/district/rehabilitation" -Method Get -Headers $distHeaders
Assert-Test "Rehabilitation Status 200 OK" ($rehab.success -eq $true) ""
Assert-Test "Total Affected Families" ($rehab.data.totalAffectedFamilies -gt 0) "(Families: $($rehab.data.totalAffectedFamilies))"
Assert-Test "Eligible Grants Amount" ($rehab.data.totalEligibleAmount -gt 0) "(Amount: INR $($rehab.data.totalEligibleAmount))"
Assert-Test "R and R Cases List" ($rehab.data.cases.Count -ge 1) "(Cases: $($rehab.data.cases.Count))"

# -------------------------------------------------------------------------
# TEST 10: District Executive Reports
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 10: District Executive Reports ---"

$report = Invoke-RestMethod -Uri "$baseUrl/district/reports" -Method Get -Headers $distHeaders
Assert-Test "Report Status 200 OK" ($report.success -eq $true) ""
Assert-Test "Tehsil Progress Breakdown" ($report.data.tehsilProgress.Count -ge 1) "(Tehsils: $($report.data.tehsilProgress.Count))"
Assert-Test "Monthly Progression Trends" ($report.data.monthlyTrends.Count -eq 4) "(Trends: $($report.data.monthlyTrends.Count))"

# -------------------------------------------------------------------------
# TEST 11: Security Isolation & Cross-District Protection
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 11: Security Isolation and RBAC Protection ---"

# 11A: Tampering with another district ID query param is ignored on backend
$tamperDash = Invoke-RestMethod -Uri "$baseUrl/district/dashboard?districtId=11111111-2222-3333-4444-555555555555" -Method Get -Headers $distHeaders
Assert-Test "Cross-District Tampering Ignored/Isolated (Still Meerut)" ($tamperDash.data.districtName -eq "Meerut") "(Protected District: $($tamperDash.data.districtName))"

# 11B: Unauthenticated request rejected with 401
try {
    Invoke-RestMethod -Uri "$baseUrl/district/dashboard" -Method Get
    Assert-Test "Unauthenticated Access Blocked" $false "Expected 401"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test "Unauthenticated Access Blocked (401 Unauthorized)" ($statusCode -eq 401) ""
}

# -------------------------------------------------------------------------
# TEST 12: Regression Tests (SuperAdmin, CentralAdmin, StateAdmin)
# -------------------------------------------------------------------------
Write-Host "`n--- TEST GROUP 12: Platform Regression Suite ---"

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

# State Admin Login & Dashboard
$stateLoginBody = @{ username = "state.admin"; password = "State@123" } | ConvertTo-Json
$stateLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $stateLoginBody
$stateHeaders = @{ Authorization = "Bearer $($stateLoginRes.data.accessToken)" }

$stateDash = Invoke-RestMethod -Uri "$baseUrl/state/dashboard" -Method Get -Headers $stateHeaders
Assert-Test "State Admin Dashboard Operational" ($stateDash.success -eq $true) "(State: $($stateDash.data.stateName))"

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
    Write-Host "`n>>> [SUCCESS] 100% OF BHOOMISETU DISTRICT ADMIN TESTS PASSED! <<<`n" -ForegroundColor Green
} else {
    Write-Host "`n>>> [FAILURE] SOME TESTS FAILED. PLEASE REVIEW LOGS. <<<`n" -ForegroundColor Red
}
