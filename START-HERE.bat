@echo off
title Bashewam Payroll - Put site online
cd /d "%~dp0"
echo.
echo  Bashewam School Payroll - Online setup
echo  =====================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-and-deploy.ps1"
echo.
pause
