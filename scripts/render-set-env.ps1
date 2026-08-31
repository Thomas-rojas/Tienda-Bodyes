$ErrorActionPreference = 'Stop'
$apiKey = $env:RENDER_API_KEY
if (-not $apiKey) { throw 'Set RENDER_API_KEY' }
$serviceId = 'srv-daaf48tg1s2s73d0epbg'
$backendUrl = 'https://clio-bodyes-api.onrender.com'
$envFile = Join-Path $PSScriptRoot '..\BACKEND_BODYES\.env'

function Read-DotEnv([string]$path) {
  $map = @{}
  Get-Content $path | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
    $parts = $_ -split '=', 2
    $map[$parts[0].Trim()] = $parts[1].Trim()
  }
  return $map
}

$be = Read-DotEnv $envFile
$vars = [ordered]@{
  NODE_ENV = 'production'
  FRONTEND_URL = 'https://tiendaclio.netlify.app'
  BACKEND_URL = $backendUrl
  SUPABASE_URL = $be['SUPABASE_URL']
  SUPABASE_SECRET_KEY = $be['SUPABASE_SECRET_KEY']
  SUPABASE_ANON_KEY = $be['SUPABASE_ANON_KEY']
  MERCADOPAGO_ENV = $be['MERCADOPAGO_ENV']
  MERCADOPAGO_ACCESS_TOKEN = $be['MERCADOPAGO_ACCESS_TOKEN']
  MERCADOPAGO_PUBLIC_KEY = $be['MERCADOPAGO_PUBLIC_KEY']
  JWT_SECRET = 'clio-prod-jwt-' + [guid]::NewGuid().ToString('N')
  JWT_EXPIRES_IN = '7d'
  ADMIN_EMAIL = $be['ADMIN_EMAIL']
  ADMIN_PASSWORD = $be['ADMIN_PASSWORD']
  ADMIN_DOCUMENT_NUMBER = '1000000001'
  STORE_EMAIL = $be['STORE_EMAIL']
  STORE_WHATSAPP = $be['STORE_WHATSAPP']
  SMTP_HOST = $be['SMTP_HOST']
  SMTP_PORT = $be['SMTP_PORT']
  SMTP_USER = $be['SMTP_USER']
  SMTP_PASS = $be['SMTP_PASS']
  EMAIL_FROM = $be['EMAIL_FROM']
}

$tmp = Join-Path $env:TEMP 'render-env-body.json'
foreach ($entry in $vars.GetEnumerator()) {
  if (-not $entry.Value) { continue }
  $json = (@{ value = $entry.Value } | ConvertTo-Json -Compress)
  [System.IO.File]::WriteAllText($tmp, $json)
  $key = [uri]::EscapeDataString($entry.Key)
  $result = curl.exe -s -w "`nHTTP:%{http_code}" -X PUT "https://api.render.com/v1/services/$serviceId/env-vars/$key" -H "Authorization: Bearer $apiKey" -H "Content-Type: application/json" --data-binary "@$tmp"
  Write-Host "$($entry.Key): $result"
}

curl.exe -s -X POST "https://api.render.com/v1/services/$serviceId/deploys" -H "Authorization: Bearer $apiKey" -H "Content-Type: application/json" --data-binary "@$(Join-Path $PSScriptRoot 'render-deploy.json')"
