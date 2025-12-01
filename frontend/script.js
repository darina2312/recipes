// загружает рецепты с сервера и показывает их на странице
async function loadRecipes(query = "") {
    const res = await fetch(`/api/recipes?q=${encodeURIComponent(query)}`);
    const recipes = await res.json();
    const container = document.getElementById("recipes");
    container.innerHTML = "";
    if (!recipes.length) {
        container.innerHTML = "<p>Пока нет рецептов</p>";
        return;
    }
    // создаём карточки для каждого рецепта
    for (const r of recipes) {
        const card = document.createElement("a");
        card.className = "card card-link";
        card.href = `recipe.html?id=${r.id}`;
        card.innerHTML = `
            <h3>${r.title}</h3>
            <p>${r.description || ""}</p>
            <small>${r.created_at}</small>
        `;
        container.appendChild(card);
    }
}

document.getElementById("searchBtn").onclick = () => {
    const q = document.getElementById("searchInput").value;
    loadRecipes(q);
};

// открывает случайный рецепт
document.getElementById("randomBtn").onclick = async () => {
    const res = await fetch('/api/recipes');
    const recipes = await res.json();
    if (recipes.length === 0) {
        alert('Нет рецептов для выбора');
        return;
    }
    // выбираем случайный рецепт
    const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
    window.location.href = `recipe.html?id=${randomRecipe.id}`;
};

// добавляет новую строку для ввода ингредиента
function addIngredientRow() {
    const list = document.getElementById("ingredientsList");
    const row = document.createElement("div");
    row.className = "ingredient-row";
    row.innerHTML = `
        <input type="text" placeholder="Название" class="ing-name">
        <input type="number" placeholder="Количество" class="ing-amount" step="0.1">
        <input type="text" placeholder="Единица (г, мл, шт...)" class="ing-unit">
        <button type="button" class="remove-ingredient" onclick="this.parentElement.remove()">×</button>
    `;
    list.appendChild(row);
}

// очищает форму добавления рецепта
function clearModal() {
    document.getElementById("titleInput").value = "";
    document.getElementById("descInput").value = "";
    document.getElementById("stepsInput").value = "";
    document.getElementById("tagsInput").value = "";
    const list = document.getElementById("ingredientsList");
    list.innerHTML = "";
    addIngredientRow(); // оставляем одну пустую строку
}

document.getElementById("addBtn").onclick = () => {
    clearModal();
    document.getElementById("modal").classList.remove("hidden");
};

document.getElementById("cancelBtn").onclick = () =>
    document.getElementById("modal").classList.add("hidden");

// сохраняет новый рецепт
document.getElementById("saveBtn").onclick = async () => {
    // собираем данные из формы
    const newRecipe = {
        title: document.getElementById("titleInput").value.trim(),
        description: document.getElementById("descInput").value.trim(),
        ingredients: Array.from(document.querySelectorAll('.ingredient-row')).map(row => ({
            name: row.querySelector('.ing-name').value.trim(),
            amount: parseFloat(row.querySelector('.ing-amount').value) || 0,
            unit: row.querySelector('.ing-unit').value.trim()
        })),
        steps: document.getElementById("stepsInput").value.trim(),
        tags: document.getElementById("tagsInput").value.split(",").map(s => s.trim())
    };

    // отправляем на сервер
    const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecipe)
    });

    if (res.ok) {
        document.getElementById("modal").classList.add("hidden");
        clearModal();
        loadRecipes(); // обновляем список
    } else {
        alert("Ошибка при добавлении");
    }
};

loadRecipes();
