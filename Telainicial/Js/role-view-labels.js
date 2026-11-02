// Ajusta os rótulos da interface para identificar a área do patrocinador.
// INTEGRAÇÃO BACK-END: usar o perfil retornado pela sessão autenticada da API.
(function () {
    const session = JSON.parse(localStorage.getItem("rbs_sessao") || "null");

    if (session?.perfil !== "patrocinador") return;

    document.querySelectorAll("[data-role-area]").forEach((element) => {
        element.textContent = "Patrocinador RBS";
    });
})();
