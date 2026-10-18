function renderAccountDisplay() {
    var session = JSON.parse(localStorage.getItem("rbs_sessao") || "null");
    var sessionEmail = sessionStorage.getItem("rbs_usuario_email") || session?.email || "";
    var users = JSON.parse(localStorage.getItem("rbs_usuarios") || "[]");
    var user = users.find((item) =>
        item.email?.toLowerCase() === sessionEmail.toLowerCase()
    );
    var name = user?.nome?.trim() || session?.nome?.trim();

    if (!name) return;

    document.querySelectorAll("[data-account-name]").forEach((element) => {
        element.textContent = name;
    });

    var initials = name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    document.querySelectorAll("[data-account-avatar]").forEach((element) => {
        element.textContent = initials;
    });
}

document.addEventListener("DOMContentLoaded", renderAccountDisplay);

window.addEventListener("storage", (event) => {
    if (event.key === "rbs_sessao" || event.key === "rbs_usuarios") {
        renderAccountDisplay();
    }
});
