/**
 * ==========================================================================
 * PORTAL RBS — COMPONENTE UNIFICADO DE LAYOUT (SIDEBAR + TOPBAR + CONTA)
 * ==========================================================================
 */
function inicializarLayoutPortal() {
    const sessao = JSON.parse(localStorage.getItem("rbs_sessao") || "null");
    if (!sessao) return;

    const perfil = String(sessao.perfil || "").toLowerCase();
    const perfilApi = String(sessao.perfilApi || "").toUpperCase();
    const ehPatrocinador = perfil === "patrocinador";
    const ehSuperAdmin = perfilApi === "SUPERADMIN";
    const ehPatrocinadorMaster = ehPatrocinador && String(sessao.marcaCota || "").toUpperCase() === "MASTER";
    const podeVerPesquisa = !ehPatrocinador || ehPatrocinadorMaster;

    const paginaAtual = window.location.pathname.split("/").pop() || "indexAdministrador.html";

    const titulosPaginas = {
        "indexAdministrador.html": "Dashboard",
        "detalhes-patrocinador.html": "Detalhes da empresa",
        "indexPatrocinador.html": "Dashboard",
        "indexPesquisa.html": "Pesquisa de Ativação",
        "indexRelatorio.html": "Relatórios",
        "indexHistorico.html": "Auditoria",
        "indexEquipe.html": "Equipe RBS",
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
    const textoEquipe = ehSuperAdmin ? "SuperAdmin RBS" : (ehPatrocinador ? "Equipe Cliente" : "Equipe RBS");

    const isDashActive =
        paginaAtual === "indexAdministrador.html" ||
        paginaAtual === "detalhes-patrocinador.html" ||
        paginaAtual === "indexPatrocinador.html";
    const isPesqActive = paginaAtual === "indexPesquisa.html";
    const isRelActive = paginaAtual === "indexRelatorio.html";
    const isAudActive = paginaAtual === "indexHistorico.html";
    const isEqpActive = paginaAtual === "indexEquipe.html";
    const isFaqActive = paginaAtual === "indexFaq.html";
    const isCfgActive = paginaAtual === "indexPerfil.html";

    const logoInicial = "../assets/img/LogoPlanetaOrange.png";

    const sidebarEl = document.getElementById("sidebar");
    if (sidebarEl) {
        sidebarEl.innerHTML = `
            <a class="sidebar-brand" href="${linkDashboard}">
                <img class="brand-mark" src="${logoInicial}" data-theme-light="../assets/img/LogoPlanetaOrange.png">
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
                ${podeVerPesquisa ? `
                <a class="nav-item ${isPesqActive ? "active" : ""}" href="indexPesquisa.html" ${isPesqActive ? 'aria-current="page"' : ""}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9 11l3 3L22 4"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                    <span>Pesquisa</span>
                </a>
                ` : ""}
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
                ${ehSuperAdmin ? `
                <a class="nav-item ${isEqpActive ? "active" : ""}" href="indexEquipe.html" ${isEqpActive ? 'aria-current="page"' : ""}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span>Equipe RBS</span>
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
                </a>
            </div>
        `;
    }

    if (typeof apiRequest === "function" && localStorage.getItem("rbs_token")) {
        apiRequest("/auth/eu", "GET")
            .then(eu => {
                if (eu && (eu.nome || eu.email)) {
                    const nomeReal = (eu.nome || eu.email).trim();
                    const mudouCotaOuPerfil =
                        (eu.marcaCota && eu.marcaCota !== sessao.marcaCota) ||
                        (eu.perfil && eu.perfil !== sessao.perfilApi);
                    sessao.nome = nomeReal;
                    sessao.email = eu.email || sessao.email;
                    if (eu.perfil) sessao.perfilApi = eu.perfil;
                    if (eu.marcaCota) sessao.marcaCota = eu.marcaCota;
                    localStorage.setItem("rbs_sessao", JSON.stringify(sessao));
                    if (mudouCotaOuPerfil) {
                        inicializarLayoutPortal();
                    }
                }
            })
            .catch(() => { });
    }

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