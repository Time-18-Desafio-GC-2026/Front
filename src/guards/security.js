/**
 * ==========================================================================
 * PORTAL RBS — GUARDIÃO CENTRAL DE SEGURANÇA E ISOLAMENTO DE PERFIL (DRY)
 * ==========================================================================
 * Regras aplicadas:
 * 1. Exige Token JWT válido (rbs_token) e sessão ativa (rbs_sessao).
 * 2. ADMIN / FUNCIONÁRIO: Pode acessar indexAdministrador.html, indexRelatorio.html,
 *    indexHistorico.html e indexPerfil.html. Se tentar abrir indexPatrocinador.html,
 *    é redirecionado para indexAdministrador.html.
 * 3. PATROCINADOR: Exige patrocinadorId (marcaId) vinculado. Pode acessar apenas
 *    indexPatrocinador.html, indexRelatorio.html e indexPerfil.html.
 *    Se tentar abrir indexAdministrador.html (Admin) ou indexHistorico.html (Auditoria),
 *    é redirecionado imediatamente para indexPatrocinador.html.
 */
(function verificarIsolamentoDeSeguranca() {
    const token = localStorage.getItem("rbs_token");
    const sessao = JSON.parse(localStorage.getItem("rbs_sessao") || "null");

    function expulsarParaLogin() {
        localStorage.removeItem("rbs_token");
        localStorage.removeItem("rbs_sessao");
        sessionStorage.removeItem("rbs_usuario_email");
        window.location.replace("indexLogin.html");
    }

    if (!token || !sessao || !sessao.perfil) {
        expulsarParaLogin();
        return;
    }

    const perfil = String(sessao.perfil).toLowerCase();
    const ehPatrocinador = perfil === "patrocinador";
    const ehFuncionario = perfil === "funcionario" || perfil === "admin" || perfil === "superadmin";

    if (!ehPatrocinador && !ehFuncionario) {
        expulsarParaLogin();
        return;
    }

    // Patrocinador obrigatoriamente precisa ter uma marca vinculada (isolamento de tenant)
    if (ehPatrocinador && !sessao.patrocinadorId) {
        expulsarParaLogin();
        return;
    }

    const paginaAtual = window.location.pathname.split("/").pop() || "";

    // Bloqueia Patrocinador de tentar acessar o Dashboard Geral RBS ou a Auditoria Geral
    if (ehPatrocinador && (paginaAtual === "indexAdministrador.html" || paginaAtual === "indexHistorico.html")) {
        window.location.replace("indexPatrocinador.html");
        return;
    }

    // Redireciona Admin caso tente abrir a visão exclusiva de cliente
    if (ehFuncionario && paginaAtual === "indexPatrocinador.html") {
        window.location.replace("indexAdministrador.html");
        return;
    }
})();
