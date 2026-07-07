import { formatNumber, clamp } from "./utils.js";

export function scaleIngredient(ingredient, oldServings, newServings) {
    const ratio = newServings / oldServings;
    let amount = ingredient.amount * ratio;

    if (ingredient.type === "nonlinear") {
        amount = adjustNonlinear(
            ingredient.name,
            ingredient.amount,
            ratio
        );
    }

    return {
        ...ingredient,
        amount: formatNumber(amount)
    };
}

function adjustNonlinear(name, amount, ratio) {
    const lowerName = name.toLowerCase();

    if (
        lowerName.includes("salt") ||
        lowerName.includes("spice")
    ) {
        return amount * (0.7 + ratio * 0.3);
    }

    if (
        lowerName.includes("yeast") ||
        lowerName.includes("baking")
    ) {
        return amount * (0.8 + ratio * 0.2);
    }

    return amount * ratio;
}

export function scaleRecipe(recipe, servings) {
    const newServings = clamp(
        Number(servings),
        1,
        100
    );

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

export function renderIngredients(container, ingredients) {
    container.innerHTML = "";

    ingredients.forEach(ingredient => {
        const row = document.createElement("div");
        row.className = "ingredient";

        row.innerHTML = `
            <span class="ingredient-name">
                ${ingredient.name}
            </span>
            <span class="ingredient-value">
                ${ingredient.amount}
                ${ingredient.unit}
            </span>
        `;

        container.appendChild(row);
    });
}

export function getScalingNote(ingredient, oldAmount, newAmount) {
    if (ingredient.type !== "nonlinear") {
        return "";
    }

    if (newAmount < oldAmount) {
        return `${ingredient.name} reduced slightly.`;
    }

    return `${ingredient.name} adjusted for recipe size.`;
}