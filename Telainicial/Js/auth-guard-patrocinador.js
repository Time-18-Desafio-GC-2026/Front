
/**
 * Protege a área do patrocinador.
 * Somente usuários com o perfil "patrocinador"
 * e uma empresa vinculada podem acessar esta página.
 */
(function verificarAcessoPatrocinador() {
    const sessao = JSON.parse(
        localStorage.getItem("rbs_sessao") || "null"
    );

    if (
        !sessao ||
        sessao.perfil !== "patrocinador" ||
        !sessao.patrocinadorId
    ) {
        localStorage.removeItem("rbs_sessao");

        window.location.replace(
            "../Teladelogin/indexLogin.html"
        );
    }
})();
