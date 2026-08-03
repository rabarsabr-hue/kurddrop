# Kurd Drop — ڕێگەپێدانی Firewall + Private network بۆ کردنەوەی یاری بە IP لە مۆبایل
# Run as Administrator (UAC → Yes)

$ErrorActionPreference = 'Continue'
Write-Host "=== Kurd Drop LAN setup ===" -ForegroundColor Cyan

# 1) Wi-Fi → Private (Public blocks phone access)
try {
  $profiles = Get-NetConnectionProfile | Where-Object { $_.InterfaceAlias -match 'Wi-Fi|WLAN|Wireless' }
  foreach ($p in $profiles) {
    if ($p.NetworkCategory -ne 'Private') {
      Set-NetConnectionProfile -InterfaceIndex $p.InterfaceIndex -NetworkCategory Private
      Write-Host "OK: $($p.Name) → Private"
    } else {
      Write-Host "OK: $($p.Name) already Private"
    }
  }
} catch {
  Write-Host "WARN: could not set Private network: $($_.Exception.Message)" -ForegroundColor Yellow
  Write-Host "  Manual: Settings → Network → Wi-Fi → Your network → Private"
}

# 2) Firewall inbound allow for Vite ports
$ports = @(5173, 5174)
foreach ($port in $ports) {
  $name = "Kurd Drop Vite $port"
  netsh advfirewall firewall delete rule name="$name" 2>$null | Out-Null
  netsh advfirewall firewall add rule `
    name="$name" `
    dir=in `
    action=allow `
    protocol=TCP `
    localport=$port `
    profile=private,domain,public `
    enable=yes | Out-Null
  Write-Host "OK: firewall allow TCP $port"
}

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if ($node) {
  $n = 'Kurd Drop Node.js'
  netsh advfirewall firewall delete rule name="$n" 2>$null | Out-Null
  netsh advfirewall firewall add rule `
    name="$n" `
    dir=in `
    action=allow `
    program="$node" `
    enable=yes `
    profile=private,domain,public | Out-Null
  Write-Host "OK: firewall allow Node.js"
}

$ip = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' } |
  Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "Done. On phone (same Wi-Fi) open:" -ForegroundColor Green
if ($ip) {
  Write-Host "  http://${ip}:5174/" -ForegroundColor Green
} else {
  Write-Host "  http://<your-pc-ip>:5174/"
}
Write-Host ""
Write-Host "Press any key to close..."
try { $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown') } catch { Start-Sleep -Seconds 8 }
