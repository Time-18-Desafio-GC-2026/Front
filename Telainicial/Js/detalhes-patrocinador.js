document.addEventListener("DOMContentLoaded", function () {
    const patrocinadorId = new URLSearchParams(window.location.search).get("id");
    const atualizarDetalhe = () => renderizarDetalhePatrocinador(patrocinadorId);
    atualizarDetalhe();
    observarAtualizacoesPatrocinadores(atualizarDetalhe);

    document.getElementById("backToDashboard").addEventListener("click", function () {
        const dashboardUrl = new URL("index.html", window.location.href);
        const paginaAnterior = document.referrer ? new URL(document.referrer) : null;

        if (
            paginaAnterior &&
            paginaAnterior.origin === window.location.origin &&
            paginaAnterior.pathname === dashboardUrl.pathname
        ) {
            window.history.back();
            return;
        }

        window.location.href = `${dashboardUrl.href}#dashboard`;
    });

    document.getElementById("logoutButton").addEventListener("click", function () {
        if (!window.confirm("Deseja realmente sair da plataforma?")) return;
        sessionStorage.removeItem("rbs_usuario_email");
        localStorage.removeItem("rbs_sessao");
        window.location.replace("../Teladelogin/indexLogin.html");
    });
});
