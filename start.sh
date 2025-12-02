#!/bin/bash
echo "Запуск приложения 'Мои рецепты'..."
echo ""

cd backend || exit 1


(sleep 1 && open "http://127.0.0.1:5001/") &


python3 app.py
