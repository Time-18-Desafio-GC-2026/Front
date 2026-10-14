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
  });
});
