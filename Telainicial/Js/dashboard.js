
document.addEventListener("DOMContentLoaded", function () {
    // =========================================================
    // 1. ELEMENTOS DO FORMULÁRIO DE PATROCINADORES
    // =========================================================

    const newSponsorButton = document.getElementById("newSponsorButton");
    const newSponsorForm = document.getElementById("newSponsorForm");
    const closeSponsorForm = document.getElementById("closeSponsorForm");
    const cancelSponsor = document.getElementById("cancelSponsor");
    const sponsorForm = document.getElementById("sponsorForm");

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

        sponsorForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const nome = document.getElementById("sponsorName").value.trim();
            const cnpj = document.getElementById("sponsorCnpj").value.trim();
            const email = document.getElementById("sponsorEmails").value.trim();
            const cota = document.getElementById("sponsorQuota").value;

            const inputArquivo =
                document.getElementById("sponsorComercialPlan");

            const arquivo = inputArquivo?.files?.[0];

            const dados = {
                nome: nome,
                cnpj: cnpj,
                email: email,
                cota: cota,
                arquivo: arquivo ? arquivo.name : ""
            };

            try {
                const idEdicao = sponsorForm.dataset.editandoId;

                if (idEdicao) {
                    editarPatrocinador(idEdicao, dados);

                    alert("Patrocinador atualizado com sucesso!");

                    delete sponsorForm.dataset.editandoId;
                } else {
                    cadastrarPatrocinador(dados);

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

            sessionStorage.removeItem("rbs_usuario_email");
            localStorage.removeItem("rbs_sessao");

            window.location.replace(
                "../Teladelogin/indexLogin.html"
            );
        });
    }
});
