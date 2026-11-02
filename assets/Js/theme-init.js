// Aplica a preferência de tema salva antes de a página ser exibida.
(function () {
    let theme = "light";

    try {
        theme = localStorage.getItem("rbs_theme") === "dark" ? "dark" : "light";
    } catch (error) {
        console.error("Não foi possível ler a preferência de tema:", error);
    }

    document.documentElement.setAttribute("data-theme", theme);
})();
