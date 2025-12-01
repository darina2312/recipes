// храним все рецепты и ингредиенты
let allRecipes = [];
let allIngredients = [];
let filteredIngredients = [];

// загружает все рецепты при открытии страницы
async function loadAllRecipes() {
    const res = await fetch('/api/recipes');
    allRecipes = await res.json();
    extractIngredients();
    renderIngredients();
}

// собирает все уникальные ингредиенты из всех рецептов
function extractIngredients() {
    const ingredientsSet = new Set();
    
    for (const recipe of allRecipes) {
        if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
            for (const ing of recipe.ingredients) {
                if (ing.name && ing.name.trim()) {
                    // приводим к нижнему регистру чтобы не было дублей
                    const normalized = ing.name.trim().toLowerCase();
                    ingredientsSet.add(normalized);
                }
            }
        }
    }
    
    allIngredients = Array.from(ingredientsSet).sort();
    filteredIngredients = [...allIngredients];
}

function renderIngredients() {
    const container = document.getElementById('ingredientsList');
    
    if (filteredIngredients.length === 0) {
        container.innerHTML = '<p>Нет доступных ингредиентов</p>';
        return;
    }
    
    container.innerHTML = '';
    
    for (const ing of filteredIngredients) {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'ingredient-checkbox';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `ing-${ing}`;
        checkbox.value = ing;
        
        const label = document.createElement('label');
        label.htmlFor = `ing-${ing}`;
        label.textContent = ing;
        
        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(label);
        container.appendChild(checkboxDiv);
    }
}

function getSelectedIngredients() {
    const checkboxes = document.querySelectorAll('#ingredientsList input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value.toLowerCase());
}

// ищет рецепты, которые можно приготовить из выбранных ингредиентов
function findRecipes() {
    const selected = getSelectedIngredients();
    
    if (selected.length === 0) {
        alert('Выберите хотя бы один ингредиент');
        return;
    }
    
    const matchingRecipes = [];
    
    // проверяем каждый рецепт
    for (const recipe of allRecipes) {
        if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
            continue;
        }
        
        const recipeIngredients = recipe.ingredients
            .map(ing => ing.name ? ing.name.trim().toLowerCase() : '')
            .filter(ing => ing);
        
        // рецепт подходит если все его ингредиенты есть в выбранных
        const hasAllIngredients = recipeIngredients.every(ing => selected.includes(ing));
        
        if (hasAllIngredients && recipeIngredients.length > 0) {
            matchingRecipes.push({
                recipe: recipe,
                ingredientCount: recipeIngredients.length
            });
        }
    }
    
    // сортируем по количеству ингредиентов (сначала простые)
    matchingRecipes.sort((a, b) => a.ingredientCount - b.ingredientCount);
    
    displayResults(matchingRecipes);
}

function displayResults(matchingRecipes) {
    const resultsContainer = document.getElementById('results');
    const resultsHeader = document.getElementById('resultsHeader');
    
    if (matchingRecipes.length === 0) {
        resultsHeader.style.display = 'none';
        resultsContainer.innerHTML = '<div class="no-results"><p>Не найдено рецептов, которые можно приготовить из выбранных ингредиентов.</p><p>Попробуйте выбрать больше ингредиентов.</p></div>';
        return;
    }
    
    resultsHeader.style.display = 'block';
    resultsHeader.textContent = `Найдено рецептов: ${matchingRecipes.length}`;
    
    resultsContainer.innerHTML = '';
    resultsContainer.className = 'recipes-grid';
    
    for (const { recipe } of matchingRecipes) {
        const card = document.createElement('a');
        card.className = 'card card-link';
        card.href = `recipe.html?id=${recipe.id}`;
        card.innerHTML = `
            <h3>${recipe.title}</h3>
            <p>${recipe.description || ''}</p>
            <small>${recipe.created_at || ''}</small>
        `;
        resultsContainer.appendChild(card);
    }
}

// Поиск по ингредиентам
document.getElementById('ingredientSearch').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    if (!query) {
        filteredIngredients = [...allIngredients];
    } else {
        filteredIngredients = allIngredients.filter(ing => ing.includes(query));
    }
    
    renderIngredients();
});

// Кнопки управления
document.getElementById('selectAllBtn').onclick = () => {
    document.querySelectorAll('#ingredientsList input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
    });
};

document.getElementById('deselectAllBtn').onclick = () => {
    document.querySelectorAll('#ingredientsList input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
};

document.getElementById('findBtn').onclick = findRecipes;

// Загружаем данные при загрузке страницы
loadAllRecipes();

