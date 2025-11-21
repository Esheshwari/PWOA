# Start ngrok, wait until public URL available, then set OAUTH_REDIRECT_URI and start the app
# Usage: from repository root run: powershell -File scripts\start_ngrok_and_run.ps1

param(
    [int]$Port = 5000,
    [string]$VenvActivate = ".\.venv\Scripts\Activate.ps1"
)

function Start-Ngrok {
    ngrok http $Port -log=stdout | Out-Null &
}

Write-Host "Starting ngrok on port $Port..."
# Start ngrok in background
Start-Process ngrok -ArgumentList "http $Port --log=stdout" -WindowStyle Hidden

# Poll ngrok local API for tunnels
$api = 'http://127.0.0.1:4040/api/tunnels'
$publicUrl = $null
for($i=0;$i -lt 20;$i++){
    Start-Sleep -Seconds 1
    try{
        $json = Invoke-RestMethod -Uri $api -Method Get -ErrorAction Stop
        if($json.tunnels -and $json.tunnels.Count -gt 0){
            $publicUrl = $json.tunnels[0].public_url
            break
        }
    } catch { }
}

if(-not $publicUrl){
    Write-Error "Could not get ngrok public URL. Make sure ngrok is installed and reachable at http://127.0.0.1:4040"
    exit 1
}

Write-Host "ngrok public URL: $publicUrl"
$env:OAUTH_REDIRECT_URI = "$publicUrl/oauth2callback"
Write-Host "Set OAUTH_REDIRECT_URI=$env:OAUTH_REDIRECT_URI for this session"

# Activate venv and start app
if(Test-Path $VenvActivate){
    . $VenvActivate
}

Write-Host "Starting app.py with OAUTH_REDIRECT_URI set to $env:OAUTH_REDIRECT_URI"
python app.py
