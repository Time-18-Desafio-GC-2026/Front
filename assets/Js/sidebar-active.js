// Destaca na navegação lateral o link correspondente à página aberta.
(function () {
    const currentPath = new URL(window.location.href).pathname.replace(/\/+$/, "").toLowerCase();
    const isCompanyDetail = currentPath.endsWith("/telainicial/detalhes-patrocinador.html");

    document.querySelectorAll(".sidebar .main-nav a.nav-item").forEach((link) => {
        const linkPath = new URL(link.href, window.location.href).pathname.replace(/\/+$/, "").toLowerCase();
        const isDashboardPage = linkPath.endsWith("/telainicial/index.html");
        const isCurrentPage = linkPath === currentPath || (isCompanyDetail && isDashboardPage);

        link.classList.toggle("active", isCurrentPage);
        if (isCurrentPage) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
})();
