// Monta os links da sidebar conforme o perfil ativo e a localização da página.
// INTEGRAÇÃO BACK-END: obter o perfil pelo contexto de autenticação da API, não pela sessão local.
(function () {
    const scriptUrl = document.currentScript?.src;
    if (!scriptUrl) {
        console.error("Não foi possível localizar o script de navegação lateral.");
        return;
    }

    const portalRoot = new URL("../", scriptUrl);
    const navigation = document.querySelector(".sidebar .main-nav");
    if (!navigation) return;

    let session = null;
    try {
        session = JSON.parse(localStorage.getItem("rbs_sessao") || "null");
    } catch (error) {
        console.error("Não foi possível identificar o perfil da sessão:", error);
    }

    const isAdmin = session?.perfil === "funcionario";
    const isSponsor = session?.perfil === "patrocinador";
    const routes = {
        dashboard: isSponsor
            ? "TelaPatrocinador/indexPatrocinador.html"
            : "../Telainicial/index.html#dashboard",
        reports: "../Telarelatorio/indexRelatorio.html",
        audit: "../Telahistorico/index.html",
        faq: "faq.html",
        profile: "../teladeconfig/indexconfig.html#perfil"
    };
    const icons = {
        dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
        reports: '<path d="M4 19V9M10 19V5M16 19v-8M22 19H2"/>',
        audit: '<path d="M12 3l8 3v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
        faq: '<path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="9"/>',
        profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
        logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>'
    };

    function createLink(label, route, icon) {
        const link = document.createElement("a");
        link.className = "nav-item";
        link.href = new URL(route, portalRoot).href;
        const currentPath = window.location.pathname.replace(/\/+$/, "").toLowerCase();
        const linkPath = new URL(link.href).pathname.replace(/\/+$/, "").toLowerCase();
        const isCompanyDetail = currentPath.endsWith("/telainicial/detalhes-patrocinador.html");
        const isDashboardPage = icon === "dashboard" && linkPath.endsWith("/telainicial/index.html");
        if (linkPath === currentPath || (isCompanyDetail && isDashboardPage)) {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
        }

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("aria-hidden", "true");
        svg.innerHTML = icons[icon];

        const text = document.createElement("span");
        text.textContent = label;
        link.append(svg, text);
        return link;
    }

    const heading = document.createElement("span");
    heading.className = "nav-label";
    heading.textContent = "NAVEGAÇÃO";

    const items = [
        createLink("Dashboard", routes.dashboard, "dashboard"),
        createLink("Relatórios", routes.reports, "reports")
    ];

    if (!isSponsor) {
        items.push(createLink("Auditoria", routes.audit, "audit"));
    }

    items.push(
        createLink("FAQ", routes.faq, "faq"),
        createLink("Perfil", routes.profile, "profile")
    );

    const logout = document.createElement("button");
    logout.className = "nav-item nav-item-button";
    logout.id = "logoutButton";
    logout.type = "button";
    const logoutIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    logoutIcon.setAttribute("viewBox", "0 0 24 24");
    logoutIcon.setAttribute("aria-hidden", "true");
    logoutIcon.innerHTML = icons.logout;
    const logoutText = document.createElement("span");
    logoutText.textContent = "Sair";
    logout.append(logoutIcon, logoutText);
    items.push(logout);

    navigation.replaceChildren(heading, ...items);
})();
