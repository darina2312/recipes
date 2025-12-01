@echo off
echo Запуск приложения "Мои рецепты"...
echo.
cd backend
start http://localhost:5000
python app.py
pause

