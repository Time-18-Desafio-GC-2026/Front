
/**
 * Protege o dashboard administrativo.
 * Somente usuários com o perfil "funcionario"
 * podem permanecer nesta página.
 */
(function verificarAcessoAdmin() {
    const sessaoAdmin = JSON.parse(
        localStorage.getItem("rbs_sessao") || "null"
    );

    if (sessaoAdmin?.perfil === "patrocinador" && sessaoAdmin.patrocinadorId) {
        window.location.replace(
            "TelaPatrocinador/indexPatrocinador.html"
        );
        return;
    }

    if (!sessaoAdmin || sessaoAdmin.perfil !== "funcionario") {
        window.location.replace(
            "../Teladelogin/indexLogin.html"
        );
    }
})();
