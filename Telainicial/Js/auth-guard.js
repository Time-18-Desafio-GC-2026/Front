
/**
 * Protege o dashboard administrativo.
 * Somente usuários com o perfil "funcionario"
 * podem permanecer nesta página.
 */
(function verificarAcessoAdmin() {
    const sessaoAdmin = JSON.parse(
        localStorage.getItem("rbs_sessao") || "null"
    );

    if (!sessaoAdmin || sessaoAdmin.perfil !== "funcionario") {
        localStorage.removeItem("rbs_sessao");

        window.location.replace(
            "../Teladelogin/indexLogin.html"
        );
    }
})();
