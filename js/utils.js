export function select(selector) {
    return document.querySelector(selector);
}


export function createElement(tag, className = "") {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    return element;
}


export function formatNumber(value) {
    if (Number.isInteger(value)) {
        return value;
    }

    return Number(value.toFixed(2));
}


export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}


export function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}


export function getData(key) {
    const data = localStorage.getItem(key);

    if (!data) {
        return null;
    }

    return JSON.parse(data);
}