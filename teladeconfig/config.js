
// Gerencia os dados do perfil, as atualizações de conta e o encerramento da sessão.
// INTEGRAÇÃO BACK-END: substituir leitura/gravação de usuário e sessão locais por endpoints autenticados.
var EMAIL_SESSION_KEY = "rbs_usuario_email";
var SESSION_KEY = "rbs_sessao";
var USERS_KEY = "rbs_usuarios";

document.addEventListener("DOMContentLoaded", function () {

    document.querySelectorAll(".toggle-password").forEach(button => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.target);

        if (!input) return;

        const mostrar = input.type === "password";

        input.type = mostrar ? "text" : "password";
        button.textContent = mostrar ? "Ocultar" : "Mostrar";
        button.setAttribute("aria-label",
            `${mostrar ? "Ocultar" : "Mostrar"} senha`
        );
        button.setAttribute("aria-pressed", String(mostrar));
    });
});

    const session = JSON.parse(
        localStorage.getItem(SESSION_KEY) || "null"
    );

    const users = JSON.parse(
        localStorage.getItem(USERS_KEY) || "[]"
    );

    const emailSessao =
        sessionStorage.getItem(EMAIL_SESSION_KEY) ||
        session?.email ||
        "";

    // Localiza a conta pelo ID da sessão ou pelo e-mail.
    const localizarUsuario = (lista, sessao, email) => {
        return lista.find(item =>
            sessao?.usuarioId &&
            String(item.id) === String(sessao.usuarioId)
        ) || lista.find(item =>
            email &&
            item.email?.toLowerCase() === email.toLowerCase()
        );
    };

    const currentUser = localizarUsuario(
        users,
        session,
        emailSessao
    );

    const email = currentUser?.email || emailSessao;

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

    // Preenche os dados do perfil.
    if (profileEmail) profileEmail.value = email;
    
    const displayName =
        currentUser?.nome || session?.nome || email || "Conta";

    if (profileUsername) profileUsername.value = displayName;
    if (accountName) accountName.textContent = displayName;

    // Abre a seção Perfil.
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

    // Atualiza o nome de usuário.
    if (usernameForm) {
        usernameForm.addEventListener("submit", function (event) {
            event.preventDefault();
            usernameMessage.textContent = "";

            const newName = profileUsername.value.trim();

            if (!newName) {
                usernameMessage.textContent =
                    "Informe um nome de usuário.";
                return;
            }

            const listaUsuarios = JSON.parse(
                localStorage.getItem(USERS_KEY) || "[]"
            );

            const user = localizarUsuario(
                listaUsuarios,
                session,
                email
            );

            if (!user) {
                usernameMessage.textContent =
                    "Não foi possível encontrar a conta conectada.";
                return;
            }

            const previousName = user.nome || user.email || email;

            if (previousName === newName) {
                usernameMessage.textContent =
                    "O nome de usuário não foi alterado.";
                return;
            }

            user.nome = newName;

            try {
                localStorage.setItem(
                    USERS_KEY,
                    JSON.stringify(listaUsuarios)
                );

                const updatedSession = JSON.parse(
                    localStorage.getItem(SESSION_KEY) || "null"
                );

                if (updatedSession) {
                    updatedSession.nome = newName;

                    if (!updatedSession.email && user.email) {
                        updatedSession.email = user.email;
                    }

                    localStorage.setItem(
                        SESSION_KEY,
                        JSON.stringify(updatedSession)
                    );
                }

                if (user.email) {
                    sessionStorage.setItem(
                        EMAIL_SESSION_KEY,
                        user.email
                    );
                }

                if (accountName) {
                    accountName.textContent = newName;
                }

                document.querySelectorAll("[data-account-name]")
                    .forEach(element => {
                        element.textContent = newName;
                    });

                const initials = newName
                    .split(/\s+/)
                    .slice(0, 2)
                    .map(part => part[0])
                    .join("")
                    .toUpperCase();

                document.querySelectorAll("[data-account-avatar]")
                    .forEach(element => {
                        element.textContent = initials;
                    });

                try {
                    if (typeof registrarHistorico === "function") {
                        registrarHistorico(
                            `Nome de usuário alterado de "${previousName}" para "${newName}".`,
                            user.email || email
                        );
                    }

                    usernameMessage.textContent =
                        "Nome atualizado com sucesso.";
                } catch (error) {
                    console.error(
                        "Erro ao registrar o histórico:",
                        error
                    );

                    usernameMessage.textContent =
                        "Nome atualizado, mas não foi possível registrar o histórico.";
                }
            } catch (error) {
                console.error("Erro ao salvar o nome:", error);

                usernameMessage.textContent =
                    "Não foi possível salvar o nome. Verifique o armazenamento.";
            }
        });
    }

    // Encerra a sessão.
    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            const confirmar = window.confirm(
                "Deseja realmente sair da plataforma?"
            );

            if (!confirmar) return;

            if (typeof registrarHistorico === "function") {
                registrarHistorico(
                    "Encerrou a sessão.",
                    currentUser?.email || email
                );
            }
            sessionStorage.removeItem(EMAIL_SESSION_KEY);
            localStorage.removeItem(SESSION_KEY);

            window.location.replace(
                "../Teladelogin/indexLogin.html"
            );
        });
    }

    // Atualiza a senha.
    if (profileForm) {
        profileForm.addEventListener("submit", function (event) {
            event.preventDefault();
            profileMessage.textContent = "";

            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (!email) {
                profileMessage.textContent =
                    "Não foi possível identificar a conta conectada.";
                return;
            }

            if (newPassword.length < 6) {
                profileMessage.textContent =
                    "A nova senha deve ter pelo menos 6 caracteres.";
                return;
            }

            if (newPassword !== confirmPassword) {
                profileMessage.textContent =
                    "A nova senha e a confirmação não coincidem.";
                return;
            }

            const listaUsuarios = JSON.parse(
                localStorage.getItem(USERS_KEY) || "[]"
            );

            const user = localizarUsuario(
                listaUsuarios,
                session,
                email
            );

            if (!user || user.senha !== currentPassword) {
                profileMessage.textContent =
                    "A senha atual está incorreta ou a conta não foi encontrada.";
                return;
            }

            try {
                user.senha = newPassword;

                localStorage.setItem(
                    USERS_KEY,
                    JSON.stringify(listaUsuarios)
                );

                profileForm.reset();
                profileEmail.value = user.email || email;

                profileMessage.textContent =
                    "Senha atualizada com sucesso.";

                try {
                    if (typeof registrarHistorico === "function") {
                        registrarHistorico(
                            "Senha da conta alterada.",
                            user.email || email
                        );
                    }
                } catch (error) {
                    console.error(
                        "Erro ao registrar a alteração de senha:",
                        error
                    );
                }
            } catch (error) {
                console.error("Erro ao salvar a senha:", error);

                profileMessage.textContent =
                    "Não foi possível atualizar a senha.";
            }
        });
    }

    // Orienta o usuário sobre a recuperação de senha.
    if (forgotPasswordButton) {
        forgotPasswordButton.addEventListener("click", function () {
            if (!email) {
                profileMessage.textContent =
                    "Não foi possível identificar o e-mail da conta.";
                return;
            }

            profileMessage.textContent =
                `A recuperação de senha por e-mail ainda precisa ser implementada para ${email}.`;

            if (typeof registrarHistorico === "function") {
                registrarHistorico(
                    "Consultou a opção de recuperação de senha.",
                    currentUser?.email || email
                );
            }
        });
    }
});
