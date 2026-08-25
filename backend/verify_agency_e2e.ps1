$ErrorActionPreference = "Continue"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  BHOOMISETU - PROJECT AGENCY PHASE 0 COMPREHENSIVE E2E VERIFICATION  " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000/api/v1"
$passed = 0
$failed = 0

function Assert-Condition([bool]$condition, [string]$message) {
    if ($condition) {
        Write-Host " [PASS] $message" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host " [FAIL] $message" -ForegroundColor Red
        $script:failed++
    }
}

# ============================================================================
# 1. AUTHENTICATION & RBAC ROLES
# ============================================================================
Write-Host "`n--- 1. AUTHENTICATION & RBAC VERIFICATION ---" -ForegroundColor Yellow

# NHAI Agency User
$nhaiLoginBody = @{
    username = "agency.user"
    password = "Agency@123"
} | ConvertTo-Json

$nhaiToken = $null
$nhaiUser = $null

try {
    $nhaiRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $nhaiLoginBody -ContentType "application/json"
    $nhaiToken = $nhaiRes.data.accessToken
    $nhaiUser = $nhaiRes.data.user
    Assert-Condition ($nhaiToken -ne $null -and $nhaiUser.role -eq "ProjectAgency") "NHAI Agency User authenticated successfully (Role: $($nhaiUser.role), Org: $($nhaiUser.organizationName))"
} catch {
    Assert-Condition $false "NHAI Agency User login failed: $_"
}

# DFCCIL Agency User (for cross-tenant testing)
$dfccilLoginBody = @{
    username = "dfccil.agency"
    password = "Agency@123"
} | ConvertTo-Json

$dfccilToken = $null
$dfccilUser = $null

try {
    $dfccilRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $dfccilLoginBody -ContentType "application/json"
    $dfccilToken = $dfccilRes.data.accessToken
    $dfccilUser = $dfccilRes.data.user
    Assert-Condition ($dfccilToken -ne $null -and $dfccilUser.role -eq "ProjectAgency") "DFCCIL Agency User authenticated successfully (Role: $($dfccilUser.role), Org: $($dfccilUser.organizationName))"
} catch {
    Assert-Condition $false "DFCCIL Agency User login failed: $_"
}

# State Admin User (testing access denial to agency API)
$stateLoginBody = @{
    username = "state.admin"
    password = "State@123"
} | ConvertTo-Json

$stateToken = $null
try {
    $stateRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $stateLoginBody -ContentType "application/json"
    $stateToken = $stateRes.data.accessToken
    Assert-Condition ($stateToken -ne $null) "State Admin User authenticated for RBAC boundary testing"
} catch {
    Assert-Condition $false "State Admin login failed: $_"
}

# RBAC: Unauthenticated access returns 401
try {
    $unauthRes = Invoke-RestMethod -Uri "$baseUrl/agency/dashboard" -Method Get
    Assert-Condition $false "Unauthenticated access should have been rejected"
} catch [System.Net.WebException] {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Assert-Condition ($statusCode -eq 401) "Unauthenticated access to /api/v1/agency/dashboard rejected with 401 Unauthorized"
}

# RBAC: StateAdmin role access returns 403
$stateHeaders = @{ Authorization = "Bearer $stateToken" }
try {
    $stateDeniedRes = Invoke-RestMethod -Uri "$baseUrl/agency/dashboard" -Method Get -Headers $stateHeaders
    Assert-Condition $false "StateAdmin access to agency API should have been rejected"
} catch [System.Net.WebException] {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Assert-Condition ($statusCode -eq 403) "StateAdmin role access to /api/v1/agency/dashboard rejected with 403 Forbidden"
}

# ============================================================================
# 2. AGENCY DASHBOARD & 8 KPIS (NHAI CONTEXT)
# ============================================================================
Write-Host "`n--- 2. AGENCY DASHBOARD & 8 KPIS (NHAI) ---" -ForegroundColor Yellow

$nhaiHeaders = @{ Authorization = "Bearer $nhaiToken" }
$nhaiDash = $null

try {
    $dashRes = Invoke-RestMethod -Uri "$baseUrl/agency/dashboard" -Method Get -Headers $nhaiHeaders
    $nhaiDash = $dashRes.data
    Assert-Condition ($dashRes.success -and $nhaiDash.organizationName -like "*NHAI*") "NHAI Dashboard loaded successfully (Org: $($nhaiDash.organizationName))"
    
    $kpis = $nhaiDash.kpis
    Assert-Condition ($kpis.totalProjects -ge 1) "KPI 1: Total Projects = $($kpis.totalProjects)"
    Assert-Condition ($kpis.draftProposals -ge 0) "KPI 2: Draft Proposals = $($kpis.draftProposals)"
    Assert-Condition ($kpis.submittedUnderReview -ge 0) "KPI 3: Submitted Under Review = $($kpis.submittedUnderReview)"
    Assert-Condition ($kpis.approvedProjects -ge 0) "KPI 4: Approved Projects = $($kpis.approvedProjects)"
    Assert-Condition ($kpis.landRequiredHectares -gt 0) "KPI 5: Land Required = $($kpis.landRequiredHectares) Ha"
    Assert-Condition ($kpis.landAcquiredHectares -ge 0) "KPI 6: Land Acquired = $($kpis.landAcquiredHectares) Ha"
    Assert-Condition ($kpis.compensationPaid -ge 0) "KPI 7: Compensation Paid = ₹$($kpis.compensationPaid)"
    Assert-Condition ($kpis.delayedProjects -ge 0) "KPI 8: Delayed Projects = $($kpis.delayedProjects)"

    Assert-Condition ($nhaiDash.acquisitionProgress.Count -eq 6) "Acquisition Progress breakdown has 6 statutory stages"
    Assert-Condition ($nhaiDash.recentActivity.Count -ge 1) "Recent Activity feed populated with audit events ($($nhaiDash.recentActivity.Count) items)"
} catch {
    Assert-Condition $false "NHAI Dashboard loading failed: $_"
}

# ============================================================================
# 3. STRICT CROSS-TENANT ISOLATION (DFCCIL vs NHAI)
# ============================================================================
Write-Host "`n--- 3. CROSS-TENANT ISOLATION & DATA SECURITY ---" -ForegroundColor Yellow

$dfccilHeaders = @{ Authorization = "Bearer $dfccilToken" }

try {
    $dfccilDashRes = Invoke-RestMethod -Uri "$baseUrl/agency/dashboard" -Method Get -Headers $dfccilHeaders
    $dfccilDash = $dfccilDashRes.data
    Assert-Condition ($dfccilDash.organizationName -like "*DFCCIL*" -or $dfccilDash.organizationCode -eq "DFCCIL") "DFCCIL Dashboard strictly scoped to DFCCIL Organization"
} catch {
    Assert-Condition $false "DFCCIL Dashboard error: $_"
}

# Pick an NHAI Project
if ($nhaiDash -and $nhaiDash.projects.Count -gt 0) {
    $nhaiProject = $nhaiDash.projects[0]
    # Attempt to access NHAI project as DFCCIL
    try {
        $crossAccessRes = Invoke-RestMethod -Uri "$baseUrl/agency/projects/$($nhaiProject.projectId)" -Method Get -Headers $dfccilHeaders
        Assert-Condition $false "Cross-tenant project access should have been rejected"
    } catch [System.Net.WebException] {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Assert-Condition ($statusCode -eq 403) "Cross-tenant project access rejected with 403 Forbidden"
    }
}

# ============================================================================
# 4. MY PROJECTS & PROJECT WORKSPACE
# ============================================================================
Write-Host "`n--- 4. MY PROJECTS & PROJECT WORKSPACE ---" -ForegroundColor Yellow

try {
    $projectsRes = Invoke-RestMethod -Uri "$baseUrl/agency/projects" -Method Get -Headers $nhaiHeaders
    $projectsList = $projectsRes.data
    Assert-Condition ($projectsList.Count -ge 1) "My Projects list returned $($projectsList.Count) projects for NHAI"

    $activeProject = $projectsList | Where-Object { $_.landAcquiredHectares -gt 0 -or $_.progressPercentage -gt 0 } | Select-Object -First 1
    if (-not $activeProject) { $activeProject = $projectsList[0] }
    $firstProjId = $activeProject.projectId
    $wsRes = Invoke-RestMethod -Uri "$baseUrl/agency/projects/$firstProjId" -Method Get -Headers $nhaiHeaders
    $ws = $wsRes.data

    Assert-Condition ($ws.projectId -eq $firstProjId) "Workspace loaded for project: $($ws.projectName) ($($ws.projectCode))"
    Assert-Condition ($ws.landParcels.Count -ge 1) "Workspace Land Cadastre contains $($ws.landParcels.Count) parcels with spatial geometry"
    Assert-Condition ($ws.documents.Count -ge 1) "Workspace Documents contains $($ws.documents.Count) clearance files"
    Assert-Condition ($ws.compensation.assessedAmount -gt 0) "Workspace Compensation summary: Assessed = ₹$($ws.compensation.assessedAmount), Disbursed = ₹$($ws.compensation.disbursedAmount)"
    Assert-Condition ($ws.possession.totalParcels -gt 0) "Workspace Possession summary: Total = $($ws.possession.totalParcels), Taken = $($ws.possession.possessionTakenCount)"
    Assert-Condition ($ws.rehabilitation.totalAffectedFamilies -gt 0) "Workspace Rehabilitation summary: Families = $($ws.rehabilitation.totalAffectedFamilies)"
    Assert-Condition ($ws.timeline.Count -ge 1) "Workspace Timeline contains $($ws.timeline.Count) statutory milestones"
} catch {
    Assert-Condition $false "Projects and Workspace verification failed: $_"
}

# ============================================================================
# 5. 5-STEP PROPOSAL WIZARD: SAVE DRAFT, RESUME DRAFT, ATOMIC SUBMIT
# ============================================================================
Write-Host "`n--- 5. 5-STEP PROPOSAL WIZARD & ATOMIC SUBMISSION ---" -ForegroundColor Yellow

$geographyRes = Invoke-RestMethod -Uri "$baseUrl/auth/geography" -Method Get
$stateUp = $geographyRes.data | Where-Object { $_.code -eq "UP" }
$distMrt = $stateUp.districts | Where-Object { $_.name -like "*Meerut*" -or $_.code -eq "UP-MRT" }

# STEP 5.1: Create Draft Proposal
$createDraftBody = @{
    isNewProject = $true
    projectName = "NHAI Greater Noida - Jewar Airport Dedicated Freight Feeder"
    projectCode = "NHAI-E2E-TEST-$((Get-Date).Ticks % 10000)"
    projectType = 0
    stateId = $stateUp.id
    districtId = $distMrt.id
    description = "Dedicated multimodal logistics RoW connector spur linking industrial zone to upcoming airport terminal."
    estimatedCost = 350000000
    landAreaProposed = 38.5
    tehsilName = "Meerut Sadar"
    villageName = "Dabathwa"
    surveyNumbers = "101/A, 102/B, 105/1, 108/3"
    landCategory = "Agricultural (Single/Double Crop)"
    affectedFamilyCount = 18
    displacedFamilyCount = 4
    rehabEligibleCount = 4
    estimatedCompensation = 68000000
    isDraft = $true
    documents = @(
        @{
            documentType = 0
            fileName = "DPR_Jewar_Feeder_Draft.pdf"
            storagePath = "/documents/proposals/test/DPR_Jewar_Feeder.pdf"
            fileSize = 4500000
            remarks = "Preliminary engineering feasibility"
        }
    )
} | ConvertTo-Json

$newDraftProposal = $null

try {
    $createDraftRes = Invoke-RestMethod -Uri "$baseUrl/agency/proposals" -Method Post -Body $createDraftBody -ContentType "application/json" -Headers $nhaiHeaders
    $newDraftProposal = $createDraftRes.data
    Assert-Condition ($createDraftRes.success -and $newDraftProposal.status -eq "Draft") "Created Draft Proposal $($newDraftProposal.proposalNumber) (Status: $($newDraftProposal.status), CurrentStage: $($newDraftProposal.currentStage))"
} catch {
    Assert-Condition $false "Create Draft Proposal failed: $_"
}

# STEP 5.2: Update / Resume Draft
if ($newDraftProposal) {
    $updateDraftBody = @{
        isNewProject = $false
        projectName = "NHAI Greater Noida - Jewar Airport Dedicated Freight Feeder (Revised)"
        projectType = 0
        stateId = $stateUp.id
        districtId = $distMrt.id
        description = "Revised RoW alignment adjusting village boundary buffer."
        estimatedCost = 365000000
        landAreaProposed = 40.0
        affectedFamilyCount = 20
        estimatedCompensation = 72000000
        isDraft = $true
    } | ConvertTo-Json

    try {
        $updateRes = Invoke-RestMethod -Uri "$baseUrl/agency/proposals/$($newDraftProposal.id)" -Method Put -Body $updateDraftBody -ContentType "application/json" -Headers $nhaiHeaders
        Assert-Condition ($updateRes.success -and $updateRes.data.landAreaProposed -eq 40.0) "Draft Proposal updated successfully (New Area: $($updateRes.data.landAreaProposed) Ha, Families: $($updateRes.data.affectedFamilyCount))"
    } catch {
        Assert-Condition $false "Update Draft Proposal failed: $_"
    }

    # STEP 5.3: Attach Supporting Document
    $attachDocBody = @{
        documentType = 9
        fileName = "Environment_Impact_Clearance_Stage1.pdf"
        storagePath = "/documents/proposals/test/MoEFCC_Clearance.pdf"
        fileSize = 3200000
        remarks = "MoEFCC Clearance Letter"
    } | ConvertTo-Json

    try {
        $docRes = Invoke-RestMethod -Uri "$baseUrl/agency/proposals/$($newDraftProposal.id)/documents" -Method Post -Body $attachDocBody -ContentType "application/json" -Headers $nhaiHeaders
        Assert-Condition ($docRes.success -and $docRes.data.fileName -eq "Environment_Impact_Clearance_Stage1.pdf") "Supporting document attached successfully to proposal"
    } catch {
        Assert-Condition $false "Attach document failed: $_"
    }

    # STEP 5.4: Atomic Submission
    try {
        $submitRes = Invoke-RestMethod -Uri "$baseUrl/agency/proposals/$($newDraftProposal.id)/submit" -Method Post -ContentType "application/json" -Headers $nhaiHeaders
        $submittedProp = $submitRes.data
        Assert-Condition ($submitRes.success -and $submittedProp.status -eq "Submitted" -and $submittedProp.submittedAt -ne $null) "Proposal atomically submitted! (Status: $($submittedProp.status), Stage: $($submittedProp.currentStage))"
    } catch {
        Assert-Condition $false "Submit Proposal failed: $_"
    }
}

# ============================================================================
# 6. PROPOSAL TRACKING & 8-STAGE STATUTORY WORKFLOW
# ============================================================================
Write-Host "`n--- 6. PROPOSAL TRACKING & 8-STAGE WORKFLOW LIFECYCLE ---" -ForegroundColor Yellow

try {
    $trackListRes = Invoke-RestMethod -Uri "$baseUrl/agency/tracking" -Method Get -Headers $nhaiHeaders
    $trackList = $trackListRes.data
    Assert-Condition ($trackList.Count -ge 1) "Proposal Tracking ledger returned $($trackList.Count) items"

    $trackDetailRes = Invoke-RestMethod -Uri "$baseUrl/agency/tracking/$($trackList[0].proposalId)" -Method Get -Headers $nhaiHeaders
    $trackDetail = $trackDetailRes.data

    Assert-Condition ($trackDetail.workflowStages.Count -eq 8) "Statutory workflow has exactly 8 lifecycle stages"
    $stageNames = ($trackDetail.workflowStages | ForEach-Object { $_.stageName }) -join ", "
    Write-Host "    Stages: $stageNames" -ForegroundColor Gray
    Assert-Condition ($trackDetail.workflowStages[0].stageName -eq "Draft" -and $trackDetail.workflowStages[0].status -eq "Completed") "Stage 1 (Draft) is Completed"
} catch {
    Assert-Condition $false "Proposal Tracking verification failed: $_"
}

# ============================================================================
# 7. REGRESSION SUITE: CENTRAL, STATE, DISTRICT, ADMIN
# ============================================================================
Write-Host "`n--- 7. REGRESSION INTEGRITY CHECKS ---" -ForegroundColor Yellow

# Super Admin Dashboard
$adminLoginBody = @{ username = "super.admin"; password = "Admin@123" } | ConvertTo-Json
$adminRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
$adminHeaders = @{ Authorization = "Bearer $($adminRes.data.accessToken)" }
$adminDashRes = Invoke-RestMethod -Uri "$baseUrl/admin/dashboard" -Method Get -Headers $adminHeaders
Assert-Condition ($adminDashRes.success) "Super Admin Dashboard intact (Status: 200 OK)"

# Central Admin Dashboard
$centralLoginBody = @{ username = "central.admin"; password = "Central@123" } | ConvertTo-Json
$centralRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $centralLoginBody -ContentType "application/json"
$centralHeaders = @{ Authorization = "Bearer $($centralRes.data.accessToken)" }
$centralDashRes = Invoke-RestMethod -Uri "$baseUrl/central/dashboard" -Method Get -Headers $centralHeaders
Assert-Condition ($centralDashRes.success) "Central Admin Dashboard intact (Status: 200 OK)"

# State Admin Dashboard
$stateDashRes = Invoke-RestMethod -Uri "$baseUrl/state/dashboard" -Method Get -Headers $stateHeaders
Assert-Condition ($stateDashRes.success) "State Admin Dashboard intact (Status: 200 OK)"

# District Admin Dashboard
$distLoginBody = @{ username = "district.admin"; password = "District@123" } | ConvertTo-Json
$distRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $distLoginBody -ContentType "application/json"
$distHeaders = @{ Authorization = "Bearer $($distRes.data.accessToken)" }
$distDashRes = Invoke-RestMethod -Uri "$baseUrl/district/dashboard" -Method Get -Headers $distHeaders
Assert-Condition ($distDashRes.success) "District Admin Dashboard intact (Status: 200 OK)"

# ============================================================================
# SUMMARY REPORT
# ============================================================================
Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION SUMMARY: $passed PASSED, $failed FAILED" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "=================================================================" -ForegroundColor Cyan

if ($failed -gt 0) {
    exit 1
}
