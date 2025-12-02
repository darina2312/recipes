from flask import Flask, request, send_from_directory, jsonify
import json, os, threading, time
from werkzeug.utils import secure_filename

# настройка Flask и пути к файлу с данными
app = Flask(__name__, static_folder="../frontend", static_url_path="/")
DATA_FILE = os.path.join(os.path.dirname(__file__), "../data/recipes.json")
IMAGES_FOLDER = os.path.join(os.path.dirname(__file__), "../frontend/images")
_lock = threading.Lock()  # для безопасности при записи в файл

# создаём папку для изображений если её нет
os.makedirs(IMAGES_FOLDER, exist_ok=True)

def load_data():
    # если файла нет, создаём пустой
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump({"recipes": []}, f, ensure_ascii=False, indent=2)
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/find.html")
def find():
    return send_from_directory(app.static_folder, "find.html")

@app.route("/api/recipes", methods=["GET"])
def get_recipes():
    """Возвращает все рецепты или ищет по запросу"""
    data = load_data()
    q = request.args.get("q", "").lower()
    # если есть поисковый запрос, фильтруем
    if q:
        filtered = [r for r in data["recipes"]
                    if q in r["title"].lower() or q in r["description"].lower()]
    else:
        filtered = data["recipes"]
    return jsonify(filtered)

@app.route("/api/recipes", methods=["POST"])
def add_recipe():
    """Добавление нового рецепта"""
    # получаем данные формы
    title = request.form.get("title", "").strip()
    if not title:
        return jsonify({"error": "Нет названия"}), 400
    
    # обрабатываем изображение если есть
    image_path = None
    if "image" in request.files:
        file = request.files["image"]
        if file.filename:
            # сохраняем файл с безопасным именем
            filename = secure_filename(file.filename)
            # добавляем timestamp чтобы избежать конфликтов
            timestamp = int(time.time() * 1000)
            name, ext = os.path.splitext(filename)
            filename = f"{name}_{timestamp}{ext}"
            filepath = os.path.join(IMAGES_FOLDER, filename)
            file.save(filepath)
            image_path = f"images/{filename}"
    
    # собираем данные рецепта
    new = {
        "title": title,
        "description": request.form.get("description", "").strip(),
        "steps": request.form.get("steps", "").strip(),
        "tags": [t.strip() for t in request.form.get("tags", "").split(",") if t.strip()],
        "portions": int(request.form.get("portions", 1)) if request.form.get("portions") else 1
    }
    
    # обрабатываем ингредиенты из JSON строки
    try:
        ingredients_json = request.form.get("ingredients", "[]")
        new["ingredients"] = json.loads(ingredients_json)
    except:
        new["ingredients"] = []
    
    # добавляем путь к изображению если есть
    if image_path:
        new["image"] = image_path

    # используем lock чтобы не было конфликтов при записи
    with _lock:
        data = load_data()
        new["id"] = int(time.time() * 1000)  # id из текущего времени
        new["created_at"] = time.ctime()
        data["recipes"].append(new)
        save_data(data)

    return jsonify({"status": "ok", "id": new["id"]})

@app.route("/api/recipes/<int:rid>", methods=["GET"])
def get_recipe(rid):
    data = load_data()
    for r in data["recipes"]:
        if r["id"] == rid:
            return jsonify(r)
    return jsonify({"error": "Не найден"}), 404

@app.route("/api/recipes/<int:rid>", methods=["DELETE"])
def delete_recipe(rid):
    """Удаление рецепта"""
    with _lock:
        data = load_data()
        recipe_to_delete = None
        
        # ищем рецепт
        for i, r in enumerate(data["recipes"]):
            if r["id"] == rid:
                recipe_to_delete = data["recipes"].pop(i)
                break
        
        if not recipe_to_delete:
            return jsonify({"error": "Не найден"}), 404
        
        # удаляем изображение если есть
        if recipe_to_delete.get("image"):
            image_path = os.path.join(os.path.dirname(__file__), "../frontend", recipe_to_delete["image"])
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except:
                    pass  # игнорируем ошибки удаления файла
        
        save_data(data)
        return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(debug=True, port=5001)
