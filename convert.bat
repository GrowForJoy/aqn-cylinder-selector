@echo off
chcp 65001 >nul
set "PY=C:\Users\DELL\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\vm\tools\python\python.exe"
set "SCRIPT=D:\LibertaFolder\Program\aqn-cylinder-selector\step2glb.py"

if not exist "%PY%" (
  echo [错误] 找不到转换用的 Python 解释器：
  echo   %PY%
  echo.
  echo 可能 TRAE 更新导致路径变化，请在 convert.bat 里把 PY 改成新的 python.exe 路径。
  echo.
  pause
  exit /b 1
)

if "%~1"=="" (
  echo 正在转换 3D 文件夹里的所有 .stp / .step 文件...
  echo.
  "%PY%" "%SCRIPT%"
) else (
  echo 正在转换: %~1
  echo.
  "%PY%" "%SCRIPT%" "%~1" "%~dpn1.glb"
)

echo.
echo ============================
echo 转换结束，按任意键关闭
pause >nul