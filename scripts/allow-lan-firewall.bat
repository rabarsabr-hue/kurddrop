@echo off
:: Kurd Drop ? allow phone access via IP (needs Admin once)
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"G:\My Drive\Kurd Drop\scripts\allow-lan-firewall.ps1\"'"
