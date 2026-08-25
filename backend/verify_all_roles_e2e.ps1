# ==============================================================================
# BHOOMISETU -- MASTER END-TO-END SYSTEM-WIDE VERIFICATION SUITE
# Covers all 12 Required Core Journeys, RBAC, Data Scoping, Multi-Tenancy & Persistence
# ==============================================================================

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:5000/api/v1"
$passedCount = 0
$failedCount = 0

function Assert-Condition($condition, $message) {
    if ($condition) {
        Write-Host " [PASS] $message" -ForegroundColor Green
        $global:passedCount++
    } else {
        Write-Host " [FAIL] $message" -ForegroundColor Red
        $global:failedCount++
    }
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  BHOOMISETU -- MASTER SYSTEM-WIDE E2E VERIFICATION SUITE         " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# Fetch Geography for realistic jurisdiction testing
$geographyRes = Invoke-RestMethod -Uri "$baseUrl/auth/geography" -Method Get
$stateUp = $geographyRes.data | Where-Object { $_.code -eq "UP" }
$stateUpId = if ($stateUp) { $stateUp.id } else { $geographyRes.data[0].id }
$distMrt = if ($stateUp) { $stateUp.districts | Where-Object { $_.code -eq "UP-MRT" -or $_.name -like "*Meerut*" } } else { $null }
$distMrtId = if ($distMrt) { $distMrt.id } else { $stateUp.districts[0].id }

# ------------------------------------------------------------------------------
# TEST 1: AUTHENTICATION -- BAD CREDENTIALS VS VALID LOGIN
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 1: AUTHENTICATION & LOGIN FLOW ---" -ForegroundColor Yellow

# 1.1 Bad Credentials Rejected
try {
    $badLoginPayload = @{ username = "invalid.user"; password = "WrongPassword123" } | ConvertTo-Json
    $badLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $badLoginPayload -ContentType "application/json"
    Assert-Condition $false "Bad login should have returned 400 Bad Request"
} catch [System.Net.WebException] {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Assert-Condition ($statusCode -eq 400) "Invalid login rejected with 400 Bad Request"
}

# 1.2 SuperAdmin Login
$adminToken = $null
try {
    $adminPayload = @{ username = "super.admin"; password = "Admin@123" } | ConvertTo-Json
    $adminLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminPayload -ContentType "application/json"
    if ($adminLoginRes.success -and $adminLoginRes.data.accessToken) {
        $adminToken = $adminLoginRes.data.accessToken
        Assert-Condition ($adminLoginRes.data.user.role -eq "SuperAdmin") "SuperAdmin login successful (Role: $($adminLoginRes.data.user.role))"
    } else {
        Assert-Condition $false "SuperAdmin login failed: $($adminLoginRes.message)"
    }
} catch {
    Assert-Condition $false "SuperAdmin login error: $_"
}

$adminHeaders = @{ Authorization = "Bearer $adminToken" }

# ------------------------------------------------------------------------------
# TEST 2: REGISTRATION & MANUAL LOGIN FLOW (Registration != Login)
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 2: REGISTRATION & MANUAL LOGIN FLOW ---" -ForegroundColor Yellow

$uniqueSuffix = Get-Random -Minimum 1000 -Maximum 9999
$newUsername = "officer.cala.$uniqueSuffix"
$newEmail = "officer.cala.$uniqueSuffix@gov.in"
$newPassword = "Password@123"

# 2.1 Register New DistrictAdmin Operational User
$regSuccess = $false
try {
    $regPayload = @{
        username = $newUsername
        email = $newEmail
        password = $newPassword
        firstName = "Ramesh"
        lastName = "Sharma"
        phone = "9876543210"
        role = "DistrictAdmin"
        stateId = $stateUpId
        districtId = $distMrtId
    } | ConvertTo-Json

    $regRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $regPayload -ContentType "application/json"
    
    # Assert registration succeeds AND DOES NOT return a JWT token (Registration != Login)
    $hasNoToken = ($regRes.data.accessToken -eq $null)
    Assert-Condition ($regRes.success -and $hasNoToken) "Registration succeeded without automatic login (Token is null, Registration != Login)"
    $regSuccess = $regRes.success
} catch {
    Assert-Condition $false "Registration request failed: $_"
}

# 2.2 Login with Registered Credentials
$newOfficerToken = $null
if ($regSuccess) {
    try {
        $newLoginPayload = @{ username = $newUsername; password = $newPassword } | ConvertTo-Json
        $newLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $newLoginPayload -ContentType "application/json"
        
        if ($newLoginRes.success -and $newLoginRes.data.accessToken) {
            $newOfficerToken = $newLoginRes.data.accessToken
            Assert-Condition ($newLoginRes.data.user.role -eq "DistrictAdmin") "Manual login with registered credentials issued JWT (Role: $($newLoginRes.data.user.role))"
        } else {
            Assert-Condition $false "Manual login failed: $($newLoginRes.message)"
        }
    } catch {
        Assert-Condition $false "Manual login exception: $_"
    }
}

# ------------------------------------------------------------------------------
# TEST 3: DUPLICATE ACCOUNT REGISTRATION REJECTION
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 3: DUPLICATE ACCOUNT HANDLING ---" -ForegroundColor Yellow

try {
    $dupPayload = @{
        username = $newUsername
        email = $newEmail
        password = $newPassword
        firstName = "Duplicate"
        lastName = "User"
        phone = "9876543210"
        role = "DistrictAdmin"
    } | ConvertTo-Json

    $dupRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $dupPayload -ContentType "application/json"
    Assert-Condition $false "Duplicate registration should have been rejected"
} catch [System.Net.WebException] {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Assert-Condition ($statusCode -eq 400) "Duplicate username/email rejected with 400 Bad Request"
}

# ------------------------------------------------------------------------------
# TEST 4: PRIVILEGE ESCALATION PROTECTION (Cannot Register as SuperAdmin)
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 4: PRIVILEGE ESCALATION PROTECTION ---" -ForegroundColor Yellow

try {
    $privEscPayload = @{
        username = "hacker.admin.$uniqueSuffix"
        email = "hacker.$uniqueSuffix@gov.in"
        password = "Password@123"
        firstName = "Unauthorized"
        lastName = "Admin"
        phone = "9876543210"
        role = "SuperAdmin"
    } | ConvertTo-Json

    $privRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $privEscPayload -ContentType "application/json"
    Assert-Condition $false "SuperAdmin registration should have been rejected"
} catch [System.Net.WebException] {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Assert-Condition ($statusCode -eq 400) "SuperAdmin registration attempt rejected with 400 Bad Request"
}

# ------------------------------------------------------------------------------
# TEST 5: ROLE-BASED ACCESS CONTROL (Citizen Forbidden from Admin APIs)
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 5: RBAC & PRIVILEGE BOUNDARIES ---" -ForegroundColor Yellow

$citizenUsername = "citizen.user.$uniqueSuffix"
$citizenEmail = "citizen.$uniqueSuffix@gmail.com"
$citizenToken = $null

try {
    $citizenRegPayload = @{
        username = $citizenUsername
        email = $citizenEmail
        password = "Password@123"
        firstName = "Vijay"
        lastName = "Kumar"
        phone = "9876543210"
        role = "Citizen"
    } | ConvertTo-Json
    $cRegRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $citizenRegPayload -ContentType "application/json"
    
    $cLoginPayload = @{ username = $citizenUsername; password = "Password@123" } | ConvertTo-Json
    $cLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $cLoginPayload -ContentType "application/json"
    $citizenToken = $cLoginRes.data.accessToken
    Assert-Condition ($cLoginRes.data.user.role -eq "Citizen") "Citizen registered & authenticated successfully"
} catch {
    Assert-Condition $false "Citizen auth failed: $_"
}

if ($citizenToken) {
    try {
        $citHeaders = @{ Authorization = "Bearer $citizenToken" }
        $citCentralRes = Invoke-RestMethod -Uri "$baseUrl/central/dashboard" -Method Get -Headers $citHeaders
        Assert-Condition $false "Citizen access to Central Admin API should have been rejected"
    } catch [System.Net.WebException] {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Assert-Condition ($statusCode -eq 403) "Citizen calling CentralAdmin API rejected with 403 Forbidden"
    }
}

# ------------------------------------------------------------------------------
# TEST 6: UNAUTHENTICATED REQUEST REJECTION
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 6: UNAUTHENTICATED REQUESTS (401) ---" -ForegroundColor Yellow

try {
    $unauthRes = Invoke-RestMethod -Uri "$baseUrl/central/dashboard" -Method Get
    Assert-Condition $false "Unauthenticated call should have been rejected"
} catch [System.Net.WebException] {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Assert-Condition ($statusCode -eq 401) "Unauthenticated request to protected API rejected with 401 Unauthorized"
}

# ------------------------------------------------------------------------------
# TEST 7: CENTRAL ADMIN -- NATIONAL OPERATIONS
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 7: CENTRAL ADMIN NATIONAL OPERATIONS ---" -ForegroundColor Yellow

$centralToken = $null
try {
    $cLoginPayload = @{ username = "central.admin"; password = "Central@123" } | ConvertTo-Json
    $cLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $cLoginPayload -ContentType "application/json"
    $centralToken = $cLoginRes.data.accessToken
    Assert-Condition ($cLoginRes.data.user.role -eq "CentralAdmin") "Central Admin authenticated"
} catch {
    Assert-Condition $false "Central Admin login failed: $_"
}

if ($centralToken) {
    $cHeaders = @{ Authorization = "Bearer $centralToken" }
    
    # 7.1 Dashboard
    try {
        $cDash = Invoke-RestMethod -Uri "$baseUrl/central/dashboard" -Method Get -Headers $cHeaders
        Assert-Condition ($cDash.success -and $cDash.data.kpis.totalProjects -ge 1) "Central Dashboard loaded (Projects: $($cDash.data.kpis.totalProjects), Land: $($cDash.data.kpis.totalLandProposedHectares) Ha)"
    } catch {
        Assert-Condition $false "Central Dashboard failed: $_"
    }

    # 7.2 GIS Projects
    try {
        $cGis = Invoke-RestMethod -Uri "$baseUrl/central/gis/projects" -Method Get -Headers $cHeaders
        Assert-Condition ($cGis.success -and $cGis.data.Count -ge 1) "Central National GIS returned $($cGis.data.Count) spatial corridors"
    } catch {
        Assert-Condition $false "Central GIS failed: $_"
    }

    # 7.3 Reports
    try {
        $cRep = Invoke-RestMethod -Uri "$baseUrl/central/reports/analytics" -Method Get -Headers $cHeaders
        Assert-Condition ($cRep.success -and $cRep.data.stateComparisons.Count -ge 1) "Central National Reports returned analytics across $($cRep.data.stateComparisons.Count) states"
    } catch {
        Assert-Condition $false "Central Reports failed: $_"
    }
}

# ------------------------------------------------------------------------------
# TEST 8: STATE ADMIN -- STATE-SCOPED OPERATIONS
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 8: STATE ADMIN STATE-SCOPED OPERATIONS ---" -ForegroundColor Yellow

$stateToken = $null
try {
    $sLoginPayload = @{ username = "state.admin"; password = "State@123" } | ConvertTo-Json
    $sLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $sLoginPayload -ContentType "application/json"
    $stateToken = $sLoginRes.data.accessToken
    Assert-Condition ($sLoginRes.data.user.role -eq "StateAdmin") "State Admin authenticated (State: $($sLoginRes.data.user.stateName))"
} catch {
    Assert-Condition $false "State Admin login failed: $_"
}

if ($stateToken) {
    $sHeaders = @{ Authorization = "Bearer $stateToken" }
    
    # 8.1 State Dashboard
    try {
        $sDash = Invoke-RestMethod -Uri "$baseUrl/state/dashboard" -Method Get -Headers $sHeaders
        Assert-Condition ($sDash.success -and $sDash.data.kpis.totalProjects -ge 1) "State Dashboard loaded with state-scoped projects ($($sDash.data.kpis.totalProjects))"
    } catch {
        Assert-Condition $false "State Dashboard failed: $_"
    }
}

# ------------------------------------------------------------------------------
# TEST 9: DISTRICT ADMIN -- DISTRICT OPERATIONS
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 9: DISTRICT ADMIN OPERATIONS ---" -ForegroundColor Yellow

$districtToken = $null
try {
    $dLoginPayload = @{ username = "district.admin"; password = "District@123" } | ConvertTo-Json
    $dLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $dLoginPayload -ContentType "application/json"
    $districtToken = $dLoginRes.data.accessToken
    Assert-Condition ($dLoginRes.data.user.role -eq "DistrictAdmin") "District Admin authenticated (District: $($dLoginRes.data.user.districtName))"
} catch {
    Assert-Condition $false "District Admin login failed: $_"
}

if ($districtToken) {
    $dHeaders = @{ Authorization = "Bearer $districtToken" }
    
    # 9.1 District Dashboard
    try {
        $dDash = Invoke-RestMethod -Uri "$baseUrl/district/dashboard" -Method Get -Headers $dHeaders
        Assert-Condition ($dDash.success -and $dDash.data.kpis.activeProjects -ge 1) "District Dashboard loaded with district-scoped projects ($($dDash.data.kpis.activeProjects))"
    } catch {
        Assert-Condition $false "District Dashboard failed: $_"
    }
}

# ------------------------------------------------------------------------------
# TEST 10: PROJECT AGENCY -- PROPOSALS & MULTI-TENANT ISOLATION
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 10: PROJECT AGENCY OPERATIONS & MULTI-TENANT ISOLATION ---" -ForegroundColor Yellow

$nhaiToken = $null
$dfccilToken = $null

try {
    $nhaiLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{ username = "agency.user"; password = "Agency@123" } | ConvertTo-Json) -ContentType "application/json"
    $nhaiToken = $nhaiLoginRes.data.accessToken
    Assert-Condition ($nhaiLoginRes.data.user.role -eq "ProjectAgency" -and $nhaiLoginRes.data.user.organizationName -like "*NHAI*") "NHAI Agency User authenticated (Org: $($nhaiLoginRes.data.user.organizationName))"

    $dfccilLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{ username = "dfccil.agency"; password = "Agency@123" } | ConvertTo-Json) -ContentType "application/json"
    $dfccilToken = $dfccilLoginRes.data.accessToken
    Assert-Condition ($dfccilLoginRes.data.user.role -eq "ProjectAgency" -and $dfccilLoginRes.data.user.organizationName -like "*DFCCIL*") "DFCCIL Agency User authenticated (Org: $($dfccilLoginRes.data.user.organizationName))"
} catch {
    Assert-Condition $false "Agency login failed: $_"
}

if ($nhaiToken -and $dfccilToken) {
    $nhaiHeaders = @{ Authorization = "Bearer $nhaiToken" }
    $dfccilHeaders = @{ Authorization = "Bearer $dfccilToken" }

    # 10.1 NHAI Dashboard
    try {
        $nhaiDash = Invoke-RestMethod -Uri "$baseUrl/agency/dashboard" -Method Get -Headers $nhaiHeaders
        Assert-Condition ($nhaiDash.success -and $nhaiDash.data.kpis.totalProjects -ge 1) "NHAI Agency Dashboard loaded (Projects: $($nhaiDash.data.kpis.totalProjects))"
    } catch {
        Assert-Condition $false "NHAI Dashboard failed: $_"
    }

    # 10.2 Create & Submit Proposal
    $createdProposalId = $null
    try {
        $propPayload = @{
            isNewProject = $true
            projectName = "NHAI Greater Noida - Jewar Freight Feeder $uniqueSuffix"
            projectCode = "NHAI-E2E-$uniqueSuffix"
            projectType = 0
            stateId = $stateUpId
            districtId = $distMrtId
            description = "Multimodal logistics corridor spur."
            estimatedCost = 350000000
            landAreaProposed = 38.5
            tehsilName = "Meerut Sadar"
            villageName = "Dabathwa"
            surveyNumbers = "101/A, 102/B"
            landCategory = "Agricultural"
            affectedFamilyCount = 18
            displacedFamilyCount = 4
            rehabEligibleCount = 4
            estimatedCompensation = 68000000
            isDraft = $true
        } | ConvertTo-Json

        $propRes = Invoke-RestMethod -Uri "$baseUrl/agency/proposals" -Method Post -Body $propPayload -Headers $nhaiHeaders -ContentType "application/json"
        if ($propRes.success -and $propRes.data.id) {
            $createdProposalId = $propRes.data.id
            Assert-Condition ($propRes.data.status -eq "Draft") "Proposal draft created (ID: $createdProposalId, Status: $($propRes.data.status))"
        }
    } catch {
        Assert-Condition $false "Create proposal failed: $_"
    }

    if ($createdProposalId) {
        # Submit Proposal
        try {
            $submitRes = Invoke-RestMethod -Uri "$baseUrl/agency/proposals/$createdProposalId/submit" -Method Post -Headers $nhaiHeaders
            Assert-Condition ($submitRes.success -and $submitRes.data.status -eq "Submitted") "Proposal atomically submitted (Status: $($submitRes.data.status))"
        } catch {
            Assert-Condition $false "Submit proposal failed: $_"
        }
    }

    # 10.3 Cross-Tenant Isolation: DFCCIL accessing NHAI project rejected
    try {
        $nhaiProjects = Invoke-RestMethod -Uri "$baseUrl/agency/projects" -Method Get -Headers $nhaiHeaders
        $sampleNhaiProj = $nhaiProjects.data[0]
        $crossRes = Invoke-RestMethod -Uri "$baseUrl/agency/projects/$($sampleNhaiProj.projectId)" -Method Get -Headers $dfccilHeaders
        Assert-Condition $false "DFCCIL accessing NHAI project should have been rejected"
    } catch [System.Net.WebException] {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Assert-Condition ($statusCode -eq 403) "Cross-tenant project access rejected with 403 Forbidden"
    }
}

# ------------------------------------------------------------------------------
# TEST 11: SUPER ADMIN -- PLATFORM GOVERNANCE
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 11: SUPER ADMIN PLATFORM GOVERNANCE ---" -ForegroundColor Yellow

if ($adminToken) {
    # 11.1 Users Management
    try {
        $usersRes = Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method Get -Headers $adminHeaders
        Assert-Condition ($usersRes.success -and $usersRes.data.items.Count -ge 1) "SuperAdmin Users ledger returned $($usersRes.data.items.Count) platform users"
    } catch {
        Assert-Condition $false "SuperAdmin users failed: $_"
    }

    # 11.2 Organizations
    try {
        $orgsRes = Invoke-RestMethod -Uri "$baseUrl/admin/organizations" -Method Get -Headers $adminHeaders
        Assert-Condition ($orgsRes.success -and $orgsRes.data.Count -ge 1) "SuperAdmin Organizations ledger returned $($orgsRes.data.Count) registered organizations"
    } catch {
        Assert-Condition $false "SuperAdmin organizations failed: $_"
    }

    # 11.3 Audit Trail
    try {
        $auditRes = Invoke-RestMethod -Uri "$baseUrl/admin/activity" -Method Get -Headers $adminHeaders
        Assert-Condition ($auditRes.success -and $auditRes.data.Count -ge 1) "SuperAdmin Audit trail populated with $($auditRes.data.Count) system events"
    } catch {
        Assert-Condition $false "SuperAdmin audit failed: $_"
    }

    # 11.4 System Health
    try {
        $healthRes = Invoke-RestMethod -Uri "$baseUrl/admin/system/health" -Method Get -Headers $adminHeaders
        Assert-Condition ($healthRes.success -and $healthRes.data.Count -ge 1) "SuperAdmin System Health status returned $($healthRes.data.Count) operational microservices"
    } catch {
        Assert-Condition $false "SuperAdmin health check failed: $_"
    }
}

# ------------------------------------------------------------------------------
# TEST 12: PERSISTENCE VERIFICATION IN POSTGRESQL
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 12: POSTGRESQL PERSISTENCE & DATA INTEGRITY ---" -ForegroundColor Yellow

# Verify newly registered user is queryable in the admin ledger
if ($adminToken -and $regSuccess) {
    try {
        $allUsers = Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method Get -Headers $adminHeaders
        $foundUser = $allUsers.data.items | Where-Object { $_.username -eq $newUsername }
        Assert-Condition ($foundUser -ne $null) "Newly registered user '$newUsername' is permanently persisted in PostgreSQL"
    } catch {
        Assert-Condition $false "Persistence query failed: $_"
    }
}

# ------------------------------------------------------------------------------
# FINAL SUMMARY
# ------------------------------------------------------------------------------
Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION SUMMARY: $passedCount PASSED, $failedCount FAILED" -ForegroundColor $(if ($failedCount -eq 0) { "Green" } else { "Red" })
Write-Host "=================================================================" -ForegroundColor Cyan

if ($failedCount -gt 0) {
    exit 1
} else {
    exit 0
}
