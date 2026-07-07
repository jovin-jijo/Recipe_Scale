let timer;

export function startTimer(seconds, button) {
    let time = seconds;

    button.disabled = true;

    timer = setInterval(() => {
        time--;
        button.textContent = `${time}s`;

        if (time <= 0) {
            clearInterval(timer);
            button.textContent = "Done";
            button.disabled = false;
        }
    }, 1000);
}