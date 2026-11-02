// Alterna os temas claro/escuro, atualiza os controles e salva a preferência.
(function () {
    const STORAGE_KEY = "rbs_theme";
    const defaultTheme = "light";

    function getTheme() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored === "dark" ? "dark" : defaultTheme;
        } catch (error) {
            return defaultTheme;
        }
    }

    function setTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        if (document.body) {
            document.body.setAttribute("data-theme", theme);
        }
        document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
            const dark = theme === "dark";
            button.setAttribute("aria-pressed", String(dark));
            button.title = dark ? "Ativar tema claro" : "Ativar tema escuro";
            button.setAttribute("aria-label", dark ? "Ativar tema claro" : "Alternar tema");
            button.innerHTML = dark
                ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 0 1 11.2 3a9 9 0 1 0 9.8 9.8Z"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>'
                : '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
        });
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
        const nextTheme = currentTheme === "dark" ? "light" : "dark";

        try {
            localStorage.setItem(STORAGE_KEY, nextTheme);
        } catch (error) {
            // Ignora falha de persistência do tema sem quebrar a UI.
        }

        setTheme(nextTheme);
    }

    function applyTheme() {
        const initialTheme = getTheme();
        setTheme(initialTheme);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            applyTheme();
            document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
                button.addEventListener("click", toggleTheme);
            });
        });
        return;
    }

    applyTheme();
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
        button.addEventListener("click", toggleTheme);
    });
})();
