@echo off
chcp 65001
echo 正在检查环境...

:: 检查 Node.js 是否已安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：未检测到 Node.js
    echo 请先安装 Node.js
    pause
    exit /b 1
)

echo 环境检查完成！
echo 现在您可以双击 run.bat 运行程序了
pause 