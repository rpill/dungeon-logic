$ErrorActionPreference = 'Stop'

$ProjectRoot = (Resolve-Path -LiteralPath $PSScriptRoot).Path
$PatchFile = Join-Path $ProjectRoot 'prerelease-profile-squash.patch'
$PackageJson = Join-Path $ProjectRoot 'package.json'

if (-not (Test-Path -LiteralPath $PackageJson -PathType Leaf)) {
  throw "Project root not found: $ProjectRoot"
}

if (-not (Test-Path -LiteralPath $PatchFile -PathType Leaf)) {
  throw "Patch file not found: $PatchFile"
}

Write-Host "Project root: $ProjectRoot"
Write-Host 'Checking patch...'
& git -C $ProjectRoot apply --check --whitespace=nowarn $PatchFile
if ($LASTEXITCODE -ne 0) {
  throw "git apply --check failed with exit code $LASTEXITCODE"
}

Write-Host 'Applying pre-release profile squash...'
& git -C $ProjectRoot apply --whitespace=nowarn $PatchFile
if ($LASTEXITCODE -ne 0) {
  throw "git apply failed with exit code $LASTEXITCODE"
}

Write-Host 'Patch applied successfully.'
