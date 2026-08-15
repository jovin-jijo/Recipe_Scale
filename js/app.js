const defaultRecipe = {
    name: "Chocolate Chip Cookies",
    servings: 4,
    ingredients: [
        { name: "Flour", amount: 2, unit: "cups", type: "linear" },
        { name: "Sugar", amount: 1, unit: "cup", type: "linear" },
        { name: "Salt", amount: 0.5, unit: "tsp", type: "nonlinear" },
        { name: "Baking Powder", amount: 1, unit: "tsp", type: "nonlinear" }
    ]
};

const units = {
    teaspoon: { type: "volume", value: 1 },
    tablespoon: { type: "volume", value: 3 },
    cup: { type: "volume", value: 48 },
    milliliter: { type: "volume", value: 0.202884 },
    liter: { type: "volume", value: 202.884 },
    gram: { type: "weight", value: 1 },
    kilogram: { type: "weight", value: 1000 },
    ounce: { type: "weight", value: 28.3495 },
    pound: { type: "weight", value: 453.592 }
};

function formatNumber(value) {
    if (Number.isInteger(value)) return value;
    return Number(value.toFixed(2));
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function scaleIngredient(ingredient, oldServings, newServings) {
    const ratio = newServings / oldServings;
    let amount = ingredient.amount * ratio;

    if (ingredient.type === "nonlinear") {
        const lowerName = ingredient.name.toLowerCase();
        if (lowerName.includes("salt") || lowerName.includes("spice")) {
            amount = ingredient.amount * (0.7 + ratio * 0.3);
        } else if (lowerName.includes("yeast") || lowerName.includes("baking")) {
            amount = ingredient.amount * (0.8 + ratio * 0.2);
        }
    }

    return {
        ...ingredient,
        amount: formatNumber(amount)
    };
}

function scaleRecipe(recipe, servings) {
    const newServings = clamp(Number(servings), 1, 100);
    return {
        ...recipe,
        servings: newServings,
        ingredients: recipe.ingredients.map(ing => scaleIngredient(ing, recipe.servings, newServings))
    };
}

function convertAmount(amount, from, to) {
    if (!units[from] || !units[to]) return 0;
    if (units[from].type !== units[to].type) return null;
    const base = amount * units[from].value;
    return formatNumber(base / units[to].value);
}

function calculatePan(oldPan, newPan) {
    const getArea = (shape, w, h) => shape === "round" ? Math.PI * (w / 2) ** 2 : w * h;
    const oldArea = getArea(oldPan.shape, oldPan.width, oldPan.height);
    const newArea = getArea(newPan.shape, newPan.width, newPan.height);
    const multiplier = newArea / oldArea;
    const timeChange = Math.round((multiplier - 1) * 15);

    return {
        multiplier: formatNumber(multiplier),
        bakeTime: timeChange >= 0 ? `+${timeChange} mins` : `${timeChange} mins`
    };
}

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initRecipeSection();
    initConverterSection();
    initPanSection();
});

function initTheme() {
    const themeBtn = document.querySelector(".theme-button");
    const savedTheme = getData("app_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);

    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            const current = document.documentElement.getAttribute("data-theme");
            const next = current === "light" ? "dark" : "light";
            document.documentElement.setAttribute("data-theme", next);
            saveData("app_theme", next);
        });
    }
}

function initRecipeSection() {
    const container = document.querySelector(".recipe-area");
    if (!container) return;

    let recipe = getData("app_recipe") || defaultRecipe;
    let isEditing = false;

    function render() {
        container.innerHTML = `
            <div class="card recipe-card">
                <div class="recipe-header">
                    <div class="input-group" style="flex: 1;">
                        <label for="recipe-name" class="input-label">Recipe Name</label>
                        <input type="text" id="recipe-name" class="input" value="${recipe.name}">
                    </div>
                    <div style="display: flex; gap: 8px; align-items: flex-end;">
                        <button type="button" class="button primary" id="toggle-edit-btn">${isEditing ? "Done" : "Edit Recipe"}</button>
                        <div class="stepper">
                            <button type="button" id="step-down">-</button>
                            <input type="number" id="servings-input" value="${recipe.servings}" min="1">
                            <button type="button" id="step-up">+</button>
                        </div>
                    </div>
                </div>

                <div id="ingredients-list" class="ingredients"></div>

                ${isEditing ? `<button type="button" class="button" id="add-ingredient-btn" style="align-self: start;">+ Add Ingredient</button>` : ""}
            </div>
        `;

        const ingredientsList = container.querySelector("#ingredients-list");
        const scaled = scaleRecipe(recipe, recipe.servings);
        renderIngredients(ingredientsList, recipe, scaled, isEditing, update);

        const nameInput = container.querySelector("#recipe-name");
        nameInput.addEventListener("input", (e) => {
            recipe.name = e.target.value;
            saveData("app_recipe", recipe);
        });

        const editBtn = container.querySelector("#toggle-edit-btn");
        editBtn.addEventListener("click", () => {
            isEditing = !isEditing;
            render();
        });

        const servingsInput = container.querySelector("#servings-input");
        servingsInput.addEventListener("input", (e) => {
            const val = parseInt(e.target.value, 10) || 1;
            recipe.servings = Math.max(1, val);
            saveData("app_recipe", recipe);
            const currentScaled = scaleRecipe(recipe, recipe.servings);
            renderIngredients(ingredientsList, recipe, currentScaled, isEditing, update);
        });

        container.querySelector("#step-up").addEventListener("click", () => {
            recipe.servings += 1;
            servingsInput.value = recipe.servings;
            saveData("app_recipe", recipe);
            const currentScaled = scaleRecipe(recipe, recipe.servings);
            renderIngredients(ingredientsList, recipe, currentScaled, isEditing, update);
        });

        container.querySelector("#step-down").addEventListener("click", () => {
            if (recipe.servings > 1) {
                recipe.servings -= 1;
                servingsInput.value = recipe.servings;
                saveData("app_recipe", recipe);
                const currentScaled = scaleRecipe(recipe, recipe.servings);
                renderIngredients(ingredientsList, recipe, currentScaled, isEditing, update);
            }
        });

        if (isEditing) {
            container.querySelector("#add-ingredient-btn").addEventListener("click", () => {
                recipe.ingredients.push({ name: "New Ingredient", amount: 1, unit: "cup", type: "linear" });
                saveData("app_recipe", recipe);
                render();
            });
        }
    }

    function update() {
        saveData("app_recipe", recipe);
        render();
    }

    render();
}

function renderIngredients(container, rawRecipe, scaledRecipe, isEditing, onChange) {
    container.innerHTML = "";

    rawRecipe.ingredients.forEach((ing, index) => {
        const scaledIng = scaledRecipe.ingredients[index] || ing;
        const item = document.createElement("div");
        item.className = "ingredient";

        if (isEditing) {
            item.innerHTML = `
                <input type="text" class="input ing-name" value="${ing.name}" style="flex: 2; height: 36px; padding: 0 8px;">
                <input type="number" class="input ing-amount" value="${ing.amount}" style="width: 70px; height: 36px; padding: 0 8px;">
                <input type="text" class="input ing-unit" value="${ing.unit}" style="width: 70px; height: 36px; padding: 0 8px;">
                <button type="button" class="button remove-ing-btn" style="height: 36px; padding: 0 12px; color: var(--error);">✕</button>
            `;

            item.querySelector(".ing-name").addEventListener("input", (e) => {
                ing.name = e.target.value;
                onChange();
            });
            item.querySelector(".ing-amount").addEventListener("input", (e) => {
                ing.amount = parseFloat(e.target.value) || 0;
                onChange();
            });
            item.querySelector(".ing-unit").addEventListener("input", (e) => {
                ing.unit = e.target.value;
                onChange();
            });
            item.querySelector(".remove-ing-btn").addEventListener("click", () => {
                rawRecipe.ingredients.splice(index, 1);
                onChange();
            });
        } else {
            item.innerHTML = `
                <span class="ingredient-name">${scaledIng.name}</span>
                <div class="ingredient-value">
                    <span class="amount">${scaledIng.amount}</span>
                    <span class="unit">${scaledIng.unit}</span>
                </div>
            `;
        }

        container.appendChild(item);
    });
}

function initConverterSection() {
    const container = document.querySelector(".converter-area");
    if (!container) return;

    container.innerHTML = `
        <div class="card converter">
            <div class="input-group">
                <label class="input-label">From</label>
                <input class="input" id="convert-value" value="1" type="number" min="0">
                <select class="input" id="convert-from">
                    <option value="cup">Cups</option>
                    <option value="tablespoon">Tablespoons</option>
                    <option value="teaspoon">Teaspoons</option>
                    <option value="gram">Grams</option>
                    <option value="ounce">Ounces</option>
                    <option value="milliliter">Milliliters</option>
                </select>
            </div>

            <div class="arrow">→</div>

            <div class="input-group">
                <label class="input-label">To</label>
                <div class="converter-value" id="convert-result" style="display:flex; align-items:center; min-height: 48px;">—</div>
                <select class="input" id="convert-to">
                    <option value="gram">Grams</option>
                    <option value="cup">Cups</option>
                    <option value="tablespoon">Tablespoons</option>
                    <option value="teaspoon">Teaspoons</option>
                    <option value="ounce">Ounces</option>
                    <option value="milliliter">Milliliters</option>
                </select>
            </div>
        </div>
    `;

    const amount = container.querySelector("#convert-value");
    const from = container.querySelector("#convert-from");
    const to = container.querySelector("#convert-to");
    const result = container.querySelector("#convert-result");

    function update() {
        const value = convertAmount(Number(amount.value), from.value, to.value);
        result.textContent = value !== null && value !== undefined ? value : "Incompatible Units";
    }

    amount.addEventListener("input", update);
    from.addEventListener("change", update);
    to.addEventListener("change", update);
    update();
}

function initPanSection() {
    const container = document.querySelector(".pan-area");
    if (!container) return;

    container.innerHTML = `
        <div class="card">
            <div class="pan-grid">
                <div class="input-group">
                    <label class="input-label">Current Pan</label>
                    <select class="input" id="old-shape">
                        <option value="round">Round</option>
                        <option value="square">Square</option>
                    </select>
                    <input class="input" id="old-size" value="9" type="number">
                </div>
                <div class="input-group">
                    <label class="input-label">New Pan</label>
                    <select class="input" id="new-shape">
                        <option value="round">Round</option>
                        <option value="square">Square</option>
                    </select>
                    <input class="input" id="new-size" value="12" type="number">
                </div>
            </div>
            <div class="pan-grid" style="margin-top: 20px;">
                <div class="stat">
                    <div class="stat-value" id="pan-scale">1x</div>
                    <div class="stat-label">Ingredient Scale</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="pan-time">0 mins</div>
                    <div class="stat-label">Bake Time Change</div>
                </div>
            </div>
        </div>
    `;

    const oldShape = container.querySelector("#old-shape");
    const oldSize = container.querySelector("#old-size");
    const newShape = container.querySelector("#new-shape");
    const newSize = container.querySelector("#new-size");
    const scale = container.querySelector("#pan-scale");
    const time = container.querySelector("#pan-time");

    function update() {
        const res = calculatePan(
            { shape: oldShape.value, width: Number(oldSize.value), height: Number(oldSize.value) },
            { shape: newShape.value, width: Number(newSize.value), height: Number(newSize.value) }
        );
        scale.textContent = `${res.multiplier}x`;
        time.textContent = res.bakeTime;
    }

    oldShape.addEventListener("change", update);
    newShape.addEventListener("change", update);
    oldSize.addEventListener("input", update);
    newSize.addEventListener("input", update);
    update();
}
