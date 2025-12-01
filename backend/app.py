from flask import Flask, request, send_from_directory, jsonify
import json, os, threading, time

app = Flask(__name__, static_folder="../frontend", static_url_path="/")
DATA_FILE = os.path.join(os.path.dirname(__file__), "../data/recipes.json")
_lock = threading.Lock()

def load_data():
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
    if q:
        filtered = [r for r in data["recipes"]
                    if q in r["title"].lower() or q in r["description"].lower()]
    else:
        filtered = data["recipes"]
    return jsonify(filtered)

@app.route("/api/recipes", methods=["POST"])
def add_recipe():
    """Добавление нового рецепта"""
    new = request.get_json()
    if not new or not new.get("title"):
        return jsonify({"error": "Нет названия"}), 400

    with _lock:
        data = load_data()
        new["id"] = int(time.time() * 1000)
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

if __name__ == "__main__":
    app.run(debug=True)
