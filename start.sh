#!/bin/bash
echo "Запуск приложения 'Мои рецепты'..."
echo ""
cd backend
xdg-open http://localhost:5000 2>/dev/null || open http://localhost:5000 2>/dev/null || start http://localhost:5000 2>/dev/null
python3 app.py


