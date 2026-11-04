/**
 * ==========================================================================
 * PORTAL RBS — COMPONENTE UNIFICADO DE LAYOUT (SIDEBAR + TOPBAR + CONTA)
 * ==========================================================================
 */
function inicializarLayoutPortal() {
    const sessao = JSON.parse(localStorage.getItem("rbs_sessao") || "null");
    if (!sessao) return;

    const perfil = String(sessao.perfil || "").toLowerCase();
    const ehPatrocinador = perfil === "patrocinador";
    const paginaAtual = window.location.pathname.split("/").pop() || "indexAdministrador.html";

    const titulosPaginas = {
        "indexAdministrador.html": "Dashboard",
        "detalhes-patrocinador.html": "Detalhes da empresa",
        "indexPatrocinador.html": "Dashboard",
        "indexRelatorio.html": "Relatórios",
        "indexHistorico.html": "Auditoria",
        "indexFaq.html": "FAQ",
        "indexPerfil.html": "Perfil"
    };

    const tituloBreadcrumb = titulosPaginas[paginaAtual] || "Dashboard";
    const linkDashboard = ehPatrocinador ? "indexPatrocinador.html" : "indexAdministrador.html#dashboard";
    const textoWorkspace = ehPatrocinador ? "Administração Cliente" : "Administração RBS";
    const textoSubtitulo = ehPatrocinador ? "Visão geral da sua marca" : "Visão geral da operação";
    const textoPermissao = ehPatrocinador
        ? "Acesso exclusivo aos materiais, cortesias e relatórios da sua marca."
        : "Acesso à gestão de todos os patrocinadores e cotas.";
    const textoEquipe = ehPatrocinador ? "Equipe Cliente" : "Equipe RBS";

    const isDashActive =
        paginaAtual === "indexAdministrador.html" ||
        paginaAtual === "detalhes-patrocinador.html" ||
        paginaAtual === "indexPatrocinador.html";
    const isRelActive = paginaAtual === "indexRelatorio.html";
    const isAudActive = paginaAtual === "indexHistorico.html";
    const isFaqActive = paginaAtual === "indexFaq.html";
    const isCfgActive = paginaAtual === "indexPerfil.html";

    const temaAtual = document.documentElement.getAttribute("data-theme") || "light";
    const logoInicial = temaAtual === "dark"
        ? "../assets/img/LogoPlanetaBlue.png"
        : "../assets/img/LogoPlanetaOrange.png";

    // 1. Renderiza a Sidebar padronizada em #sidebar
    const sidebarEl = document.getElementById("sidebar");
    if (sidebarEl) {
        sidebarEl.innerHTML = `
            <a class="sidebar-brand" href="${linkDashboard}">
                <img class="brand-mark" src="${logoInicial}" data-theme-light="../assets/img/LogoPlanetaOrange.png" data-theme-dark="../assets/img/LogoPlanetaBlue.png" alt="Planeta Atlântida">
                <div class="brand-copy">
                    <strong>Portal do Patrocinador</strong>
                </div>
            </a>

            <div class="workspace">
                <span class="eyebrow">ÁREA DE TRABALHO</span>
                <strong>${textoWorkspace}</strong>
                <span>${textoSubtitulo}</span>
            </div>

            <nav class="main-nav" aria-label="Navegação principal">
                <span class="nav-label">NAVEGAÇÃO</span>

                <a class="nav-item ${isDashActive ? "active" : ""}" id="dashboardNav" href="${linkDashboard}" ${isDashActive ? 'aria-current="page"' : ""}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="3" y="3" width="7" height="7" rx="1"/>
                        <rect x="14" y="3" width="7" height="7" rx="1"/>
                        <rect x="3" y="14" width="7" height="7" rx="1"/>
                        <rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                    <span>Dashboard</span>
                </a>

                <a class="nav-item ${isRelActive ? "active" : ""}" href="indexRelatorio.html" ${isRelActive ? 'aria-current="page"' : ""}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 19V9M10 19V5M16 19v-8M22 19H2"/>
                    </svg>
                    <span>Relatórios</span>
                </a>

                ${!ehPatrocinador ? `
                <a class="nav-item ${isAudActive ? "active" : ""}" href="indexHistorico.html" ${isAudActive ? 'aria-current="page"' : ""}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 3l8 3v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3z"/>
                        <path d="M9 12l2 2 4-4"/>
                    </svg>
                    <span>Auditoria</span>
                </a>
                ` : ""}

                <a class="nav-item ${isFaqActive ? "active" : ""}" href="indexFaq.html" ${isFaqActive ? 'aria-current="page"' : ""}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/>
                        <path d="M12 17h.01"/>
                        <circle cx="12" cy="12" r="9"/>
                    </svg>
                    <span>FAQ</span>
                </a>

                <a class="nav-item ${isCfgActive ? "active" : ""}" id="profileNav" href="indexPerfil.html#perfil" ${isCfgActive ? 'aria-current="page"' : ""}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="8" r="4"/>
                        <path d="M4 21a8 8 0 0 1 16 0"/>
                    </svg>
                    <span>Perfil</span>
                </a>

                <button class="nav-item nav-item-button" id="logoutButton" type="button">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M10 17l5-5-5-5M15 12H3"/>
                        <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>
                    </svg>
                    <span>Sair</span>
                </button>
            </nav>

            <div class="sidebar-note">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="6" y="10" width="12" height="10" rx="2"/>
                    <path d="M9 10V7a3 3 0 0 1 6 0v3"/>
                </svg>
                <span>${textoPermissao}</span>
            </div>
        `;
    }

    // 2. Renderiza a Topbar padronizada com o botão de Tema + Link de Perfil
    const topbarEl = document.querySelector("header.topbar");
    if (topbarEl) {
        topbarEl.innerHTML = `
            <div class="topbar-breadcrumb">
                <span class="breadcrumb">${textoWorkspace} <b>/</b> <span id="breadcrumbTitle">${tituloBreadcrumb}</span></span>
            </div>

            <div class="topbar-user">
                <button class="theme-toggle" type="button" data-theme-toggle aria-label="Alternar tema" aria-pressed="false" title="Alternar tema">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="4"/>
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
                    </svg>
                </button>

                <a class="topbar-user-link" href="indexPerfil.html#perfil" aria-label="Abrir perfil da conta">
                    <div class="user-text">
                        <strong id="accountName" data-account-name>Carregando...</strong>
                        <span id="accountRole">${textoEquipe}</span>
                    </div>
                    <div class="avatar" data-account-avatar aria-hidden="true">--</div>
                </a>
            </div>
        `;
    }

    // Vincula o botão de tema recém-criado ao gerenciador theme.js
    if (typeof window.vincularControlesDeTema === "function") {
        window.vincularControlesDeTema();
    }

    // 3. Atualiza imediatamente o Nome e o Avatar (Cache + Confirmação via GET /auth/eu)
    function aplicarNomeEAvatar(nome) {
        const nomeLimpo = String(nome || "Conta").trim();
        document.querySelectorAll("[data-account-name]").forEach(el => {
            el.textContent = nomeLimpo;
        });

        const iniciais = nomeLimpo
            .split(/\s+/)
            .slice(0, 2)
            .map(parte => parte[0])
            .join("")
            .toUpperCase();

        document.querySelectorAll("[data-account-avatar]").forEach(el => {
            el.textContent = iniciais || "US";
        });
    }

    aplicarNomeEAvatar(sessao.nome || sessao.email || "Usuário");

    if (typeof apiRequest === "function" && localStorage.getItem("rbs_token")) {
        apiRequest("/auth/eu", "GET")
            .then(eu => {
                if (eu && (eu.nome || eu.email)) {
                    const nomeReal = (eu.nome || eu.email).trim();
                    aplicarNomeEAvatar(nomeReal);
                    sessao.nome = nomeReal;
                    sessao.email = eu.email || sessao.email;
                    localStorage.setItem("rbs_sessao", JSON.stringify(sessao));
                }
            })
            .catch(() => { });
    }

    // 4. Comportamento unificado do botão Sair (Logout)
    const botaoLogout = document.getElementById("logoutButton");
    if (botaoLogout) {
        botaoLogout.addEventListener("click", function () {
            if (!window.confirm("Deseja realmente sair da plataforma?")) return;
            sessionStorage.removeItem("rbs_usuario_email");
            localStorage.removeItem("rbs_sessao");
            localStorage.removeItem("rbs_token");
            window.location.replace("indexLogin.html");
        });
    }
}

document.addEventListener("DOMContentLoaded", inicializarLayoutPortal);
window.addEventListener("storage", function (event) {
    if (event.key === "rbs_sessao") {
        inicializarLayoutPortal();
    }
});