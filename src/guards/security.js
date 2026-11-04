/**
 * ==========================================================================
 * PORTAL RBS — GUARDIÃO CENTRAL DE SEGURANÇA E ISOLAMENTO DE PERFIL (DRY)
 * ==========================================================================
 * Regras aplicadas:
 * 1. Exige Token JWT válido e sessão ativa.
 * 2. ADMIN / FUNCIONÁRIO: Pode acessar telas de Admin. Redirecionado se abrir tela de cliente.
 * 3. PATROCINADOR: Exige marcaId. Acessa apenas sua visão.
 * 4. SUPERADMIN: Acesso exclusivo à Gestão de Equipe (indexEquipe.html).
 * 5. COTA MASTER: Acesso exclusivo à Pesquisa de Ativação (indexPesquisa.html).
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
    const perfilApi = String(sessao.perfilApi || "").toUpperCase();
    const ehPatrocinador = perfil === "patrocinador";
    const ehFuncionario = perfil === "funcionario" || perfil === "admin" || perfil === "superadmin";

    // Novas variáveis de controle para as telas exclusivas
    const ehSuperAdmin = perfilApi === "SUPERADMIN";
    const ehCotaMaster = String(sessao.marcaCota || "").toUpperCase() === "MASTER";

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

    // 1. Gestão de Equipe RBS: exclusiva para SUPERADMIN
    if (paginaAtual === "indexEquipe.html" && !ehSuperAdmin) {
        window.location.replace(ehPatrocinador ? "indexPatrocinador.html" : "indexAdministrador.html");
        return;
    }

    // 2. Pesquisa de Ativação: exclusiva para Equipe RBS e Patrocinadores da Cota MASTER
    if (paginaAtual === "indexPesquisa.html" && ehPatrocinador && !ehCotaMaster) {
        window.location.replace("indexPatrocinador.html");
        return;
    }

    // 3. Bloqueia Patrocinador de tentar acessar o Dashboard Geral RBS, Detalhes Admin ou Auditoria
    if (
        ehPatrocinador &&
        (paginaAtual === "indexAdministrador.html" ||
            paginaAtual === "detalhes-patrocinador.html" ||
            paginaAtual === "indexHistorico.html")
    ) {
        window.location.replace("indexPatrocinador.html");
        return;
    }

    // 4. Redireciona Admin caso tente abrir a visão exclusiva de cliente
    if (ehFuncionario && paginaAtual === "indexPatrocinador.html") {
        window.location.replace("indexAdministrador.html");
        return;
    }
})();