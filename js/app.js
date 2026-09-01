const defaultRecipe = {
    name: "Chocolate Chip Cookies",
    servings: 4,
    ingredients: [
        { name: "Flour", amount: 2, unit: "cups", type: "linear" },
        { name: "Sugar", amount: 1, unit: "cup", type: "linear" },
        { name: "Salt", amount: 0.5, unit: "tsp", type: "nonlinear" },
        { name: "Baking Powder", amount: 1, unit: "tsp", type: "nonlinear" }
    ],
    steps: []
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
    if (Number.isInteger(value)) {
        return value;
    }

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

    if (!data) {
        return null;
    }

    return JSON.parse(data);
}

function scaleIngredient(ingredient, oldServings, newServings) {
    const ratio = newServings / oldServings;
    let amount = ingredient.amount * ratio;

    if (ingredient.type === "nonlinear") {
        const name = ingredient.name.toLowerCase();

        if (name.includes("salt") || name.includes("spice")) {
            amount = ingredient.amount * (0.7 + ratio * 0.3);
        } else if (name.includes("yeast") || name.includes("baking")) {
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
        ingredients: recipe.ingredients.map(ingredient =>
            scaleIngredient(
                ingredient,
                recipe.servings,
                newServings
            )
        )
    };
}

function convertAmount(amount, from, to) {
    if (!units[from] || !units[to]) {
        return null;
    }

    if (units[from].type !== units[to].type) {
        return null;
    }

    const base = amount * units[from].value;

    return formatNumber(base / units[to].value);
}

function getPanArea(shape, width, height) {
    if (shape === "round") {
        return Math.PI * (width / 2) ** 2;
    }

    return width * height;
}

function calculatePan(oldPan, newPan) {
    const oldArea = getPanArea(
        oldPan.shape,
        oldPan.width,
        oldPan.height
    );

    const newArea = getPanArea(
        newPan.shape,
        newPan.width,
        newPan.height
    );

    const multiplier = newArea / oldArea;
    const timeChange = Math.round((multiplier - 1) * 15);

    return {
        multiplier: formatNumber(multiplier),
        bakeTime: timeChange >= 0
            ? `+${timeChange} mins`
            : `${timeChange} mins`
    };
}

function parseRecipeLine(text) {
    const line = text.trim();

    if (!line) {
        return null;
    }

    const words = line.split(" ");
    const amount = parseFloat(words[0]);

    const knownUnits = [
        "cup",
        "cups",
        "tsp",
        "teaspoon",
        "tbsp",
        "tablespoon",
        "g",
        "gram",
        "kg",
        "oz",
        "ounce",
        "lb",
        "pound",
        "pinch",
        "clove"
    ];

    if (!isNaN(amount)) {
        const unit = words[1]
            ? words[1].toLowerCase()
            : "unit";

        if (knownUnits.includes(unit)) {
            return {
                type: "ingredient",
                amount: amount,
                unit: unit,
                name: words.slice(2).join(" ")
            };
        }

        return {
            type: "ingredient",
            amount: amount,
            unit: "unit",
            name: words.slice(1).join(" ")
        };
    }

    return {
        type: "instruction",
        text: line
    };
}

function cleanName(name) {
    let result = "";
    let insideParentheses = false;

    for (const character of name.toLowerCase()) {
        if (character === "(") {
            insideParentheses = true;
        } else if (character === ")") {
            insideParentheses = false;
        } else if (!insideParentheses) {
            result += character;
        }
    }

    return result.trim();
}

function combineIngredients(ingredients) {
    const combined = [];

    ingredients.forEach(ingredient => {
        const name = cleanName(ingredient.name);

        const existing = combined.find(item =>
            item.name === name &&
            item.unit === ingredient.unit
        );

        if (existing) {
            existing.amount += Number(ingredient.amount);
        } else {
            combined.push({
                name: name,
                unit: ingredient.unit,
                amount: Number(ingredient.amount)
            });
        }
    });

    return combined;
}

async function generateRecipe(ingredients) {
    const response = await fetch("/api/recipe", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ ingredients })
    });

    if (!response.ok) {
        throw new Error("Recipe generation failed");
    }

    return response.json();
}

async function copyRecipe(recipe) {
    let text = `${recipe.name}\n\n`;
    text += "Ingredients\n";

    recipe.ingredients.forEach(ingredient => {
        text += `${ingredient.name}: ${ingredient.amount} ${ingredient.unit}\n`;
    });

    await navigator.clipboard.writeText(text);
}

let activeTimer = null;

function startTimer(seconds, button) {
    let time = Number(seconds);

    if (!time || time <= 0) {
        return;
    }

    if (activeTimer) {
        clearInterval(activeTimer);
    }

    button.disabled = true;
    button.textContent = `${time}s`;

    activeTimer = setInterval(() => {
        time--;

        button.textContent = `${time}s`;

        if (time <= 0) {
            clearInterval(activeTimer);
            activeTimer = null;
            button.textContent = "Done";
            button.disabled = false;
        }
    }, 1000);
}

function setupTheme() {
    const button = document.querySelector(".theme-button");

    if (!button) {
        return;
    }

    const savedTheme = getData("app_theme") || "light";

    document.documentElement.setAttribute(
        "data-theme",
        savedTheme
    );

    button.addEventListener("click", () => {
        const current =
            document.documentElement.getAttribute("data-theme");

        const next = current === "light"
            ? "dark"
            : "light";

        document.documentElement.setAttribute(
            "data-theme",
            next
        );

        saveData("app_theme", next);
    });
}

function initRecipe() {
    const container = document.querySelector(".recipe-area");

    if (!container) {
        return;
    }

    let recipe = getData("app_recipe") || defaultRecipe;
    let editing = false;

    function render() {
        container.innerHTML = `
            <div class="recipe-card">
                <div class="recipe-header">
                    <input
                        type="text"
                        id="recipe-name"
                        value="${recipe.name}"
                    >

                    <button id="toggle-edit">
                        ${editing ? "Done" : "Edit Recipe"}
                    </button>

                    <button id="servings-down">-</button>

                    <input
                        type="number"
                        id="servings"
                        value="${recipe.servings}"
                        min="1"
                    >

                    <button id="servings-up">+</button>
                </div>

                <div id="ingredients"></div>

                ${
                    editing
                        ? `<button id="add-ingredient">Add Ingredient</button>`
                        : ""
                }
            </div>
        `;

        renderIngredients();

        const nameInput = container.querySelector("#recipe-name");

        nameInput.addEventListener("input", event => {
            recipe.name = event.target.value;
            saveData("app_recipe", recipe);
        });

        container
            .querySelector("#toggle-edit")
            .addEventListener("click", () => {
                editing = !editing;
                render();
            });

        container
            .querySelector("#servings")
            .addEventListener("input", event => {
                recipe.servings = Math.max(
                    1,
                    Number(event.target.value) || 1
                );

                saveData("app_recipe", recipe);
                renderIngredients();
            });

        container
            .querySelector("#servings-up")
            .addEventListener("click", () => {
                recipe.servings++;
                saveData("app_recipe", recipe);
                render();
            });

        container
            .querySelector("#servings-down")
            .addEventListener("click", () => {
                if (recipe.servings > 1) {
                    recipe.servings--;
                    saveData("app_recipe", recipe);
                    render();
                }
            });

        if (editing) {
            container
                .querySelector("#add-ingredient")
                .addEventListener("click", () => {
                    recipe.ingredients.push({
                        name: "New Ingredient",
                        amount: 1,
                        unit: "cup",
                        type: "linear"
                    });

                    saveData("app_recipe", recipe);
                    render();
                });
        }
    }

    function renderIngredients() {
        const container =
            document.querySelector("#ingredients");

        if (!container) {
            return;
        }

        const scaledRecipe = scaleRecipe(
            recipe,
            recipe.servings
        );

        container.innerHTML = "";

        recipe.ingredients.forEach((ingredient, index) => {
            const scaled = scaledRecipe.ingredients[index];
            const row = document.createElement("div");

            row.className = "ingredient";

            if (editing) {
                row.innerHTML = `
                    <input
                        class="ingredient-name"
                        value="${ingredient.name}"
                    >

                    <input
                        class="ingredient-amount"
                        type="number"
                        value="${ingredient.amount}"
                    >

                    <input
                        class="ingredient-unit"
                        value="${ingredient.unit}"
                    >

                    <button class="remove-ingredient">
                        Remove
                    </button>
                `;

                row
                    .querySelector(".ingredient-name")
                    .addEventListener("input", event => {
                        ingredient.name = event.target.value;
                        saveData("app_recipe", recipe);
                    });

                row
                    .querySelector(".ingredient-amount")
                    .addEventListener("input", event => {
                        ingredient.amount =
                            Number(event.target.value) || 0;

                        saveData("app_recipe", recipe);
                    });

                row
                    .querySelector(".ingredient-unit")
                    .addEventListener("input", event => {
                        ingredient.unit = event.target.value;
                        saveData("app_recipe", recipe);
                    });

                row
                    .querySelector(".remove-ingredient")
                    .addEventListener("click", () => {
                        recipe.ingredients.splice(index, 1);
                        saveData("app_recipe", recipe);
                        render();
                    });
            } else {
                row.innerHTML = `
                    <span>${scaled.name}</span>
                    <span>
                        ${scaled.amount} ${scaled.unit}
                    </span>
                `;
            }

            container.appendChild(row);
        });
    }

    render();
}

function initConverter() {
    const container = document.querySelector(".converter-area");

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="converter">
            <input
                id="convert-value"
                type="number"
                value="1"
            >

            <select id="convert-from">
                <option value="cup">Cups</option>
                <option value="tablespoon">Tablespoons</option>
                <option value="teaspoon">Teaspoons</option>
                <option value="milliliter">Milliliters</option>
                <option value="liter">Liters</option>
                <option value="gram">Grams</option>
                <option value="kilogram">Kilograms</option>
                <option value="ounce">Ounces</option>
                <option value="pound">Pounds</option>
            </select>

            <span>→</span>

            <span id="convert-result">—</span>

            <select id="convert-to">
                <option value="gram">Grams</option>
                <option value="cup">Cups</option>
                <option value="tablespoon">Tablespoons</option>
                <option value="teaspoon">Teaspoons</option>
                <option value="milliliter">Milliliters</option>
                <option value="liter">Liters</option>
                <option value="kilogram">Kilograms</option>
                <option value="ounce">Ounces</option>
                <option value="pound">Pounds</option>
            </select>
        </div>
    `;

    const amount = container.querySelector("#convert-value");
    const from = container.querySelector("#convert-from");
    const to = container.querySelector("#convert-to");
    const result = container.querySelector("#convert-result");

    function update() {
        const value = convertAmount(
            Number(amount.value),
            from.value,
            to.value
        );

        result.textContent =
            value === null ? "Incompatible units" : value;
    }

    amount.addEventListener("input", update);
    from.addEventListener("change", update);
    to.addEventListener("change", update);

    update();
}

function initPan() {
    const container = document.querySelector(".pan-area");

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="pan">
            <div>
                <label>Current Pan</label>

                <select id="old-shape">
                    <option value="round">Round</option>
                    <option value="square">Square</option>
                </select>

                <input
                    id="old-size"
                    type="number"
                    value="9"
                >
            </div>

            <div>
                <label>New Pan</label>

                <select id="new-shape">
                    <option value="round">Round</option>
                    <option value="square">Square</option>
                </select>

                <input
                    id="new-size"
                    type="number"
                    value="12"
                >
            </div>

            <div>
                <strong id="pan-scale">1x</strong>
                <span>Ingredient Scale</span>
            </div>

            <div>
                <strong id="pan-time">0 mins</strong>
                <span>Bake Time Change</span>
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
        const result = calculatePan(
            {
                shape: oldShape.value,
                width: Number(oldSize.value),
                height: Number(oldSize.value)
            },
            {
                shape: newShape.value,
                width: Number(newSize.value),
                height: Number(newSize.value)
            }
        );

        scale.textContent = `${result.multiplier}x`;
        time.textContent = result.bakeTime;
    }

    oldShape.addEventListener("change", update);
    oldSize.addEventListener("input", update);
    newShape.addEventListener("change", update);
    newSize.addEventListener("input", update);

    update();
}

document.addEventListener("DOMContentLoaded", () => {
    setupTheme();
    initRecipe();
    initConverter();
    initPan();
});
