import { formatNumber } from "./utils.js";

function getArea(shape, width, height) {
    if (shape === "round") {
        return Math.PI * (width / 2) ** 2;
    }
    return width * height;
}

export function calculatePan(oldPan, newPan) {
    const oldArea = getArea(oldPan.shape, oldPan.width, oldPan.height);
    const newArea = getArea(newPan.shape, newPan.width, newPan.height);
    const multiplier = newArea / oldArea;
    const timeChange = Math.round((multiplier - 1) * 15);

    return {
        multiplier: formatNumber(multiplier),
        bakeTime: timeChange >= 0 ? `+${timeChange} mins` : `${timeChange} mins`
    };
}

export function createPanConverter(container) {
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <div class="pan-grid">
                <div class="input-group">
                    <label class="input-label">Current Pan</label>
                    <select class="input" id="old-shape">
                        <option value="round">Round</option>
                        <option value="square">Square</option>
                    </select>
                    <input class="input" id="old-size" value="9" type="number">
                </div>
                <div class="input-group">
                    <label class="input-label">New Pan</label>
                    <select class="input" id="new-shape">
                        <option value="round">Round</option>
                        <option value="square">Square</option>
                    </select>
                    <input class="input" id="new-size" value="12" type="number">
                </div>
            </div>
            <div class="pan-grid" style="margin-top: 20px;">
                <div class="stat">
                    <div class="stat-value" id="pan-scale">1x</div>
                    <div class="stat-label">Ingredient Scale</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="pan-time">0 mins</div>
                    <div class="stat-label">Bake Time Change</div>
                </div>
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
            { shape: oldShape.value, width: Number(oldSize.value), height: Number(oldSize.value) },
            { shape: newShape.value, width: Number(newSize.value), height: Number(newSize.value) }
        );
        scale.textContent = `${result.multiplier}x`;
        time.textContent = result.bakeTime;
    }

    oldShape.addEventListener("change", update);
    newShape.addEventListener("change", update);
    oldSize.addEventListener("input", update);
    newSize.addEventListener("input", update);
    
    update();
}