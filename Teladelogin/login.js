<<<<<<< HEAD
// Aguarda a página carregar antes de acessar os campos.
document.addEventListener('DOMContentLoaded', () => {
  var form = document.querySelector('form');
  var emailInput = document.getElementById('email');
  var passwordInput = document.getElementById('password');
  var togglePassword = document.getElementById('toggle-password');

  // Alterna o campo entre texto visível e senha oculta.
  togglePassword.addEventListener('change', () => {
    passwordInput.type = togglePassword.checked ? 'text' : 'password';
  });

  // Abre o painel inicial quando o navegador valida os campos obrigatórios.
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    // Mantém a conta ativa nesta aba, separada do e-mail cadastrado da empresa.
    sessionStorage.setItem('rbs_usuario_email', emailInput.value.trim());
    window.location.href = '../Telainicial/index.html';
=======

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("toggle-password");

  // Alterna entre mostrar e ocultar a senha.
  togglePassword.addEventListener("change", () => {
    passwordInput.type = togglePassword.checked ? "text" : "password";
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const senha = passwordInput.value;

    // Recupera as contas cadastradas.
    const usuarios = JSON.parse(
      localStorage.getItem("rbs_usuarios") || "[]"
    );

    // Busca a conta correspondente às credenciais.
    const usuario = usuarios.find((u) =>
      u.email.toLowerCase() === email &&
      u.senha === senha
    );

    if (!usuario) {
      alert("E-mail ou senha inválidos.");
      return;
    }

    // Verifica o perfil e registra os dados da sessão.
    if (usuario.perfil === "funcionario") {
      localStorage.setItem("rbs_sessao", JSON.stringify({
        usuarioId: usuario.id,
        nome: usuario.nome,
        perfil: usuario.perfil
      }));

      window.location.href = "../Telainicial/index.html";
      return;
    }

    if (
      usuario.perfil === "patrocinador" &&
      usuario.patrocinadorId
    ) {
      const patrocinadores = JSON.parse(
        localStorage.getItem("rbs_patrocinadores") || "[]"
      );

      // Confirma se a empresa vinculada à conta existe.
      const patrocinador = patrocinadores.find(
        (p) => String(p.id) === String(usuario.patrocinadorId)
      );

      if (!patrocinador) {
        alert("A conta não está vinculada a um patrocinador válido.");
        return;
      }

      localStorage.setItem("rbs_sessao", JSON.stringify({
        usuarioId: usuario.id,
        nome: usuario.nome,
        perfil: usuario.perfil,
        patrocinadorId: patrocinador.id
      }));

      window.location.href = "../Telainicial/indexPatrocinador.html";
      return;
    }

    alert("Perfil de usuário inválido.");
>>>>>>> origin/main
  });
});
