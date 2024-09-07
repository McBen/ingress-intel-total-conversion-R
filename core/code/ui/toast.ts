// TODO: reploace by https://www.solid-toast.com/

export const toast = (text: string, duration: number = 1500): void => {
    const margin = 100;

    const message = $("<div>", { class: "toast-popup", text });
    $("body").append(message);

    message.css("width", "auto");
    const windowWidth = window.innerWidth;
    let toastWidth = message.innerWidth()! + margin;
    if (toastWidth >= windowWidth) {
        toastWidth = windowWidth - margin;
        $(self).css("width", toastWidth);
    }
    else {
        toastWidth = message.innerWidth()!;
    }

    const left = (windowWidth - toastWidth) / 2;
    const leftInPercentage = left * 100 / windowWidth;
    message.css("left", `${leftInPercentage}%`);
    message.fadeIn(400);

    setTimeout(() => {
        message.fadeOut(600);
        setTimeout(() => message.remove(), 600);
    }, duration);
}