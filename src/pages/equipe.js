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
    const inputNomeSetor = document.getElementById("adminDefaultName");
    const msgCriar = document.getElementById("msgCriarAdmins");
    const btnSubmit = document.getElementById("btnSubmitAdmins");
    const tbody = document.getElementById("tabelaEquipeRows");

    // Recupera a senha padrão configurada pelo Superadmin (ou usa Rbs@2026Admin)
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

    async function carregarEquipeRbs() {
        if (!tbody) return;
        try {
            const todosUsuarios = (await apiRequest("/usuarios", "GET")) || [];
            const equipe = todosUsuarios.filter(
                u => u.perfil === "SUPERADMIN" || u.perfil === "ADMIN"
            );

            tbody.replaceChildren();

            if (equipe.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5">Nenhum administrador encontrado.</td></tr>`;
                return;
            }

            equipe.forEach(admin => {
                const tr = document.createElement("tr");
                const ehSuper = admin.perfil === "SUPERADMIN";

                const tdNome = document.createElement("td");
                tdNome.innerHTML = `<strong>${admin.nome || "Admin RBS"}</strong>`;

                const tdEmail = document.createElement("td");
                tdEmail.textContent = admin.email;

                const tdPerfil = document.createElement("td");
                tdPerfil.textContent = ehSuper ? "SUPERADMIN (Dono)" : "ADMIN RBS";

                const tdStatus = document.createElement("td");
                tdStatus.textContent = admin.ativo
                    ? (admin.precisaTrocarSenha ? "Ativo (Senha padrão)" : "Ativo")
                    : "Desativado";

                const tdAcoes = document.createElement("td");

                if (ehSuper) {
                    tdAcoes.innerHTML = `<small style="color:#64748b;">Conta principal protegida</small>`;
                } else {
                    const divBotoes = document.createElement("div");
                    divBotoes.style.display = "flex";
                    divBotoes.style.gap = "6px";
                    divBotoes.style.flexWrap = "wrap";

                    const btnReset = document.createElement("button");
                    btnReset.type = "button";
                    btnReset.className = "history-filter-reset";
                    btnReset.textContent = "Resetar p/ Senha Padrão";
                    btnReset.addEventListener("click", async () => {
                        const senhaPadrao = inputSenhaPadrao.value.trim() || "Rbs@2026Admin";
                        if (!window.confirm(`Resetar a senha de "${admin.email}" para a senha padrão (${senhaPadrao})?`)) return;
                        try {
                            await apiRequest(`/usuarios/${admin.id}/resetar-senha`, "POST", {
                                novaSenhaTemporaria: senhaPadrao
                            });
                            alert(`Senha de ${admin.email} resetada para: ${senhaPadrao}`);
                            await carregarEquipeRbs();
                        } catch (erro) {
                            alert(erro.message || "Erro ao resetar senha.");
                        }
                    });

                    const btnToggleAtivo = document.createElement("button");
                    btnToggleAtivo.type = "button";
                    btnToggleAtivo.className = "history-filter-reset";
                    btnToggleAtivo.textContent = admin.ativo ? "Desativar" : "Reativar";
                    btnToggleAtivo.addEventListener("click", async () => {
                        const acao = admin.ativo ? "desativar" : "reativar";
                        try {
                            await apiRequest(`/usuarios/${admin.id}/${acao}`, "POST");
                            await carregarEquipeRbs();
                        } catch (erro) {
                            alert(erro.message || `Erro ao ${acao} administrador.`);
                        }
                    });

                    divBotoes.append(btnReset, btnToggleAtivo);

                    if (!admin.ativo) {
                        const btnExcluir = document.createElement("button");
                        btnExcluir.type = "button";
                        btnExcluir.className = "faq-delete-button";
                        btnExcluir.textContent = "Excluir";
                        btnExcluir.addEventListener("click", async () => {
                            if (!window.confirm(`Excluir permanentemente o administrador ${admin.email}?`)) return;
                            try {
                                await apiRequest(`/usuarios/${admin.id}`, "DELETE");
                                await carregarEquipeRbs();
                            } catch (erro) {
                                alert(erro.message || "Erro ao excluir.");
                            }
                        });
                        divBotoes.appendChild(btnExcluir);
                    }

                    tdAcoes.appendChild(divBotoes);
                }

                tr.append(tdNome, tdEmail, tdPerfil, tdStatus, tdAcoes);
                tbody.appendChild(tr);
            });
        } catch (erro) {
            console.error("Erro ao listar equipe RBS:", erro);
            tbody.innerHTML = `<tr><td colspan="5">Erro ao carregar equipe: ${erro.message}</td></tr>`;
        }
    }

    formLote?.addEventListener("submit", async (event) => {
        event.preventDefault();
        msgCriar.textContent = "";
        const senhaPadrao = inputSenhaPadrao.value.trim();
        const emails = extrairEmailsUnicos(inputEmails.value);
        const nomeBase = inputNomeSetor.value.trim();

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
            const nomeAdmin = nomeBase ? `${nomeBase} (${prefixoEmail})` : prefixoEmail;
            try {
                await apiRequest("/admins", "POST", {
                    email,
                    nome: nomeAdmin,
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
            msgCriar.textContent = `✅ ${criados} administrador(es) cadastrado(s) com sucesso usando a senha padrão!`;
        } else if (criados > 0 && erros.length > 0) {
            msgCriar.textContent = `⚠️ ${criados} criado(s). Avisos: ${erros.join(" | ")}`;
        } else {
            msgCriar.textContent = `❌ Não foi possível cadastrar: ${erros.join(" | ")}`;
        }

        await carregarEquipeRbs();
    });

    await carregarEquipeRbs();
});