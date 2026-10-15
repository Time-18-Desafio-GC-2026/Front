// Usa a conta autenticada da aba, sem misturar o e-mail da empresa.
var EMAIL_SESSION_KEY = "rbs_usuario_email";
var SESSION_KEY = "rbs_sessao";
var USERS_KEY = "rbs_usuarios";

document.addEventListener("DOMContentLoaded", () => {
    var session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    var email = sessionStorage.getItem(EMAIL_SESSION_KEY) || session?.email || "";
    var profileEmail = document.getElementById("profileEmail");
    var accountName = document.getElementById("accountName");
    var settingsWelcome = document.getElementById("settingsWelcome");
    var profileView = document.getElementById("profileView");
    var profileNav = document.getElementById("profileNav");
    var breadcrumbTitle = document.getElementById("breadcrumbTitle");
    var profileForm = document.getElementById("profileForm");
    var profileMessage = document.getElementById("profileMessage");
    var currentPasswordInput = document.getElementById("currentPassword");
    var newPasswordInput = document.getElementById("newPassword");
    var confirmPasswordInput = document.getElementById("confirmPassword");
    var forgotPasswordButton = document.getElementById("forgotPasswordButton");
    var logoutButton = document.getElementById("logoutButton");

    profileEmail.value = email;
    accountName.textContent = session?.nome || email || "Conta";

    // Abre o formulário de perfil selecionado no menu.
    function openProfile() {
        settingsWelcome.hidden = true;
        profileView.hidden = false;
        profileNav.classList.add("active");
        breadcrumbTitle.textContent = "Perfil";
    }

    profileNav.addEventListener("click", (event) => {
        event.preventDefault();
        openProfile();
        window.location.hash = "perfil";
    });

    if (window.location.hash === "#perfil") {
        openProfile();
    }

    // Confirma a saída antes de encerrar a sessão e abrir o login.
    logoutButton.addEventListener("click", () => {
        const confirmarSaida = window.confirm("Deseja realmente sair da plataforma?");

        if (!confirmarSaida) return;

        sessionStorage.removeItem(EMAIL_SESSION_KEY);
        localStorage.removeItem(SESSION_KEY);
        window.location.replace("../Teladelogin/indexLogin.html");
    });

    // Atualiza a senha da conta após conferir a senha atual e a confirmação.
    profileForm.addEventListener("submit", (event) => {
        event.preventDefault();
        profileMessage.textContent = "";

        var currentPassword = currentPasswordInput.value;
        var newPassword = newPasswordInput.value;
        var confirmPassword = confirmPasswordInput.value;

        if (!email) {
            profileMessage.textContent = "Não foi possível identificar a conta conectada.";
            return;
        }

        if (newPassword !== confirmPassword) {
            profileMessage.textContent = "A nova senha e a confirmação não coincidem.";
            return;
        }

        var users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
        var user = users.find((item) =>
            item.email.toLowerCase() === email.toLowerCase()
        );

        if (!user || user.senha !== currentPassword) {
            profileMessage.textContent = "A senha atual está incorreta ou a conta não foi encontrada.";
            return;
        }

        user.senha = newPassword;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        profileForm.reset();
        profileEmail.value = email;
        profileMessage.textContent = "Senha atualizada com sucesso.";
    });

    // Informa o destino de redefinição sem afirmar que um e-mail foi enviado.
    forgotPasswordButton.addEventListener("click", () => {
        if (!email) {
            profileMessage.textContent = "Não foi possível identificar o e-mail da conta.";
            return;
        }

        profileMessage.textContent =
            `As instruções para trocar a senha foram enviadas para ${email}. `
           ;
    });

});