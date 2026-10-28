<#
  Registers a Windows scheduled task that runs ONE agentops tick inside WSL every N minutes,
  hidden (no console window). WSL sleeps when idle, so Windows Task Scheduler is the reliable
  clock. No admin rights needed.

  Install:    powershell -ExecutionPolicy Bypass -File install-scheduler.ps1 -Distro Ubuntu
  Pause:      Disable-ScheduledTask -TaskName AgentOps-Clockvane
  Resume:     Enable-ScheduledTask  -TaskName AgentOps-Clockvane
  Remove:     powershell -ExecutionPolicy Bypass -File install-scheduler.ps1 -Uninstall
  Find your distro name with:  wsl -l -v
#>
param(
  [string]$Distro = "Ubuntu",
  [string]$AgentsDir = "~/agents/clockvane-website",
  [int]$EveryMinutes = 10,
  [switch]$Uninstall
)

$TaskName = "AgentOps-Clockvane"

if (-not $Uninstall) {
  # wsl -l -q prints UTF-16; drop the NULs. A wrong name makes every scheduled check fail silently.
  $names = @(wsl.exe -l -q | ForEach-Object { ($_ -replace "`0", "").Trim() } | Where-Object { $_ })
  if ($names -notcontains $Distro) {
    Write-Error "No WSL distribution named '$Distro'. Yours: $($names -join ', '). Run this from Ubuntu with -Distro `"`$WSL_DISTRO_NAME`"."
    exit 1
  }
}

if ($Uninstall) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Removed $TaskName"
  return
}

$dir = Join-Path $env:LOCALAPPDATA "AgentOps"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$vbs = Join-Path $dir "tick-clockvane.vbs"

$bash = "bash $AgentsDir/agentops/bin/tick.sh"
$vbsBody = @"
' Runs one agentops tick in WSL with no visible window.
Set sh = CreateObject("WScript.Shell")
sh.Run "wsl.exe -d $Distro -- bash -lc ""$bash""", 0, True
"@
Set-Content -Path $vbs -Value $vbsBody -Encoding ASCII

$action   = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "`"$vbs`""
$trigger  = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) `
              -RepetitionInterval (New-TimeSpan -Minutes $EveryMinutes) `
              -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries `
              -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew `
              -ExecutionTimeLimit (New-TimeSpan -Hours 1)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
  -Description "One agentops tick for the Clockvane website agent team every $EveryMinutes minutes" `
  -Force | Out-Null

Write-Host "Registered ${TaskName}: one tick every $EveryMinutes minutes (first in ~2 minutes)."
Write-Host "It does nothing until you run 'agents start' in Ubuntu."
Write-Host "Log inside WSL: ~/.claude/agentops/tick.log   Status: agents status"
