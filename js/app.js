let myRecipe = {
    name: "",
    servings: 1
};

let servingsInput = document.getElementById("servings-input");
let stepUpBtn = document.getElementById("step-up");
let stepDownBtn = document.getElementById("step-down");
let themeBtn = document.querySelector(".theme-button");

let savedTheme = localStorage.getItem("app_theme") || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);

if (themeBtn) {
    themeBtn.addEventListener("click", function () {
        let currentTheme = document.documentElement.getAttribute("data-theme");
        let newTheme = currentTheme === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("app_theme", newTheme);
    });
}

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

if (stepUpBtn && servingsInput) {
    stepUpBtn.addEventListener("click", function() {
        let val = parseInt(servingsInput.value) || 1;
        val = val + 1;
        servingsInput.value = val;
        scaleIngredients(val);
    });
}

if (stepDownBtn && servingsInput) {
    stepDownBtn.addEventListener("click", function() {
        let val = parseInt(servingsInput.value) || 1;
        if (val > 1) {
            val = val - 1;
            servingsInput.value = val;
            scaleIngredients(val);
        }
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

function calculatePanAreas() {
    let pan1Select = document.getElementById("pan-1-type");
    let pan2Select = document.getElementById("pan-2-type");
    let pan1Stat = document.getElementById("pan-1-area");
    let pan2Stat = document.getElementById("pan-2-area");
    let panRatioStat = document.getElementById("pan-ratio");

    if (!pan1Select || !pan2Select) return;

    let pan1Area = getPanArea(pan1Select.value);
    let pan2Area = getPanArea(pan2Select.value);

    if (pan1Stat) pan1Stat.textContent = pan1Area.toFixed(1) + " sq in";
    if (pan2Stat) pan2Stat.textContent = pan2Area.toFixed(1) + " sq in";

    if (panRatioStat) {
        let ratio = pan2Area / pan1Area;
        panRatioStat.textContent = "Scale Factor: " + ratio.toFixed(2) + "x";
    }
}

function getPanArea(type) {
    if (type === "8-round") return Math.PI * 16;
    if (type === "9-round") return Math.PI * 20.25;
    if (type === "8-square") return 64;
    if (type === "9-square") return 81;
    if (type === "9x13-rect") return 117;
    return 64;
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
        calculatePanAreas();
    }
}

let pan1Select = document.getElementById("pan-1-type");
let pan2Select = document.getElementById("pan-2-type");

if (pan1Select) pan1Select.addEventListener("change", calculatePanAreas);
if (pan2Select) pan2Select.addEventListener("change", calculatePanAreas);

window.addEventListener("DOMContentLoaded", checkTab);
window.addEventListener("hashchange", checkTab);
