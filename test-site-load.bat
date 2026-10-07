@echo off
setlocal
cd /d "%~dp0"
title Website Load and Stress Test
node scripts\load-test.js
pause
