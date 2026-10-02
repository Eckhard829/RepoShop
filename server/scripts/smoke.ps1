# RepoShop API smoke test — proves the auth posture is correct.
# Run from: C:\Users\User\Desktop\RepoShop\server
# Usage:    powershell -ExecutionPolicy Bypass -File .\scripts\smoke.ps1

$ErrorActionPreference = "Stop"
$base    = "http://localhost:3000"
$jar     = Join-Path $env:TEMP "reposhop_smoke_cookies.txt"
$email   = "smoke_$(Get-Random)@example.com"
$pass    = "smoketest12345"

Remove-Item $jar -ErrorAction SilentlyContinue

function Hit($name, $method, $url, $body, $expected) {
  $args = @("-s", "-o", "NUL", "-w", "%{http_code}", "-X", $method, "-c", $jar, "-b", $jar)
  if ($body) {
    $args += @("-H", "Content-Type: application/json", "-d", $body)
  }
  $code = & curl.exe @args $url
  $ok   = if ($code -eq $expected) { "PASS" } else { "FAIL" }
  "{0,-6} {1,-5} {2,-40} expected={3} got={4}" -f $ok, $method, $name, $expected, $code
}

"--- ANONYMOUS ---"
Hit "GET  /api/session"          GET  "$base/api/session"          $null 401
Hit "GET  /api/me"               GET  "$base/api/me"               $null 401
Hit "POST /api/me/checkout"      POST "$base/api/me/checkout"      "{}"  401
Hit "GET  /api/admin/clients"    GET  "$base/api/admin/clients"    $null 401
Hit "GET  /download/abc"         GET  "$base/download/abc"         $null 401
Hit "GET  /api/does-not-exist"   GET  "$base/api/does-not-exist"   $null 404
Hit "POST /api/webhook (no sig)" POST "$base/api/webhook"          "{}"  400

"--- REGISTER (public) ---"
Hit "POST /api/register"         POST "$base/api/register"         (@{email=$email;password=$pass} | ConvertTo-Json -Compress) 200

"--- AUTHENTICATED (as new user) ---"
Hit "GET  /api/session"          GET  "$base/api/session"          $null 200
Hit "GET  /api/me"               GET  "$base/api/me"               $null 200
Hit "GET  /api/admin/clients"    GET  "$base/api/admin/clients"    $null 403   # logged in but not admin

"--- LOGOUT ---"
Hit "POST /api/logout"           POST "$base/api/logout"           "{}"  200
Hit "GET  /api/session"          GET  "$base/api/session"          $null 401   # cookie cleared

"--- LOGIN with correct creds ---"
Hit "POST /api/login"            POST "$base/api/login"            (@{email=$email;password=$pass} | ConvertTo-Json -Compress) 200
Hit "GET  /api/session"          GET  "$base/api/session"          $null 200

"--- LOGIN with wrong creds ---"
Remove-Item $jar -ErrorAction SilentlyContinue
Hit "POST /api/login (bad pass)" POST "$base/api/login"            (@{email=$email;password="wrongwrongwrong"} | ConvertTo-Json -Compress) 401

Remove-Item $jar -ErrorAction SilentlyContinue