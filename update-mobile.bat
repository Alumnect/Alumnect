@echo off
title Alumnect Mobile Launcher
powershell -ExecutionPolicy Bypass -File "%~dp0update-mobile.ps1" %*
pause
