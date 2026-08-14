let myRecipe = {
    name: "",
    servings: 1
};

let servingsInput = document.getElementById("servings-input");

if (servingsInput) {
    servingsInput.addEventListener("input", function(e) {
        let val = parseInt(e.target.value);
        
        if (isNaN(val) || val < 1) {
            val = 1;
        }

        if (e.target.value !== "" && parseInt(e.target.value) < 1) {
            e.target.value = 1;
        }

        myRecipe.servings = val;
        scaleIngredients(val);
    });
}

function scaleIngredients(servings) {
    let ingredientAmounts = document.querySelectorAll("[data-base-amount]");

    for (let i = 0; i < ingredientAmounts.length; i++) {
        let item = ingredientAmounts[i];
        let base = parseFloat(item.getAttribute("data-base-amount"));
        let isSensitive = item.getAttribute("data-sensitive");

        if (!isNaN(base)) {
            let total = 0;
            if (isSensitive === "true") {
                total = base * (0.7 + servings * 0.3);
            } else {
                total = base * servings;
            }
            item.textContent = Math.round(total * 100) / 100;
        }
    }
}

function checkTab() {
    let hash = window.location.hash;
    if (hash === "") {
        hash = "#scale";
    }

    let scaleSec = document.getElementById("scale");
    let convertSec = document.getElementById("convert");
    let panSec = document.getElementById("pan");

    if (scaleSec) scaleSec.style.display = "none";
    if (convertSec) convertSec.style.display = "none";
    if (panSec) panSec.style.display = "none";

    if (hash === "#scale" && scaleSec) {
        scaleSec.style.display = "block";
    } else if (hash === "#convert" && convertSec) {
        convertSec.style.display = "block";
    } else if (hash === "#pan" && panSec) {
        panSec.style.display = "block";
    }
}

window.addEventListener("DOMContentLoaded", checkTab);
window.addEventListener("hashchange", checkTab);
