
document.addEventListener("DOMContentLoaded", function () {
    // INTEGRAÇÃO BACK-END: criar e editar patrocinadores deve chamar a API, não persistir no navegador.
    // =========================================================
    // 1. ELEMENTOS DO FORMULÁRIO DE PATROCINADORES
    // =========================================================

    const newSponsorButton = document.getElementById("newSponsorButton");
    const newSponsorForm = document.getElementById("newSponsorForm");
    const closeSponsorForm = document.getElementById("closeSponsorForm");
    const cancelSponsor = document.getElementById("cancelSponsor");
    const sponsorForm = document.getElementById("sponsorForm");
    const parametrosUrl = new URLSearchParams(window.location.search);
    const idParaEditar = parametrosUrl.get("editar");
    const idParaVoltar = parametrosUrl.get("voltarParaEmpresa");
    const retornarParaDetalheId = idParaEditar === idParaVoltar ? idParaVoltar : null;

    function lerFotoEmpresa(arquivo) {
        if (!arquivo) return Promise.resolve("");
        if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) {
            return Promise.reject(new Error("A foto deve estar no formato JPG, PNG ou WEBP."));
        }
        if (arquivo.size > 2 * 1024 * 1024) {
            return Promise.reject(new Error("A foto deve ter no máximo 2 MB."));
        }

        return new Promise((resolve, reject) => {
            const leitor = new FileReader();
            leitor.addEventListener("load", () => {
                if (typeof leitor.result === "string") {
                    resolve(leitor.result);
                } else {
                    reject(new Error("Não foi possível ler a foto selecionada."));
                }
            });
            leitor.addEventListener("error", () => {
                reject(new Error("Não foi possível ler a foto selecionada."));
            });
            leitor.readAsDataURL(arquivo);
        });
    }

    /**
     * Fecha o formulário e atualiza o estado acessível do botão.
     */
    function closeForm() {
        if (!newSponsorForm || !newSponsorButton) return;

        newSponsorForm.classList.remove("open");
        newSponsorButton.setAttribute("aria-expanded", "false");
    }

    // =========================================================
    // 2. ABRIR E FECHAR O FORMULÁRIO
    // =========================================================

    if (newSponsorButton && newSponsorForm) {
        // O formulário começa fechado ao carregar a página.
        closeForm();

        newSponsorButton.addEventListener("click", function () {
            const isOpen = newSponsorForm.classList.toggle("open");

            newSponsorButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });

        closeSponsorForm?.addEventListener("click", closeForm);
        cancelSponsor?.addEventListener("click", closeForm);

        // Fecha ao clicar fora, exceto ao iniciar uma edição.
        document.addEventListener("click", function (event) {
            const clicouFora =
                !newSponsorForm.parentElement.contains(event.target);

            const clicouEmEditar =
                event.target.closest(".botao-editar");

            if (clicouFora && !clicouEmEditar) {
                closeForm();
            }
        });
    }

    // =========================================================
    // 3. CADASTRAR OU EDITAR PATROCINADORES
    // =========================================================

    if (sponsorForm) {
        const submitButton = sponsorForm.querySelector(
            "[type='submit']"
        );

        const tituloFormulario = newSponsorForm?.querySelector("h3");

        sponsorForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const nome = document.getElementById("sponsorName").value.trim();
            const cnpj = document.getElementById("sponsorCnpj").value.trim();
            const email = document.getElementById("sponsorEmails").value.trim();
            const cota = document.getElementById("sponsorQuota").value;

            const inputArquivo =
                document.getElementById("sponsorComercialPlan");

            const arquivo = inputArquivo?.files?.[0];

            try {
                const fotoEmpresa = await lerFotoEmpresa(
                    document.getElementById("sponsorPhoto")?.files?.[0]
                );
                const dados = {
                    nome: nome,
                    cnpj: cnpj,
                    email: email,
                    cota: cota,
                    arquivo: arquivo ? arquivo.name : "",
                    foto: fotoEmpresa
                };
                const idEdicao = sponsorForm.dataset.editandoId;

                if (idEdicao) {
                    const patrocinadorAtualizado = editarPatrocinador(idEdicao, dados);

                    if (typeof registrarHistorico === "function") {
                        registrarHistorico(
                            `Admin RBS editou o cadastro da empresa "${patrocinadorAtualizado.nome}".`
                        );
                    } else {
                        console.error("Registro de auditoria indisponível ao editar patrocinador.");
                    }

                    alert("Patrocinador atualizado com sucesso!");

                    delete sponsorForm.dataset.editandoId;
                } else {
                    const novoPatrocinador = cadastrarPatrocinador(dados);

                    registrarHistorico(
                        `Admin RBS cadastrou a empresa "${novoPatrocinador.nome}".`
                    );

                    alert("Patrocinador cadastrado com sucesso!");
                }

                sponsorForm.reset();
                closeForm();

                if (submitButton) {
                    submitButton.textContent = "Cadastrar patrocinador";
                }

                if (tituloFormulario) {
                    tituloFormulario.textContent = "Novo patrocinador";
                }

                if (idEdicao && retornarParaDetalheId === idEdicao) {
                    const detalheUrl = new URL("detalhes-patrocinador.html", window.location.href);
                    detalheUrl.searchParams.set("id", idEdicao);
                    window.location.replace(detalheUrl.href);
                    return;
                }

                renderizarPatrocinadores();
            } catch (erro) {
                console.error("Erro ao salvar patrocinador:", erro);

                alert(
                    erro.message ||
                    "Não foi possível salvar o patrocinador."
                );
            }
        });
    }

    // =========================================================
    // 4. ENCERRAR A SESSÃO
    // =========================================================

    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            const confirmar = window.confirm(
                "Deseja realmente sair da plataforma?"
            );

            if (!confirmar) return;

            registrarHistorico("Encerrou a sessão da equipe RBS.");
            sessionStorage.removeItem("rbs_usuario_email");
            localStorage.removeItem("rbs_sessao");

            window.location.replace(
                "../Teladelogin/indexLogin.html"
            );
        });
    }

    if (idParaEditar) {
        abrirEdicaoPatrocinador(idParaEditar);
        const url = new URL(window.location.href);
        url.searchParams.delete("editar");
        url.searchParams.delete("voltarParaEmpresa");
        window.history.replaceState(window.history.state, "", url);
    }

});
