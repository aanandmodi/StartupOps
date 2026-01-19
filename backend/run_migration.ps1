# PowerShell script to run the migration with Service Account
$ErrorActionPreference = "Stop"

# 1. Check for the key file
$KeyFile = "service-account.json"
if (-not (Test-Path $KeyFile)) {
    Write-Host "ERROR: Could not find '$KeyFile' in the current directory." -ForegroundColor Red
    Write-Host "Please download your Service Account Key from Firebase Console and save it as '$KeyFile' in this folder." -ForegroundColor Yellow
    exit 1
}

# 2. Set the environment variable for this session
$env:GOOGLE_APPLICATION_CREDENTIALS = Resolve-Path $KeyFile
Write-Host "Environment variable set: GOOGLE_APPLICATION_CREDENTIALS = $env:GOOGLE_APPLICATION_CREDENTIALS" -ForegroundColor Green

# 3. Determine Python path
if (Test-Path "venv\Scripts\python.exe") {
    $PythonCmd = "venv\Scripts\python.exe"
    Write-Host "Using virtual environment Python: $PythonCmd" -ForegroundColor Cyan
}
elseif (Get-Command "python" -ErrorAction SilentlyContinue) {
    $PythonCmd = "python"
    Write-Host "Using global Python" -ForegroundColor Cyan
}
else {
    Write-Host "ERROR: Could not find 'python' executable." -ForegroundColor Red
    exit 1
}

# 4. Run the Python migration script
Write-Host "Starting migration script..." -ForegroundColor Cyan
& $PythonCmd migrate_to_firestore.py

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migration completed successfully!" -ForegroundColor Green
}
else {
    Write-Host "Migration failed." -ForegroundColor Red
}
