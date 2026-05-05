@echo off
echo ========================================
echo   GitHubへのアップロードを開始します...
echo ========================================
cd /d "c:\Users\hy052\Desktop\Antigravity\badgekanri.app"
git push -u origin main
if %errorlevel% neq 0 (
    echo.
    echo [!] エラーが発生しました。GitHubのログインが必要かもしれません。
) else (
    echo.
    echo [OK] アップロードが完了しました！
    echo Vercelの画面に戻って、Importボタンを探してください。
)
echo.
pause
