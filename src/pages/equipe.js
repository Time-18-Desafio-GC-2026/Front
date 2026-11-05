/**
 * ==========================================================================
 * PORTAL RBS — CONTROLADOR DE GESTÃO DA EQUIPE RBS (EXCLUSIVO SUPERADMIN)
 * ==========================================================================
 */
const SENHA_PADRAO_ADMINS_KEY = "rbs_senha_padrao_admins";

document.addEventListener("DOMContentLoaded", async function () {
    const inputSenhaPadrao = document.getElementById("defaultAdminPassword");
    const btnTogglePwd = document.getElementById("btnToggleDefaultPwd");
    const btnCopiarSenha = document.getElementById("btnCopiarSenhaPadrao");
    const feedbackSenha = document.getElementById("feedbackSenhaPadrao");
    const formLote = document.getElementById("formCriarAdminsLote");
    const inputEmails = document.getElementById("adminEmailsList");
    const msgCriar = document.getElementById("msgCriarAdmins");
    const btnSubmit = document.getElementById("btnSubmitAdmins");
    const tbody = document.getElementById("tabelaEquipeRows");

    const senhaSalva = localStorage.getItem(SENHA_PADRAO_ADMINS_KEY);
    if (senhaSalva && inputSenhaPadrao) {
        inputSenhaPadrao.value = senhaSalva;
    }

    inputSenhaPadrao?.addEventListener("input", () => {
        const val = inputSenhaPadrao.value.trim();
        if (val.length >= 8) {
            localStorage.setItem(SENHA_PADRAO_ADMINS_KEY, val);
        }
    });

    btnTogglePwd?.addEventListener("click", () => {
        const mostrar = inputSenhaPadrao.type === "password";
        inputSenhaPadrao.type = mostrar ? "text" : "password";
        btnTogglePwd.textContent = mostrar ? "Ocultar" : "Mostrar";
        btnTogglePwd.setAttribute("aria-pressed", String(mostrar));
    });

    btnCopiarSenha?.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(inputSenhaPadrao.value.trim());
            if (feedbackSenha) {
                feedbackSenha.textContent = "Copiada!";
                setTimeout(() => { feedbackSenha.textContent = ""; }, 2000);
            }
        } catch {
            alert(`Senha padrão: ${inputSenhaPadrao.value.trim()}`);
        }
    });

    function extrairEmailsUnicos(texto) {
        return [...new Set(
            String(texto || "")
                .split(/[\s,;]+/)
                .map(e => e.trim().toLowerCase())
                .filter(Boolean)
        )];
    }

    function formatarDataHoraAcesso(isoString) {
        if (!isoString) return "Nunca acessou";
        const d = new Date(isoString);
        return Number.isNaN(d.getTime()) ? "Nunca acessou" : d.toLocaleString("pt-BR");
    }

    async function carregarEquipeRbs() {
        if (!tbody) return;
        try {
            const [todosUsuarios, logsAuditoria] = await Promise.all([
                apiRequest("/usuarios", "GET").catch(() => []),
                apiRequest("/auditoria", "GET").catch(() => [])
            ]);

            const equipe = (todosUsuarios || []).filter(
                u => u.perfil === "SUPERADMIN" || u.perfil === "ADMIN"
            );

            // Mapa com o último LOGIN_REALIZADO por e-mail/nome nos logs como complemento
            const mapaUltimoLogin = {};
            (logsAuditoria || []).forEach(log => {
                if (log.acao === "LOGIN_REALIZADO" && log.atorNome) {
                    const chave = String(log.atorNome).toLowerCase();
                    if (!mapaUltimoLogin[chave]) {
                        mapaUltimoLogin[chave] = log.criadoEm;
                    }
                }
            });

            tbody.replaceChildren();

            if (equipe.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4">Nenhum administrador encontrado.</td></tr>`;
                return;
            }

            equipe.forEach(admin => {
                const tr = document.createElement("tr");
                const ehSuper = admin.perfil === "SUPERADMIN";

                const tdNome = document.createElement("td");
                tdNome.innerHTML = `<strong>${admin.nome || admin.email}</strong>`;

                const tdEmail = document.createElement("td");
                tdEmail.textContent = admin.email;

                const tdPerfil = document.createElement("td");
                tdPerfil.textContent = ehSuper ? "SUPERADMIN" : "ADMIN RBS";

                const ultimoLog =
                    mapaUltimoLogin[String(admin.email).toLowerCase()] ||
                    mapaUltimoLogin[String(admin.nome || "").toLowerCase()] ||
                    admin.primeiroAcessoEm;

                const tdUltimoAcesso = document.createElement("td");
                tdUltimoAcesso.textContent = admin.precisaTrocarSenha
                    ? "Pendente (1º acesso não realizado)"
                    : formatarDataHoraAcesso(ultimoLog);

                tr.append(tdNome, tdEmail, tdPerfil, tdUltimoAcesso);
                tbody.appendChild(tr);
            });
        } catch (erro) {
            console.error("Erro ao listar equipe RBS:", erro);
            tbody.innerHTML = `<tr><td colspan="4">Erro ao carregar equipe: ${erro.message}</td></tr>`;
        }
    }

    formLote?.addEventListener("submit", async (event) => {
        event.preventDefault();
        msgCriar.textContent = "";
        const senhaPadrao = inputSenhaPadrao.value.trim();
        const emails = extrairEmailsUnicos(inputEmails.value);

        if (senhaPadrao.length < 8) {
            msgCriar.textContent = "A senha padrão precisa ter pelo menos 8 caracteres (letras e números).";
            return;
        }
        if (emails.length === 0) {
            msgCriar.textContent = "Informe pelo menos um e-mail válido.";
            return;
        }

        localStorage.setItem(SENHA_PADRAO_ADMINS_KEY, senhaPadrao);
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Cadastrando equipe...";

        let criados = 0;
        const erros = [];

        for (const email of emails) {
            const prefixoEmail = email.split("@")[0];
            try {
                await apiRequest("/admins", "POST", {
                    email,
                    nome: prefixoEmail,
                    senhaInicial: senhaPadrao
                });
                criados++;
            } catch (erro) {
                erros.push(`${email}: ${erro.message}`);
            }
        }

        btnSubmit.disabled = false;
        btnSubmit.textContent = "Cadastrar Administradores na Plataforma";

        if (criados > 0 && erros.length === 0) {
            formLote.reset();
            msgCriar.textContent = `${criados} administrador(es) cadastrado(s) com sucesso usando a senha padrão!`;
        } else if (criados > 0 && erros.length > 0) {
            msgCriar.textContent = `${criados} criado(s). Avisos: ${erros.join(" | ")}`;
        } else {
            msgCriar.textContent = `Não foi possível cadastrar: ${erros.join(" | ")}`;
        }

        await carregarEquipeRbs();
    });

    await carregarEquipeRbs();
});