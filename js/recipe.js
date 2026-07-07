import { saveData, getData } from "./utils.js";

export const defaultRecipe = {
    name: "My Recipe",
    servings: 4,
    difficulty: "Easy",
    prepTime: "15 minutes",
    cookTime: "30 minutes",
    ingredients: [
        {
            name: "Ingredient",
            amount: 1,
            unit: "cup",
            type: "linear"
        }
    ],
    steps: [
        {
            text: "Add instructions here",
            timer: 0
        }
    ]
};

export function saveRecipe(recipe) {
    saveData("recipe", recipe);
}

export function loadRecipe() {
    return getData("recipe") || defaultRecipe;
}

export function updateRecipeValue(recipe, key, value) {
    recipe[key] = value;
    saveRecipe(recipe);
}

export function addIngredient(recipe) {
    recipe.ingredients.push({
        name: "New Ingredient",
        amount: 1,
        unit: "cup",
        type: "linear"
    });
    saveRecipe(recipe);
}

export function removeIngredient(recipe, index) {
    recipe.ingredients.splice(index, 1);
    saveRecipe(recipe);
}

export function addStep(recipe) {
    recipe.steps.push({
        text: "New Step",
        timer: 0
    });
    saveRecipe(recipe);
}

export function renderEditor(recipe, container) {
    container.innerHTML = `
        <div class="card">
            <div class="input-group">
                <label class="input-label">Recipe Name</label>
                <input class="input" id="recipe-name" value="${recipe.name}">
            </div>

            <div class="input-group">
                <label class="input-label">Servings</label>
                <input class="input" id="recipe-servings" type="number" value="${recipe.servings}">
            </div>

            <h3>Ingredients</h3>
            <div class="ingredients-editor">
                ${recipe.ingredients.map((item, index) => `
                    <div class="ingredient">
                        <input class="input ingredient-name" value="${item.name}" data-index="${index}">
                        <input class="input ingredient-amount" type="number" value="${item.amount}" data-index="${index}">
                        <select class="input ingredient-unit" data-index="${index}">
                            <option ${item.unit === "cup" ? "selected" : ""}>cup</option>
                            <option ${item.unit === "grams" ? "selected" : ""}>grams</option>
                            <option ${item.unit === "tsp" ? "selected" : ""}>tsp</option>
                            <option ${item.unit === "tbsp" ? "selected" : ""}>tbsp</option>
                        </select>
                        <button class="button remove" data-index="${index}">Remove</button>
                    </div>
                `).join("")}
            </div>

            <button class="button" id="add-ingredient">Add Ingredient</button>

            <h3>Instructions</h3>
            ${recipe.steps.map((step, index) => `
                <textarea class="input step-input" data-index="${index}">${step.text}</textarea>
            `).join("")}

            <button class="button" id="add-step">Add Step</button>
            <button class="button primary" id="save-recipe">Save Recipe</button>
        </div>
    `;

    const name = container.querySelector("#recipe-name");
    name.addEventListener("input", () => {
        recipe.name = name.value;
        saveRecipe(recipe);
    });

    const servings = container.querySelector("#recipe-servings");
    servings.addEventListener("input", () => {
        recipe.servings = Number(servings.value);
        saveRecipe(recipe);
    });

    container.querySelectorAll(".ingredient-name").forEach(input => {
        input.addEventListener("input", () => {
            const index = input.dataset.index;
            recipe.ingredients[index].name = input.value;
            saveRecipe(recipe);
        });
    });

    container.querySelector("#add-ingredient").addEventListener("click", () => {
        addIngredient(recipe);
        renderEditor(recipe, container);
    });
}