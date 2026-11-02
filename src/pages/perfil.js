// teladeconfig/config.js
var EMAIL_SESSION_KEY = "rbs_usuario_email";
var SESSION_KEY = "rbs_sessao";

document.addEventListener("DOMContentLoaded", async function () {

    // 1. PROTEÇÃO DE SESSÃO E ADAPTAÇÃO DO MENU POR PERFIL
    const token = localStorage.getItem("rbs_token");
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");

    if (!token || !session) {
        window.location.replace("indexLogin.html");
        return;
    }

    // Se for Patrocinador, aponta o link de Dashboard para indexPatrocinador.html e oculta Auditoria
    if (session.perfil === "patrocinador") {
        const dashboardNav = document.getElementById("dashboardNav");
        const brandLink = document.querySelector(".sidebar-brand");
        const auditoriaLink = document.querySelector('a[href*="indexHistorico.html"]');
        const workspaceTitle = document.querySelector(".workspace strong");

        if (dashboardNav) dashboardNav.href = "indexPatrocinador.html";
        if (brandLink) brandLink.href = "indexPatrocinador.html";
        if (auditoriaLink) auditoriaLink.style.display = "none";
        if (workspaceTitle) workspaceTitle.textContent = "Administração Cliente";
    }

    // 2. BOTÃO DE MOSTRAR/OCULTAR SENHA
    document.querySelectorAll(".toggle-password").forEach(button => {
        button.addEventListener("click", () => {
            const input = document.getElementById(button.dataset.target);
            if (!input) return;

            const mostrar = input.type === "password";
            input.type = mostrar ? "text" : "password";
            button.textContent = mostrar ? "Ocultar" : "Mostrar";
            button.setAttribute("aria-label", `${mostrar ? "Ocultar" : "Mostrar"} senha`);
            button.setAttribute("aria-pressed", String(mostrar));
        });
    });

    const profileEmail = document.getElementById("profileEmail");
    const profileUsername = document.getElementById("profileUsername");
    const usernameForm = document.getElementById("usernameForm");
    const usernameMessage = document.getElementById("usernameMessage");
    const accountName = document.getElementById("accountName");
    const settingsWelcome = document.getElementById("settingsWelcome");
    const profileView = document.getElementById("profileView");
    const profileNav = document.getElementById("profileNav");
    const breadcrumbTitle = document.getElementById("breadcrumbTitle");
    const profileForm = document.getElementById("profileForm");
    const profileMessage = document.getElementById("profileMessage");
    const currentPasswordInput = document.getElementById("currentPassword");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const forgotPasswordButton = document.getElementById("forgotPasswordButton");
    const logoutButton = document.getElementById("logoutButton");

    // 3. BUSCA DADOS ATUALIZADOS DO USUÁRIO LOGADO NA API (GET /auth/eu)
    try {
        const meuUsuario = await apiRequest("/auth/eu", "GET");
        if (meuUsuario) {
            session.nome = meuUsuario.nome || meuUsuario.email;
            session.email = meuUsuario.email;
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        }
    } catch (e) {
        console.warn("Usando dados em cache da sessão:", e);
    }

    const email = session.email || sessionStorage.getItem(EMAIL_SESSION_KEY) || "";
    const displayName = session.nome || email || "Conta";

    if (profileEmail) profileEmail.value = email;
    if (profileUsername) profileUsername.value = displayName;
    if (accountName) accountName.textContent = displayName;

    function atualizarCabecalhoNome(novoNome) {
        if (accountName) accountName.textContent = novoNome;
        document.querySelectorAll("[data-account-name]").forEach(el => {
            el.textContent = novoNome;
        });
        const initials = novoNome
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0])
            .join("")
            .toUpperCase();
        document.querySelectorAll("[data-account-avatar]").forEach(el => {
            el.textContent = initials;
        });
    }

    atualizarCabecalhoNome(displayName);

    function openProfile() {
        if (settingsWelcome) settingsWelcome.hidden = true;
        if (profileView) profileView.hidden = false;
        if (profileNav) profileNav.classList.add("active");
        if (breadcrumbTitle) breadcrumbTitle.textContent = "Perfil";
    }

    if (profileNav) {
        profileNav.addEventListener("click", function (event) {
            event.preventDefault();
            openProfile();
            window.location.hash = "perfil";
        });
    }

    if (window.location.hash === "#perfil") {
        openProfile();
    }

    // 4. SALVAR NOME DE USUÁRIO NO SUPABASE (PATCH /auth/eu/nome)
    if (usernameForm) {
        usernameForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            usernameMessage.textContent = "";

            const newName = profileUsername.value.trim();
            if (!newName) {
                usernameMessage.textContent = "Informe um nome de usuário.";
                return;
            }

            try {
                const usuarioAtualizado = await apiRequest("/auth/eu/nome", "PATCH", {
                    nome: newName
                });

                const updatedSession = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
                if (updatedSession) {
                    updatedSession.nome = usuarioAtualizado.nome;
                    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
                }

                atualizarCabecalhoNome(usuarioAtualizado.nome);
                usernameMessage.textContent = "Nome atualizado com sucesso no banco de dados!";
            } catch (error) {
                console.error("Erro ao salvar o nome:", error);
                usernameMessage.textContent = error.message || "Não foi possível salvar o nome.";
            }
        });
    }

    // 5. ALTERAR SENHA NO SUPABASE (POST /auth/alterar-senha)
    if (profileForm) {
        profileForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            profileMessage.textContent = "";

            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (newPassword.length < 8) {
                profileMessage.textContent = "A nova senha deve ter pelo menos 8 caracteres (letras e números).";
                return;
            }

            if (newPassword !== confirmPassword) {
                profileMessage.textContent = "A nova senha e a confirmação não coincidem.";
                return;
            }

            try {
                const sessaoNova = await apiRequest("/auth/alterar-senha", "POST", {
                    senhaAtual: currentPassword,
                    novaSenha: newPassword
                });

                // Atualiza o Token JWT com a nova sessão gerada pelo Back-end
                if (sessaoNova && sessaoNova.tokenJwt) {
                    localStorage.setItem("rbs_token", sessaoNova.tokenJwt);
                }

                profileForm.reset();
                if (profileEmail) profileEmail.value = email;
                profileMessage.textContent = "Senha atualizada com sucesso no banco de dados!";
            } catch (error) {
                console.error("Erro ao atualizar senha:", error);
                profileMessage.textContent = error.message || "Não foi possível atualizar a senha.";
            }
        });
    }

    // 6. ORIENTAÇÃO DE ESQUECI SENHA
    if (forgotPasswordButton) {
        forgotPasswordButton.addEventListener("click", function () {
            profileMessage.textContent = `Solicite o reset da sua senha para a administração RBS informando o e-mail ${email}.`;
        });
    }

    // 7. LOGOUT LIMPO
    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            if (!window.confirm("Deseja realmente sair da plataforma?")) return;

            sessionStorage.removeItem(EMAIL_SESSION_KEY);
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem("rbs_token");

            window.location.replace("indexLogin.html");
        });
    }
});

