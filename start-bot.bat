@echo off
cls
echo [1/2] Registering slash commands...
call node deploy-commands.js

echo.
echo [2/2] Starting bot...
call node index.js

echo.
pause
