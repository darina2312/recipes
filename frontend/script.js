async function loadRecipes(query = "") {
    const res = await fetch(`/api/recipes?q=${encodeURIComponent(query)}`);
    const recipes = await res.json();
    const container = document.getElementById("recipes");
    container.innerHTML = "";
    if (!recipes.length) {
        container.innerHTML = "<p>Пока нет рецептов</p>";
        return;
    }
    for (const r of recipes) {
        const card = document.createElement("div");
        card.className = "card";
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

document.getElementById("addBtn").onclick = () =>
    document.getElementById("modal").classList.remove("hidden");

document.getElementById("cancelBtn").onclick = () =>
    document.getElementById("modal").classList.add("hidden");

document.getElementById("saveBtn").onclick = async () => {
    const newRecipe = {
        title: document.getElementById("titleInput").value.trim(),
        description: document.getElementById("descInput").value.trim(),
        ingredients: document.getElementById("ingredientsInput").value.split(",").map(s => s.trim()),
        steps: document.getElementById("stepsInput").value.trim(),
        tags: document.getElementById("tagsInput").value.split(",").map(s => s.trim())
    };

    const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecipe)
    });

    if (res.ok) {
        document.getElementById("modal").classList.add("hidden");
        loadRecipes();
    } else {
        alert("Ошибка при добавлении");
    }
};

loadRecipes();
