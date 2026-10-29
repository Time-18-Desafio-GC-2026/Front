(function () {
    const session = JSON.parse(localStorage.getItem("rbs_sessao") || "null");

    if (session?.perfil !== "patrocinador") return;

    document.querySelectorAll("[data-role-area]").forEach((element) => {
        element.textContent = "Patrocinador RBS";
    });
})();
