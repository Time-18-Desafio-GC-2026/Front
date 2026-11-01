
/**
 * =========================================================
 * PORTAL RBS — ÁREA DO PATROCINADOR
 * =========================================================
 *
 * Responsabilidades:
 * - Controlar o formulário de envio.
 * - Identificar a empresa vinculada à sessão.
 * - Exibir a categoria de patrocínio.
 * - Carregar os materiais publicados pela RBS.
 * - Registrar envios e encerrar a sessão.
 *
 * Dependências:
 * - patrocinadores.js
 * - account-display.js
 */

// INTEGRAÇÃO BACK-END: carregar perfil, empresa e mídias a partir da API; substituir a sessão local.
document.addEventListener("DOMContentLoaded", function () {

    // =======================================================
    // 1. ELEMENTOS DA INTERFACE
    // =======================================================

    const botaoNovoEnvio = document.getElementById("newSponsorButton");
    const formularioContainer = document.getElementById("newSponsorForm");
    const botaoFechar = document.getElementById("closeSponsorForm");
    const botaoCancelar = document.getElementById("cancelSponsor");
    const formularioEnvio = document.getElementById("sponsorForm");
    const botaoLogout = document.getElementById("logoutButton");

    const mensagemPatrocinador =
        document.getElementById("mensagemPatrocinador");

    const nomeEmpresa =
        document.getElementById("nomePatrocinador");

    const campoEmail =
        document.getElementById("sponsorActorEmail");

    const secaoMateriais =
        document.getElementById("materiaisPublicadosRBS");

    const listaMateriais =
        document.getElementById("listaMateriaisRBS");

    // =======================================================
    // 2. SESSÃO E EMPRESA VINCULADA
    // =======================================================

    const sessao = JSON.parse(
        localStorage.getItem("rbs_sessao") || "null"
    );

    // A empresa selecionada vem da sessão autenticada.
    let patrocinadorSelecionado = null;

    if (campoEmail) {
        campoEmail.value =
            sessionStorage.getItem("rbs_usuario_email") ||
            sessao?.email ||
            "";
    }

    if (sessao?.patrocinadorId) {
        patrocinadorSelecionado = listarPatrocinadores().find(
            empresa =>
                String(empresa.id) ===
                String(sessao.patrocinadorId)
        );
    }

    // =======================================================
    // 3. IDENTIFICAÇÃO DA EMPRESA E DA COTA
    // =======================================================

    function carregarDadosPatrocinador() {
        if (!patrocinadorSelecionado) {
            if (mensagemPatrocinador) {
                mensagemPatrocinador.textContent =
                    "Não foi possível localizar sua empresa.";
            }

            if (secaoMateriais) {
                secaoMateriais.hidden = true;
            }

            if (botaoNovoEnvio) {
                botaoNovoEnvio.disabled = true;
            }

            return;
        }

        const patrocinador = patrocinadorSelecionado;

        if (nomeEmpresa) {
            nomeEmpresa.textContent = patrocinador.nome;
        }

        const cota = String(
            patrocinador.cota || "Não informada"
        ).trim();

        const cotaNormalizada = cota.toLowerCase();

        const tituloCota = document.getElementById("tituloCota");
        const detalheCota = document.getElementById("detalheCota");

        if (tituloCota) {
            tituloCota.textContent =
                `Sua empresa faz parte da cota ${cota}`;
        }

        if (mensagemPatrocinador) {
            mensagemPatrocinador.textContent =
                cotaNormalizada === "master"
                    ? "Você possui a categoria de patrocínio Master."
                    : `Sua categoria de patrocínio é ${cota}.`;
        }

        if (detalheCota) {
            detalheCota.classList.toggle(
                "destaque-master",
                cotaNormalizada === "master"
            );
        }

        renderizarMateriaisPublicados(patrocinador.id);
    }

    // =======================================================
    // 4. MATERIAIS PUBLICADOS PELA RBS
    // =======================================================

    function renderizarMateriaisPublicados(patrocinadorId) {
        if (!secaoMateriais || !listaMateriais) return;

        listaMateriais.replaceChildren();

        const todosMateriais = JSON.parse(
            localStorage.getItem("rbs_midia_rbs") || "[]"
        );

        // Exibe somente os materiais da empresa autenticada.
        const materiais = todosMateriais.filter(
            item =>
                String(item.patrocinadorId) ===
                String(patrocinadorId)
        );

        if (materiais.length === 0) {
            const mensagem = document.createElement("p");

            mensagem.textContent =
                "Nenhum relatório ou link publicado pela RBS.";

            listaMateriais.appendChild(mensagem);
        } else {
            materiais.forEach(function (material) {
                const item = document.createElement("div");

                item.className = "material-publicado-item";

                const link = document.createElement("a");

                link.target = "_blank";
                link.rel = "noopener noreferrer";

                if (
                    material.tipo === "relatorio" &&
                    material.arquivoData
                ) {
                    link.href = material.arquivoData;

                    link.textContent =
                        "Relatório: " + material.nome;

                    link.download =
                        material.nome || "relatorio";

                } else if (
                    material.tipo === "link" &&
                    material.url
                ) {
                    link.href = material.url;
                    link.textContent = material.url;

                } else {
                    return;
                }

                item.appendChild(link);
                listaMateriais.appendChild(item);
            });
        }

        secaoMateriais.hidden = false;
    }

    // =======================================================
    // 5. ABERTURA E FECHAMENTO DO FORMULÁRIO
    // =======================================================

    function fecharFormulario() {
        if (!formularioContainer || !botaoNovoEnvio) return;

        formularioContainer.classList.remove("open");

        botaoNovoEnvio.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    if (botaoNovoEnvio && formularioContainer) {
        // O formulário começa fechado.
        fecharFormulario();

        botaoNovoEnvio.addEventListener("click", function () {
            if (!patrocinadorSelecionado) return;

            const aberto =
                formularioContainer.classList.toggle("open");

            botaoNovoEnvio.setAttribute(
                "aria-expanded",
                String(aberto)
            );
        });

        botaoFechar?.addEventListener(
            "click",
            fecharFormulario
        );

        botaoCancelar?.addEventListener(
            "click",
            fecharFormulario
        );

        document.addEventListener("click", function (event) {
            const clicouFora =
                !formularioContainer.contains(event.target) &&
                !botaoNovoEnvio.contains(event.target);

            if (clicouFora) {
                fecharFormulario();
            }
        });
    }

    // =======================================================
    // 6. ENVIO DE TEXTO E ARQUIVO
    // =======================================================

    if (formularioEnvio) {
        formularioEnvio.addEventListener(
            "submit",
            function (event) {
                event.preventDefault();

                if (!patrocinadorSelecionado) {
                    alert(
                        "Identifique um patrocinador antes de enviar materiais."
                    );

                    return;
                }

                const texto = document
                    .getElementById("sponsorTexto")
                    .value.trim();

                const arquivoInput =
                    document.getElementById("sponsorArchive");

                const arquivo = arquivoInput?.files?.[0];

                try {
                    // Limite do protótipo: 1 MB por arquivo.
                    if (arquivo && arquivo.size > 1024 * 1024) {
                        throw new Error(
                            "O arquivo deve ter no máximo 1 MB."
                        );
                    }

                    cadastrarEnvio(
                        patrocinadorSelecionado.id,
                        {
                            texto: texto,
                            arquivo: arquivo
                                ? arquivo.name
                                : null
                        }
                    );

                    alert("Envio registrado com sucesso!");

                    formularioEnvio.reset();
                    fecharFormulario();

                } catch (erro) {
                    console.error(
                        "Erro ao enviar material:",
                        erro
                    );

                    alert(
                        erro.message ||
                        "Não foi possível registrar o envio."
                    );
                }
            }
        );
    }

    // =======================================================
    // 7. ENCERRAMENTO DA SESSÃO
    // =======================================================

    if (botaoLogout) {
        botaoLogout.addEventListener("click", function () {
            const confirmar = window.confirm(
                "Deseja realmente sair da plataforma?"
            );

            if (!confirmar) return;

            registrarHistorico(
                "Encerrou a sessão de patrocinador.",
                sessionStorage.getItem("rbs_usuario_email")
            );
            sessionStorage.removeItem("rbs_usuario_email");
            localStorage.removeItem("rbs_sessao");

            window.location.replace(
                "../../Teladelogin/indexLogin.html"
            );
        });
    }

    // =======================================================
    // 8. INICIALIZAÇÃO DA PÁGINA
    // =======================================================

    carregarDadosPatrocinador();
});
