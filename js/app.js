import { select } from "./utils.js";
import { createConverter } from "./converter.js";
import { createPanConverter } from "./pan.js";
import { setupTheme } from "./theme.js";
import { copyRecipe } from "./clipboard.js";
import { scaleRecipe, renderIngredients } from "./scaling.js";
import { createBuilder } from "./builder.js";
import { loadRecipe, saveRecipe } from "./recipe.js";

let currentRecipe = loadRecipe();
let currentMode = "view";

function startApp() {
    const scaleArea = select(".recipe-area");
    const converterArea = select(".converter-area");
    const panArea = select(".pan-area");
    const themeButton = select(".theme-button");

    setupTheme(themeButton);
    createConverter(converterArea);
    createPanConverter(panArea);

    if (!scaleArea) return;

    function renderMainInterface() {
        if (currentMode === "edit") {
            createBuilder(currentRecipe, scaleArea, (updatedRecipe) => {
                currentRecipe = updatedRecipe;
                saveRecipe(currentRecipe);
                currentMode = "view";
                renderMainInterface();
            });
        } else {
            scaleArea.innerHTML = `
                <div class="card recipe-card">
                    <div class="recipe-header">
                        <div>
                            <h2 class="recipe-title">${currentRecipe.name || "My Recipe"}</h2>
                            <div class="recipe-info">
                                <span>Servings: <strong id="serving-count">${currentRecipe.servings}</strong></span>
                            </div>
                        </div>
                        <div class="stepper">
                            <button id="minus">-</button>
                            <input id="servings" value="${currentRecipe.servings}" type="number" min="1">
                            <button id="plus">+</button>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
                        <button class="button primary" id="edit-mode-btn" style="width: auto;">Modify / Import Another</button>
                        <button class="button" id="copy-recipe" style="width: auto;">Copy Recipe</button>
                        <button class="button" id="print-recipe" style="width: auto;">Print Recipe</button>
                    </div>

                    <h3>Ingredients</h3>
                    <div class="ingredients"></div>
                    <h3>Instructions</h3>
                    <div class="steps">
                        ${(currentRecipe.steps || []).map((step, idx) => `
                            <p><strong>${idx + 1}.</strong> ${step.text}</p>
                        `).join("") || "<p>No steps added yet.</p>"}
                    </div>
                </div>
            `;

            const ingredientsContainer = scaleArea.querySelector(".ingredients");
            const servingsInput = scaleArea.querySelector("#servings");
            const minusButton = scaleArea.querySelector("#minus");
            const plusButton = scaleArea.querySelector("#plus");
            const editButton = scaleArea.querySelector("#edit-mode-btn");
            const copyButton = scaleArea.querySelector("#copy-recipe");
            const printButton = scaleArea.querySelector("#print-recipe");

            function updateRecipeScaling(targetServings) {
                if (targetServings < 1) targetServings = 1;
                const scaled = scaleRecipe(currentRecipe, targetServings);
                servingsInput.value = scaled.servings;
                scaleArea.querySelector("#serving-count").textContent = scaled.servings;
                renderIngredients(ingredientsContainer, scaled.ingredients);
            }

            minusButton.addEventListener("click", () => updateRecipeScaling(currentRecipe.servings - 1));
            plusButton.addEventListener("click", () => updateRecipeScaling(currentRecipe.servings + 1));
            servingsInput.addEventListener("input", (e) => updateRecipeScaling(Number(e.target.value)));
            
            editButton.addEventListener("click", () => {
                currentMode = "edit";
                renderMainInterface();
            });

            copyButton.addEventListener("click", () => {
                copyRecipe(currentRecipe);
                copyButton.textContent = "Copied";
                setTimeout(() => { copyButton.textContent = "Copy Recipe"; }, 1500);
            });

            printButton.addEventListener("click", () => {
                window.print();
            });

            updateRecipeScaling(currentRecipe.servings);
        }
    }

    renderMainInterface();
}

startApp();
