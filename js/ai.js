export async function generateRecipe(ingredients) {
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

    return await response.json();
}