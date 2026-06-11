param(
  [string]$ComposeFile = "docker/docker-compose.yml",
  [string]$RepoName = ""
)

$ErrorActionPreference = "Stop"

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Name"
  }
}

function Wait-HttpOk {
  param(
    [string]$Url,
    [int]$Attempts = 60,
    [int]$DelaySeconds = 2
  )

  for ($i = 0; $i -lt $Attempts; $i++) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
        return
      }
    } catch {
      Start-Sleep -Seconds $DelaySeconds
    }
  }

  throw "Timed out waiting for $Url"
}

Require-Command docker

docker compose -f $ComposeFile up --build -d

Wait-HttpOk -Url "http://localhost:5000/health"
Wait-HttpOk -Url "http://localhost:5000/api-docs"
Wait-HttpOk -Url "http://localhost:5173"

Push-Location backend
npm run smoke
Pop-Location

Push-Location frontend
npm install
npx playwright install
npm run e2e
Pop-Location

if ($RepoName) {
  $ghPath = "C:\Program Files\GitHub CLI\gh.exe"
  if (-not (Test-Path $ghPath)) {
    throw "GitHub CLI not found at $ghPath"
  }

  & $ghPath auth status | Out-Null
  & $ghPath repo create $RepoName --source . --private --push
}

Write-Host "Phase 1 verification completed successfully."
