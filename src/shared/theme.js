/**
 * ==========================================================================
 * PORTAL RBS — GERENCIADOR DE TEMA CLARO / ESCURO (SRP)
 * ==========================================================================
 */
(function inicializarGerenciadorDeTema() {
    const STORAGE_KEY = "rbs_theme";
    const DEFAULT_THEME = "light";

    function obterTemaSalvo() {
        try {
            return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : DEFAULT_THEME;
        } catch {
            return DEFAULT_THEME;
        }
    }

    function aplicarTema(tema) {
        const isDark = tema === "dark";
        document.documentElement.setAttribute("data-theme", tema);
        if (document.body) {
            document.body.setAttribute("data-theme", tema);
        }

        // Troca a logo da Sidebar conforme o tema ativo
        const logoSidebar = document.querySelector(".sidebar-brand .brand-mark");
        if (logoSidebar) {
            const logoTema = isDark ? logoSidebar.dataset.themeDark : logoSidebar.dataset.themeLight;
            logoSidebar.src = logoTema || (isDark
                ? "../assets/img/LogoPlanetaBlue.png"
                : "../assets/img/LogoPlanetaOrange.png");
        }

        // Atualiza todos os botões de alternância na tela
        document.querySelectorAll("[data-theme-toggle]").forEach((botao) => {
            botao.setAttribute("aria-pressed", String(isDark));
            botao.title = isDark ? "Ativar tema claro" : "Ativar tema escuro";
            botao.setAttribute("aria-label", isDark ? "Ativar tema claro" : "Alternar tema");
            botao.innerHTML = isDark
                ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 0 1 11.2 3a9 9 0 1 0 9.8 9.8Z"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>'
                : '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
        });
    }

    function alternarTema() {
        const temaAtual = document.documentElement.getAttribute("data-theme") || DEFAULT_THEME;
        const proximoTema = temaAtual === "dark" ? "light" : "dark";
        try {
            localStorage.setItem(STORAGE_KEY, proximoTema);
        } catch {
            // Ignora bloqueios de armazenamento privado
        }
        aplicarTema(proximoTema);
    }

    // Define no <html> imediatamente para evitar piscar a tela clara (FOUC)
    document.documentElement.setAttribute("data-theme", obterTemaSalvo());

    // Expõe função global para que o layout.js vincule o botão após renderizar a Topbar
    window.vincularControlesDeTema = function () {
        aplicarTema(obterTemaSalvo());
        document.querySelectorAll("[data-theme-toggle]").forEach((botao) => {
            if (!botao.dataset.listenerVinculado) {
                botao.addEventListener("click", alternarTema);
                botao.dataset.listenerVinculado = "true";
            }
        });
    };

    document.addEventListener("DOMContentLoaded", window.vincularControlesDeTema);
})();