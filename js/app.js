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

// State tracking functions to save and load view modes on page refresh
export function saveViewMode(mode) {
    saveData("recipe-view-mode", mode);
}

export function loadViewMode() {
    return getData("recipe-view-mode") || "view"; // Safely defaults to preview/view mode
}
