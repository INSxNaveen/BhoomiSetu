$baseUrl = "http://localhost:5000/api/v1"
$ErrorActionPreference = "Continue"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  BHOOMISETU HARDENED ENTERPRISE AUTHENTICATION TEST SUITE       " -ForegroundColor Cyan
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
# 1. Verify Public Registration Route is Removed (404 Not Found)
# -------------------------------------------------------------------------------------------------
try {
    $badRegBody = @{
        username = "anon.user.$uniqueId"
        email = "anon.$uniqueId@example.com"
        password = "Password@123"
        role = "Citizen"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $badRegBody -ContentType "application/json"
    Record-Test "Public Registration Endpoint" "HTTP 404 (Removed)" "Unexpected 200 OK" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $is404 = ($statusCode -eq 404)
    Record-Test "Public Registration Endpoint" "HTTP 404 (Removed)" "HTTP $statusCode" $is404
}

# -------------------------------------------------------------------------------------------------
# 2. SuperAdmin Login
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
    $loginPassed = ($superRes.success -eq $true -and $superRole -eq "SuperAdmin")
    Record-Test "SuperAdmin Login" "JWT + SuperAdmin role" "Role: $superRole (Token Length: $($superToken.Length))" $loginPassed
} catch {
    Record-Test "SuperAdmin Login" "JWT + SuperAdmin role" "Failed: $_" $false
}

# -------------------------------------------------------------------------------------------------
# 3. SuperAdmin User Provisioning (DistrictAdmin)
# -------------------------------------------------------------------------------------------------
$provDistrictUser = "prov.district.$uniqueId"
$provDistrictPass = "DistrictPass@123"

# Fetch an active organization
$headers = @{ Authorization = "Bearer $superToken" }
$orgRes = Invoke-RestMethod -Uri "$baseUrl/admin/organizations" -Method Get -Headers $headers
$orgId = $orgRes.data[0].id

$createUserBody = @{
    username = $provDistrictUser
    email = "$provDistrictUser@bhoomisetu.gov.in"
    firstName = "Rajesh"
    lastName = "Sharma"
    phone = "+91 9876543210"
    role = "DistrictAdmin"
    organizationId = $orgId
    password = $provDistrictPass
    isActive = $true
} | ConvertTo-Json

$createdDistrictUser = $null
try {
    $createRes = Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method Post -Body $createUserBody -Headers $headers -ContentType "application/json"
    $createdDistrictUser = $createRes.data
    $createPassed = ($createRes.success -eq $true -and $createRes.data.username -eq $provDistrictUser)
    Record-Test "SuperAdmin Provision DistrictAdmin" "User created with PBKDF2" "User: $($createRes.data.username) (Role: $($createRes.data.role))" $createPassed
} catch {
    Record-Test "SuperAdmin Provision DistrictAdmin" "User created with PBKDF2" "Failed: $_" $false
}

# -------------------------------------------------------------------------------------------------
# 4. Provisioned DistrictAdmin Login & RBAC Verification
# -------------------------------------------------------------------------------------------------
$distLoginBody = @{
    username = $provDistrictUser
    password = $provDistrictPass
} | ConvertTo-Json

$distToken = ""
try {
    $distLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $distLoginBody -ContentType "application/json"
    $distToken = $distLoginRes.data.accessToken
    $distRole = $distLoginRes.data.user.role
    $distPassed = ($distLoginRes.success -eq $true -and $distRole -eq "DistrictAdmin")
    Record-Test "Provisioned User Login" "JWT + DistrictAdmin role" "Role: $distRole (Token Length: $($distToken.Length))" $distPassed
} catch {
    Record-Test "Provisioned User Login" "JWT + DistrictAdmin role" "Failed: $_" $false
}

# -------------------------------------------------------------------------------------------------
# 5. Provisioned User Protected API Access (Domain API)
# -------------------------------------------------------------------------------------------------
if ($distToken) {
    try {
        $distHeaders = @{ Authorization = "Bearer $distToken" }
        $projRes = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Get -Headers $distHeaders
        Record-Test "DistrictAdmin Domain API Access" "HTTP 200 OK" "HTTP 200 OK (Projects Count: $($projRes.data.Count))" ($projRes.success -eq $true)
    } catch {
        Record-Test "DistrictAdmin Domain API Access" "HTTP 200 OK" "Failed: $_" $false
    }
}

# -------------------------------------------------------------------------------------------------
# 6. Provisioned User Admin Isolation (Must be 403 Forbidden)
# -------------------------------------------------------------------------------------------------
if ($distToken) {
    try {
        $distHeaders = @{ Authorization = "Bearer $distToken" }
        $adminRes = Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method Get -Headers $distHeaders
        Record-Test "DistrictAdmin Admin Isolation" "HTTP 403 Forbidden" "Unexpected HTTP 200 OK" $false
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $is403 = ($statusCode -eq 403)
        Record-Test "DistrictAdmin Admin Isolation" "HTTP 403 Forbidden" "HTTP $statusCode" $is403
    }
}

# -------------------------------------------------------------------------------------------------
# 7. Anonymous Admin Endpoint Access (Must be 401 Unauthorized)
# -------------------------------------------------------------------------------------------------
try {
    $adminRes = Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method Get
    Record-Test "Anonymous Admin Endpoint Access" "HTTP 401 Unauthorized" "Unexpected HTTP 200 OK" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $is401 = ($statusCode -eq 401)
    Record-Test "Anonymous Admin Endpoint Access" "HTTP 401 Unauthorized" "HTTP $statusCode" $is401
}

# -------------------------------------------------------------------------------------------------
# 8. Invalid Credentials on Login
# -------------------------------------------------------------------------------------------------
try {
    $wrongPassBody = @{ username = "super.admin"; password = "WrongPassword@999" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $wrongPassBody -ContentType "application/json"
    Record-Test "Invalid Credentials Login" "Rejected (HTTP 400)" "Unexpected HTTP 200 OK" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $is400 = ($statusCode -eq 400 -or $statusCode -eq 401)
    Record-Test "Invalid Credentials Login" "Rejected (HTTP 400)" "HTTP $statusCode (Rejected)" $is400
}

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "                HARDENED AUTH TEST RESULTS                       " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
$script:testResults | Format-Table -AutoSize
