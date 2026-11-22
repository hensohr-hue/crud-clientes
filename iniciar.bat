@echo off
chcp 65001 >nul
title Cadastro de Clientes - Servidor
cd /d "%~dp0backend"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale a versao LTS em https://nodejs.org e execute novamente.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias, aguarde...
  call npm install --no-fund --no-audit
)

if not exist .env copy .env.example .env >nul

rem Le a porta definida no .env (padrao 3001)
set PORT=3001
for /f "usebackq tokens=1,* delims==" %%a in (".env") do if /i "%%a"=="PORT" set PORT=%%b

rem Verifica se outro programa ja esta usando a porta
netstat -ano | findstr /r /c:":%PORT% .*LISTENING" >nul
if not errorlevel 1 (
  echo.
  echo A porta %PORT% ja esta sendo usada por outro programa.
  echo O sistema nao pode iniciar enquanto ela estiver ocupada.
  echo.
  echo Solucoes:
  echo   1. Feche o outro programa que usa a porta %PORT% e execute este arquivo de novo.
  echo   2. Ou abra backend\.env e troque a linha PORT=%PORT% por outra porta, ex.: PORT=3001
  echo.
  pause
  exit /b 1
)

echo.
echo Abrindo o sistema em http://localhost:%PORT%
echo Para encerrar, feche esta janela ou pressione Ctrl+C.
echo.
start "" http://localhost:%PORT%
node src/server.js
pause
