// Aguarda a página carregar antes de acessar os campos.
document.addEventListener('DOMContentLoaded', () => {
  var form = document.querySelector('form');
  var passwordInput = document.getElementById('password');
  var togglePassword = document.getElementById('toggle-password');

  // Alterna o campo entre texto visível e senha oculta.
  togglePassword.addEventListener('change', () => {
    passwordInput.type = togglePassword.checked ? 'text' : 'password';
  });

  // Abre o painel inicial quando o navegador valida os campos obrigatórios.
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    
    window.location.href = '../Telainicial/index.html';
  });
});
