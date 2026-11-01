
/**
 * Protege a área do patrocinador.
 * Somente usuários com o perfil "patrocinador"
 * e uma empresa vinculada podem acessar esta página.
 * INTEGRAÇÃO BACK-END: substituir a leitura local da sessão pela validação de sessão/token na API.
 */
(function verificarAcessoPatrocinador() {
    const sessao = JSON.parse(
        localStorage.getItem("rbs_sessao") || "null"
    );

    if (
        sessao?.perfil === "funcionario"
    ) {
        window.location.replace(
            "../index.html"
        );
        return;
    }

    if (
        !sessao ||
        sessao.perfil !== "patrocinador" ||
        !sessao.patrocinadorId
    ) {
        window.location.replace(
            "../../Teladelogin/indexLogin.html"
        );
    }
})();
