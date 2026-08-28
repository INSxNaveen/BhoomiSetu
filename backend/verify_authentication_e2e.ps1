$baseUrl = "http://localhost:5000/api/v1"
$ErrorActionPreference = "Continue"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  BHOOMISETU END-TO-END AUTHENTICATION & SECURITY TEST SUITE   " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$script:testResults = [System.Collections.Generic.List[PSCustomObject]]::new()

function Record-Test($name, $expected, $actual, $passed) {
    $status = if ($passed) { "PASS" } else { "FAIL" }
    $color = if ($passed) { "Green" } else { "Red" }
    Write-Host "[$status] $name | Expected: $expected | Actual: $actual" -ForegroundColor $color
    $script:testResults.Add([PSCustomObject]@{
        Test = $name
        Expected = $expected
        Actual = $actual
        Status = $status
    })
}

$uniqueId = [Guid]::NewGuid().ToString().Substring(0, 8)

# -------------------------------------------------------------------------------------------------
# 1. Register Citizen Flow
# -------------------------------------------------------------------------------------------------
$citizenUser = "test.citizen.$uniqueId"
$citizenPass = "CitizenPass@123"

$regBody = @{
    firstName = "Ramesh"
    lastName = "Kumar"
    username = $citizenUser
    email = "$citizenUser@example.gov.in"
    phone = "+91 9876500001"
    role = "Citizen"
    password = $citizenPass
} | ConvertTo-Json

try {
    $regRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $regBody -ContentType "application/json"
    $regPassed = ($regRes.success -eq $true -and $regRes.data.role -eq "Citizen")
    Record-Test "Register Citizen" "Account created (Citizen role)" "$($regRes.data.role)" $regPassed
} catch {
    Record-Test "Register Citizen" "Account created (Citizen role)" "Failed: $_" $false
}

# -------------------------------------------------------------------------------------------------
# 2. Login with Registered Citizen Credentials
# -------------------------------------------------------------------------------------------------
$loginBody = @{
    username = $citizenUser
    password = $citizenPass
} | ConvertTo-Json

$citizenToken = ""
try {
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $citizenToken = $loginRes.data.accessToken
    $role = $loginRes.data.user.role
    $loginPassed = ($loginRes.success -eq $true -and $role -eq "Citizen" -and $citizenToken.Length -gt 20)
    Record-Test "Login Citizen" "JWT + Citizen role" "Role: $role (Token Length: $($citizenToken.Length))" $loginPassed
} catch {
    Record-Test "Login Citizen" "JWT + Citizen role" "Failed: $_" $false
}

# -------------------------------------------------------------------------------------------------
# 3. Citizen Authorized Domain API Call
# -------------------------------------------------------------------------------------------------
if ($citizenToken) {
    try {
        $headers = @{ Authorization = "Bearer $citizenToken" }
        $projRes = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Get -Headers $headers
        $projPassed = ($projRes.success -eq $true)
        Record-Test "Citizen Authorized Domain API" "HTTP 200 OK" "HTTP 200 OK (Projects Count: $($projRes.data.Count))" $projPassed
    } catch {
        Record-Test "Citizen Authorized Domain API" "HTTP 200 OK" "Failed: $_" $false
    }
} else {
    Record-Test "Citizen Authorized Domain API" "HTTP 200 OK" "Skipped (No token)" $false
}

# -------------------------------------------------------------------------------------------------
# 4. Citizen Unauthorized Admin API Call (Should be 403 Forbidden)
# -------------------------------------------------------------------------------------------------
if ($citizenToken) {
    try {
        $headers = @{ Authorization = "Bearer $citizenToken" }
        $adminRes = Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method Get -Headers $headers
        Record-Test "Citizen Admin API Access" "HTTP 403 Forbidden" "Unexpected HTTP 200 OK" $false
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $is403 = ($statusCode -eq 403)
        Record-Test "Citizen Admin API Access" "HTTP 403 Forbidden" "HTTP $statusCode" $is403
    }
}

# -------------------------------------------------------------------------------------------------
# 5. SuperAdmin Public Registration Rejection Test
# -------------------------------------------------------------------------------------------------
$badSuperReg = @{
    firstName = "Hacker"
    lastName = "Admin"
    username = "fake.superadmin.$uniqueId"
    email = "fake.superadmin.$uniqueId@hack.com"
    role = "SuperAdmin"
    password = "MaliciousPassword@123"
} | ConvertTo-Json

try {
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $badSuperReg -ContentType "application/json"
    Record-Test "Register SuperAdmin (Public)" "Rejected (HTTP 400)" "Unexpected Success" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $is400 = ($statusCode -eq 400)
    Record-Test "Register SuperAdmin (Public)" "Rejected (HTTP 400)" "HTTP $statusCode (Rejected)" $is400
}

# -------------------------------------------------------------------------------------------------
# 6. SuperAdmin Seeded Login & Admin API Call
# -------------------------------------------------------------------------------------------------
$superLoginBody = @{
    username = "super.admin"
    password = "Admin@123"
} | ConvertTo-Json

$superToken = ""
try {
    $superRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $superLoginBody -ContentType "application/json"
    $superToken = $superRes.data.accessToken
    $superRole = $superRes.data.user.role
    $superPassed = ($superRes.success -eq $true -and $superRole -eq "SuperAdmin")
    Record-Test "SuperAdmin Login" "JWT + SuperAdmin role" "Role: $superRole" $superPassed
} catch {
    Record-Test "SuperAdmin Login" "JWT + SuperAdmin role" "Failed: $_" $false
}

if ($superToken) {
    try {
        $headers = @{ Authorization = "Bearer $superToken" }
        $usersRes = Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method Get -Headers $headers
        $usersPassed = ($usersRes.success -eq $true)
        Record-Test "SuperAdmin Admin API" "HTTP 200 OK" "HTTP 200 OK (Users: $($usersRes.data.Count))" $usersPassed
    } catch {
        Record-Test "SuperAdmin Admin API" "HTTP 200 OK" "Failed: $_" $false
    }
}

# -------------------------------------------------------------------------------------------------
# 7. Project Agency Registration & Login Flow
# -------------------------------------------------------------------------------------------------
$agencyUser = "test.agency.$uniqueId"
$agencyPass = "AgencyPass@123"
$agencyRegBody = @{
    firstName = "NHAI"
    lastName = "Officer"
    username = $agencyUser
    email = "$agencyUser@nhai.gov.in"
    phone = "+91 9876500002"
    role = "ProjectAgency"
    password = $agencyPass
} | ConvertTo-Json

try {
    $agencyRegRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $agencyRegBody -ContentType "application/json"
    $agencyLoginBody = @{ username = $agencyUser; password = $agencyPass } | ConvertTo-Json
    $agencyLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $agencyLoginBody -ContentType "application/json"
    $agencyRole = $agencyLoginRes.data.user.role
    Record-Test "Project Agency Flow" "Registered + Login (ProjectAgency)" "Role: $agencyRole" ($agencyRole -eq "ProjectAgency")
} catch {
    Record-Test "Project Agency Flow" "Registered + Login (ProjectAgency)" "Failed: $_" $false
}

# -------------------------------------------------------------------------------------------------
# 8. Negative Tests
# -------------------------------------------------------------------------------------------------
# Wrong password
try {
    $wrongPassBody = @{ username = "super.admin"; password = "WrongPassword@999" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $wrongPassBody -ContentType "application/json"
    Record-Test "Wrong Password" "HTTP 400 / 401 Rejected" "Unexpected 200 OK" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Record-Test "Wrong Password" "HTTP 400 / 401 Rejected" "HTTP $statusCode (Rejected)" ($statusCode -eq 400 -or $statusCode -eq 401)
}

# Missing credentials
try {
    $emptyBody = @{ username = ""; password = "" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $emptyBody -ContentType "application/json"
    Record-Test "Missing Credentials" "Validation Error (HTTP 400)" "Unexpected 200 OK" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Record-Test "Missing Credentials" "Validation Error (HTTP 400)" "HTTP $statusCode (Rejected)" ($statusCode -eq 400)
}

# Duplicate user
try {
    $dupBody = @{
        username = $citizenUser
        email = "$citizenUser@example.gov.in"
        role = "Citizen"
        password = "SomePassword@123"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $dupBody -ContentType "application/json"
    Record-Test "Duplicate User Registration" "Rejected (HTTP 400)" "Unexpected 200 OK" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Record-Test "Duplicate User Registration" "Rejected (HTTP 400)" "HTTP $statusCode (Rejected)" ($statusCode -eq 400)
}

# Missing JWT
try {
    $res = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Get
    Record-Test "Missing JWT on Protected API" "HTTP 401 Unauthorized" "Unexpected 200 OK" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Record-Test "Missing JWT on Protected API" "HTTP 401 Unauthorized" "HTTP $statusCode" ($statusCode -eq 401)
}

# Invalid JWT
try {
    $badHeaders = @{ Authorization = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature" }
    $res = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Get -Headers $badHeaders
    Record-Test "Invalid JWT" "HTTP 401 Unauthorized" "Unexpected 200 OK" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Record-Test "Invalid JWT" "HTTP 401 Unauthorized" "HTTP $statusCode" ($statusCode -eq 401)
}

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "                    TEST MATRIX RESULTS                          " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
$script:testResults | Format-Table -AutoSize
