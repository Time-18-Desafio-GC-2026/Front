// Aguarda o formulário carregar antes de registrar suas interações.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("toggle-password");
  const USERS_KEY = "rbs_usuarios";
  const PATROCINADORES_KEY = "rbs_patrocinadores";

  // INTEGRAÇÃO BACK-END: remover as contas de demonstração e carregar usuários pela API.
  const DEFAULT_USERS = [
    {
      id: "usuario-admin-padrao",
      nome: "Administrador RBS",
      email: "adm1@gmail.com",
      senha: "adm123",
      perfil: "funcionario"
    },
    {
      id: "usuario-patrocinador-padrao",
      nome: "Patrocinador RBS",
      email: "patrocinador1@gmail.com",
      senha: "patrocinador123",
      perfil: "patrocinador",
      patrocinadorId: "patrocinador-1"
    }
  ];

  const DEFAULT_PATROCINADORES = [
    {
      id: "patrocinador-1",
      nome: "Minha Empresa",
      cota: "Master",
      email: "patrocinador1@gmail.com"
    }
  ];

  // INTEGRAÇÃO BACK-END: substituir esta validação local de credenciais pelo endpoint de autenticação.
  const usuariosExistentes = JSON.parse(
    localStorage.getItem(USERS_KEY) || "[]"
  );

  const usuariosAtualizados = [...usuariosExistentes];

  DEFAULT_USERS.forEach((usuarioPadrao) => {
    const jaExiste = usuariosAtualizados.some(
      (usuario) => usuario.email?.toLowerCase() === usuarioPadrao.email.toLowerCase()
    );

    if (!jaExiste) {
      usuariosAtualizados.push(usuarioPadrao);
    }
  });

  if (usuariosAtualizados.length !== usuariosExistentes.length) {
    localStorage.setItem(USERS_KEY, JSON.stringify(usuariosAtualizados));
  }

  const patrocinadoresExistentes = JSON.parse(
    localStorage.getItem(PATROCINADORES_KEY) || "[]"
  );

  const patrocinadoresAtualizados = [...patrocinadoresExistentes];

  DEFAULT_PATROCINADORES.forEach((patrocinadorPadrao) => {
    const jaExiste = patrocinadoresAtualizados.some(
      (patrocinador) => String(patrocinador.id) === String(patrocinadorPadrao.id)
    );

    if (!jaExiste) {
      patrocinadoresAtualizados.push(patrocinadorPadrao);
    }
  });

  if (patrocinadoresAtualizados.length !== patrocinadoresExistentes.length) {
    localStorage.setItem(PATROCINADORES_KEY, JSON.stringify(patrocinadoresAtualizados));
  }

  // Alterna entre mostrar e ocultar a senha.
  togglePassword.addEventListener("change", () => {
    passwordInput.type = togglePassword.checked ? "text" : "password";
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = emailInput.value.trim().toLowerCase().replace("@gamil.com", "@gmail.com");
    const senha = passwordInput.value;

    // Recupera as contas cadastradas no armazenamento local do protótipo.
    // INTEGRAÇÃO BACK-END: consultar a API de autenticação; nunca validar senhas no navegador.
    const usuarios = JSON.parse(
      localStorage.getItem("rbs_usuarios") || "[]"
    );

    // Confere as credenciais antes de abrir uma sessão.
    const usuario = usuarios.find((conta) =>
      (conta.email || "").toLowerCase().replace("@gamil.com", "@gmail.com") === email &&
      conta.senha === senha
    );

    if (!usuario) {
      if (typeof registrarHistorico === "function") {
        registrarHistorico("Tentativa de login malsucedida.", email);
      }
      alert("E-mail ou senha inválidos.");
      return;
    }

    // INTEGRAÇÃO BACK-END: trocar esta sessão local pelo mecanismo de sessão/token da API.
    // Mantém o e-mail do ator por aba, separado do contato da empresa.
    sessionStorage.setItem("rbs_usuario_email", usuario.email);

    if (usuario.perfil === "funcionario") {
      localStorage.setItem("rbs_sessao", JSON.stringify({
        usuarioId: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      }));

      if (typeof registrarHistorico === "function") {
        registrarHistorico("Entrou na plataforma como equipe RBS.", usuario.email);
      }

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

      // Confirma se a conta está vinculada a uma empresa existente.
      const patrocinador = patrocinadores.find(
        (empresa) => String(empresa.id) === String(usuario.patrocinadorId)
      );

      if (!patrocinador) {
        if (typeof registrarHistorico === "function") {
          registrarHistorico(
            "Tentativa de login bloqueada: conta sem patrocinador válido.",
            usuario.email
          );
        }
        alert("A conta não está vinculada a um patrocinador válido.");
        return;
      }

      localStorage.setItem("rbs_sessao", JSON.stringify({
        usuarioId: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        patrocinadorId: patrocinador.id
      }));

      if (typeof registrarHistorico === "function") {
        registrarHistorico("Entrou na plataforma como patrocinador.", usuario.email);
      }

      window.location.href = "../Telainicial/TelaPatrocinador/indexPatrocinador.html";
      return;
    }

    if (typeof registrarHistorico === "function") {
      registrarHistorico("Tentativa de login bloqueada: perfil inválido.", usuario.email);
    }
    alert("Perfil de usuário inválido.");
  });
});
