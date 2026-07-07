import { formatNumber } from "./utils.js";


const units = {

    teaspoon: {
        type: "volume",
        value: 1
    },

    tablespoon: {
        type: "volume",
        value: 3
    },

    cup: {
        type: "volume",
        value: 48
    },

    milliliter: {
        type: "volume",
        value: 0.202884
    },

    liter: {
        type: "volume",
        value: 202.884
    },


    gram: {
        type: "weight",
        value: 1
    },

    kilogram: {
        type: "weight",
        value: 1000
    },

    ounce: {
        type: "weight",
        value: 28.3495
    },

    pound: {
        type: "weight",
        value: 453.592
    }

};



export function convertAmount(
    amount,
    from,
    to
) {

    if (!units[from] || !units[to]) {
        return 0;
    }


    if (
        units[from].type !==
        units[to].type
    ) {

        return null;

    }


    const base =
        amount * units[from].value;


    return formatNumber(
        base / units[to].value
    );

}



export function createConverter(container) {


    container.innerHTML = `

        <div class="card">

            <div class="converter">


                <div class="input-group">

                    <label class="input-label">
                        Amount
                    </label>


                    <input
                        class="input"
                        id="convert-value"
                        value="1"
                        type="number"
                    >

                    <select
                        class="input"
                        id="convert-from"
                    >

                        <option value="cup">
                            Cups
                        </option>

                        <option value="gram">
                            Grams
                        </option>

                        <option value="tablespoon">
                            Tablespoons
                        </option>

                        <option value="teaspoon">
                            Teaspoons
                        </option>

                    </select>

                </div>



                <div class="arrow">
                    →
                </div>



                <div class="input-group">

                    <label class="input-label">
                        Result
                    </label>


                    <div 
                        class="converter-value"
                        id="convert-result"
                    >
                        48
                    </div>


                    <select
                        class="input"
                        id="convert-to"
                    >

                        <option value="gram">
                            Grams
                        </option>

                        <option value="cup">
                            Cups
                        </option>

                        <option value="milliliter">
                            Milliliters
                        </option>

                        <option value="ounce">
                            Ounces
                        </option>

                    </select>


                </div>


            </div>

        </div>

    `;


    const amount =
        container.querySelector("#convert-value");


    const from =
        container.querySelector("#convert-from");


    const to =
        container.querySelector("#convert-to");


    const result =
        container.querySelector("#convert-result");



    function update() {

        const value = convertAmount(
            Number(amount.value),
            from.value,
            to.value
        );


        result.textContent =
            value ?? "—";

    }

    amount.addEventListener(
        "input",
        update
    );

    from.addEventListener(
        "change",
        update
    );

    to.addEventListener(
        "change",
        update
    );
    update();
}