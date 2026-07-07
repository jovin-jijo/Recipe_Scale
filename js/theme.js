import { getData, saveData } from "./utils.js";

export function setupTheme(button) {
    const savedTheme = getData("recipe-theme");

    if (savedTheme === "light") {
        document.body.dataset.theme = "light";
    }

    button.addEventListener("click", () => {
        const current = document.body.dataset.theme;

        if (current === "light") {
            document.body.dataset.theme = "dark";
            saveData("recipe-theme", "dark");
        } else {
            document.body.dataset.theme = "light";
            saveData("recipe-theme", "light");
        }
    });
}