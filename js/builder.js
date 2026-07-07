import { saveRecipe } from "./recipe.js";
import { generateRecipe } from "./ai.js";

export function createBuilder(recipe, container, update) {
    if (!recipe.steps) recipe.steps = [];
    if (!recipe.ingredients) recipe.ingredients = [];

    container.innerHTML = `
        <div class="card">
            <div class="input-group" id="import-section" style="margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 20px;">
                <label class="input-label">Import Recipe (YouTube / Blog Website)</label>
                <div style="display: flex; gap: 8px;">
                    <input class="input" id="import-url" style="flex: 1;" placeholder="Paste website or video link here...">
                    <button class="button primary" id="btn-import" style="width: auto;">Import Link</button>
                </div>
                <small id="import-status" style="color: var(--text-secondary); margin-top: 4px; display: block;"></small>
                
                <div id="paste-fallback" style="margin-top: 12px; display: block;">
                    <label class="input-label" style="font-size: 11px;">Paste recipe description text / instructions below:</label>
                    <textarea class="input" id="import-raw-text" style="width: 100%; min-height: 100px; padding: 8px; margin-top: 6px;" placeholder="Paste copied recipe ingredients and directions text directly here..."></textarea>
                    <button class="button primary" id="btn-import-text" style="margin-top: 8px; width: auto;">Auto-Format From Pasted Text</button>
                </div>
            </div>

            <div class="input-group">
                <label class="input-label">Dish Name</label>
                <input class="input" id="dish-name" value="${recipe.name || ""}">
            </div>

            <div class="input-group">
                <label class="input-label">Servings</label>
                <input class="input" id="dish-servings" type="number" value="${recipe.servings || 4}">
            </div>

            <h3>Ingredients</h3>
            <div id="builder-ingredients" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
                ${recipe.ingredients.map((item, index) => `
                    <div class="ingredient" style="display: flex; gap: 8px; align-items: center;">
                        <input class="input" style="flex: 2;" data-name="${index}" value="${item.name || ""}" placeholder="Ingredient Name">
                        <input class="input" style="width: 80px;" data-amount="${index}" type="number" step="any" value="${item.amount || 0}">
                        <input class="input" style="width: 120px;" data-unit="${index}" value="${item.unit || "cup"}" placeholder="unit">
                        <button class="button remove" data-remove="${index}" style="width: auto;">Remove</button>
                    </div>
                `).join("")}
            </div>

            <button class="button" id="add-ingredient" style="margin-bottom: 20px; width: auto;">+ Add Ingredient</button>

            <h3>Steps</h3>
            <div id="builder-steps" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
                ${recipe.steps.map((step, index) => `
                    <div style="display: flex; gap: 8px; align-items: flex-start;">
                        <span style="margin-top: 12px; font-weight: bold;">${index + 1}.</span>
                        <textarea class="input" style="flex: 1; min-height: 60px; padding: 8px;" data-step="${index}">${step.text || ""}</textarea>
                        <button class="button remove" data-remove-step="${index}" style="width: auto;">Remove</button>
                    </div>
                `).join("")}
            </div>

            <button class="button" id="add-step" style="margin-bottom: 24px; width: auto;">+ Add Step</button>
            
            <div style="display: flex; gap: 8px;">
                <button class="button primary" id="save" style="width: auto;">Save Dish</button>
                <button class="button remove" id="clear-recipe" style="width: auto; background-color: #dc3545; color: white;">Reset / Clear Recipe</button>
            </div>
        </div>
    `;

    container.querySelector("#dish-name").addEventListener("input", (e) => { recipe.name = e.target.value; });
    container.querySelector("#dish-servings").addEventListener("input", (e) => { recipe.servings = Number(e.target.value) || 1; });

    container.querySelectorAll("[data-name]").forEach(input => {
        input.addEventListener("input", () => { recipe.ingredients[input.dataset.name].name = input.value; });
    });
    container.querySelectorAll("[data-amount]").forEach(input => {
        input.addEventListener("input", () => { recipe.ingredients[input.dataset.amount].amount = Number(input.value) || 0; });
    });
    container.querySelectorAll("[data-unit]").forEach(input => {
        input.addEventListener("input", () => { recipe.ingredients[input.dataset.unit].unit = input.value; });
    });
    container.querySelectorAll("[data-step]").forEach(textarea => {
        textarea.addEventListener("input", () => { recipe.steps[textarea.dataset.step].text = textarea.value; });
    });

    container.querySelectorAll("[data-remove]").forEach(button => {
        button.addEventListener("click", () => {
            recipe.ingredients.splice(Number(button.dataset.remove), 1);
            createBuilder(recipe, container, update);
        });
    });

    container.querySelectorAll("[data-remove-step]").forEach(button => {
        button.addEventListener("click", () => {
            recipe.steps.splice(Number(button.dataset.removeStep), 1);
            createBuilder(recipe, container, update);
        });
    });

    container.querySelector("#add-ingredient").addEventListener("click", () => {
        recipe.ingredients.push({ name: "", amount: 1, unit: "cup", type: "linear" });
        createBuilder(recipe, container, update);
    });

    container.querySelector("#add-step").addEventListener("click", () => {
        recipe.steps.push({ text: "", timer: 0 });
        createBuilder(recipe, container, update);
    });

    function cleanName(name) {
        let text = name.toLowerCase().trim();
        if (text.endsWith("s") && text.length > 3) {
            text = text.slice(0, -1);
        }
        return text;
    }

    function mergeIngredients(list) {
        const merged = [];
        list.forEach(item => {
            const currentClean = cleanName(item.name);
            const found = merged.find(m => cleanName(m.name) === currentClean && m.unit.toLowerCase() === item.unit.toLowerCase());
            if (found) {
                found.amount += item.amount;
            } else {
                merged.push({ ...item });
            }
        });
        return merged;
    }

    function parseRecipeLocally(text) {
        const ingredients = [];
        const steps = [];
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

        lines.forEach(line => {
            if (line.toLowerCase().includes("add") || line.toLowerCase().includes("mix") || line.toLowerCase().includes("bake") || line.match(/^\d+\./)) {
                steps.push({ text: line.replace(/^\d+[\.\s\-]+/,"").trim(), timer: 0 });
            } else {
                const match = line.match(/^([\d\/\.]+)?\s*([a-zA-Z]+)?\s+(.+)/);
                if (match) {
                    ingredients.push({
                        name: match[3].trim(),
                        amount: parseFloat(match[1]) || 1,
                        unit: match[2] ? match[2].toLowerCase() : "piece",
                        type: "linear"
                    });
                }
            }
        });

        const finalIngredients = ingredients.length ? ingredients : [{ name: "Extracted Ingredient", amount: 1, unit: "cup", type: "linear" }];
        return {
            name: "Imported Dish",
            servings: 4,
            ingredients: mergeIngredients(finalIngredients),
            steps: steps.length ? steps : [{ text: "Extracted step entry line.", timer: 0 }]
        };
    }

    async function processRecipeFormatting(textPayload, statusEl) {
        statusEl.textContent = "Formatting recipe data inputs...";
        try {
            const dataOut = await generateRecipe(textPayload);
            const rawIngredients = Array.isArray(dataOut.ingredients) ? dataOut.ingredients : [];
            recipe.name = dataOut.name || "Imported Dish";
            recipe.servings = Number(dataOut.servings) || 4;
            recipe.ingredients = mergeIngredients(rawIngredients);
            recipe.steps = Array.isArray(dataOut.steps) ? dataOut.steps : [];
            statusEl.textContent = "Success (AI Mode)!";
        } catch (err) {
            const localData = parseRecipeLocally(textPayload);
            recipe.name = localData.name;
            recipe.servings = localData.servings;
            recipe.ingredients = localData.ingredients;
            recipe.steps = localData.steps;
            statusEl.textContent = "Success!";
        }
        createBuilder(recipe, container, update);
    }

    container.querySelector("#btn-import").addEventListener("click", () => {
        const status = container.querySelector("#import-status");
        status.textContent = "Links are currently blocked by browser security (CORS). Please copy and paste the recipe text into the box below!";
    });

    container.querySelector("#btn-import-text").addEventListener("click", async () => {
        const rawText = container.querySelector("#import-raw-text").value.trim();
        const status = container.querySelector("#import-status");
        if (!rawText) return;
        await processRecipeFormatting(rawText, status);
    });

    container.querySelector("#clear-recipe").addEventListener("click", () => {
        recipe.name = "";
        recipe.servings = 4;
        recipe.ingredients = [];
        recipe.steps = [];
        saveRecipe(recipe);
        createBuilder(recipe, container, update);
    });

    container.querySelector("#save").addEventListener("click", () => {
        recipe.ingredients = mergeIngredients(recipe.ingredients);
        saveRecipe(recipe);
        update(recipe);
    });
}