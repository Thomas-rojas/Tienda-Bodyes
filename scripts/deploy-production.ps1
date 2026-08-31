#!/usr/bin/env pwsh
# Despliegue producción CLIO — ejecutar desde la raíz del repo
# Requiere: Netlify CLI autenticado (`npx netlify-cli login`)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$backendEnv = Join-Path $root 'BACKEND_BODYES\.env'
$frontendEnv = Join-Path $root 'FRONDEND_BODYES\.env'

if (-not (Test-Path $backendEnv)) {
  Write-Error "Falta BACKEND_BODYES/.env — copia desde .env.example y completa valores."
}

function Read-DotEnv([string]$path) {
  $map = @{}
  Get-Content $path | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
    $parts = $_ -split '=', 2
    $map[$parts[0].Trim()] = $parts[1].Trim()
  }
  return $map
}

$be = Read-DotEnv $backendEnv
$apiUrl = if ($be['BACKEND_URL'] -and $be['BACKEND_URL'] -notmatch 'localhost') {
  $be['BACKEND_URL']
} else {
  'https://clio-bodyes-api.onrender.com'
}

Write-Host "Configurando Netlify (tiendaclio)..."
npx --yes netlify-cli env:set VITE_API_URL $apiUrl --context production --force
npx --yes netlify-cli env:set VITE_SUPABASE_URL $be['SUPABASE_URL'] --context production --force
npx --yes netlify-cli env:set VITE_SUPABASE_ANON_KEY $be['SUPABASE_ANON_KEY'] --context production --force

Write-Host "Desplegando frontend en Netlify..."
npx --yes netlify-cli deploy --prod --build --message "Deploy CLIO production"

Write-Host ""
Write-Host "Frontend: https://tiendaclio.netlify.app"
Write-Host "Backend esperado: $apiUrl"
Write-Host ""
Write-Host "Si el backend aún no existe en Render:"
Write-Host "  1. https://dashboard.render.com/blueprint/new?repo=https://github.com/Thomas-rojas/Tienda-Bodyes"
Write-Host "  2. Completa las variables marcadas sync:false con valores de BACKEND_BODYES/.env"
Write-Host "  3. BACKEND_URL debe ser la URL final de Render (ej. $apiUrl)"
