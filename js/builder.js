let recipeData = {
    name: "",
    ingredients: []
};

let timer;

let nameInput = document.getElementById("recipe-name");

if (nameInput) {
    nameInput.addEventListener("input", function(e) {
        recipeData.name = e.target.value;
        
        clearTimeout(timer);
        timer = setTimeout(function() {
            localStorage.setItem("saved_recipe", JSON.stringify(recipeData));
        }, 300);
    });
}

function parseRecipeLine(textLine) {
    let line = textLine.trim();
    if (line === "") {
        return null;
    }

    let words = line.split(" ");
    let firstNumber = parseFloat(words[0]);

    if (!isNaN(firstNumber)) {
        let unit = words[1] ? words[1].toLowerCase() : "unit";
        let name = words.slice(2).join(" ");

        let knownUnits = ["cup", "cups", "tsp", "teaspoon", "tbsp", "tablespoon", "g", "gram", "kg", "oz", "ounce", "lb", "pound", "pinch", "clove"];

        if (knownUnits.includes(unit)) {
            return {
                type: "ingredient",
                amount: firstNumber,
                unit: unit,
                name: name
            };
        } else {
            return {
                type: "ingredient",
                amount: firstNumber,
                unit: "unit",
                name: words.slice(1).join(" ")
            };
        }
    }

    if (words[0].toLowerCase() === "juice" && words[1].toLowerCase() === "of") {
        let amount = parseFloat(words[2]);
        let name = words[0] + " " + words[1] + " " + words.slice(3).join(" ");
        return {
            type: "ingredient",
            amount: amount,
            unit: "unit",
            name: name
        };
    }

    return {
        type: "instruction",
        text: line
    };
}

function cleanName(str) {
    let lower = str.toLowerCase();
    let noParens = "";
    let inside = false;

    for (let i = 0; i < lower.length; i++) {
        if (lower[i] === "(") {
            inside = true;
        } else if (lower[i] === ")") {
            inside = false;
        } else if (!inside) {
            noParens += lower[i];
        }
    }

    return noParens.trim();
}

function combineIngredients(list) {
    let combined = [];

    for (let i = 0; i < list.length; i++) {
        let item = list[i];
        let cleaned = cleanName(item.name);
        let found = false;

        for (let j = 0; j < combined.length; j++) {
            if (combined[j].name === cleaned && combined[j].unit === item.unit) {
                combined[j].amount = combined[j].amount + parseFloat(item.amount);
                found = true;
                break;
            }
        }

        if (!found) {
            combined.push({
                name: cleaned,
                unit: item.unit,
                amount: parseFloat(item.amount)
            });
        }
    }

    return combined;
}
