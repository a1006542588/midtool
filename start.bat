@echo off
chcp 65001
cd /d "%~dp0"
set APP_MODE=standalone
set PORT=3000
echo Starting Discord Login Tool (Local Mode)...
start http://localhost:3000
node server.js
pause