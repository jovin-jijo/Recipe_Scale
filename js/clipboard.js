export function copyRecipe(recipe) {
    let text = "";

    text += recipe.name + "\n\n";
    text += "Ingredients\n";

    recipe.ingredients.forEach(ingredient => {
        text += `${ingredient.name}: ${ingredient.amount} ${ingredient.unit}\n`;
    });

    navigator.clipboard.writeText(text);
}