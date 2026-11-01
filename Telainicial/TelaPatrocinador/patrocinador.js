
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

    const listaEnviosPatrocinador =
        document.getElementById("listaEnviosPatrocinador");

    const secaoEnviosPatrocinador =
        document.getElementById("enviosPatrocinador");

    const urlsDownloadConteudo = new Set();

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
        renderizarEnviosPatrocinador(patrocinador.id);
    }

    function renderizarEnviosPatrocinador(patrocinadorId) {
        if (!listaEnviosPatrocinador) return;

        if (secaoEnviosPatrocinador) {
            secaoEnviosPatrocinador.hidden = false;
        }

        urlsDownloadConteudo.forEach(url => URL.revokeObjectURL(url));
        urlsDownloadConteudo.clear();
        listaEnviosPatrocinador.replaceChildren();

        const envios = listarEnviosPorPatrocinador(patrocinadorId)
            .slice()
            .reverse();

        if (envios.length === 0) {
            const vazio = document.createElement("p");
            vazio.className = "envios-patrocinador-vazio";
            vazio.textContent = "Você ainda não enviou conteúdos.";
            listaEnviosPatrocinador.appendChild(vazio);
            return;
        }

        envios.forEach(function (envio) {
            const item = document.createElement("article");
            item.className = "envio-patrocinador-item";

            if (envio.texto) {
                const texto = document.createElement("p");
                texto.className = "envio-patrocinador-texto";
                texto.textContent = envio.texto;
                item.appendChild(texto);

                const baixarTexto = document.createElement("a");
                baixarTexto.className = "envio-patrocinador-download";
                const urlTexto = URL.createObjectURL(
                    new Blob([envio.texto], {
                        type: "text/plain;charset=utf-8"
                    })
                );
                urlsDownloadConteudo.add(urlTexto);
                baixarTexto.href = urlTexto;
                baixarTexto.download = `conteudo-enviado-${envio.id}.txt`;
                baixarTexto.textContent = "Baixar conteúdo (.txt)";
                item.appendChild(baixarTexto);
            }

            if (envio.arquivo) {
                const arquivoLegado = typeof envio.arquivo !== "object";
                const nomeArquivo = arquivoLegado
                    ? String(envio.arquivo)
                    : envio.arquivo.nome || "Arquivo enviado";

                const arquivo = document.createElement("p");
                arquivo.className = "envio-patrocinador-arquivo";
                arquivo.textContent = arquivoLegado
                    ? `Arquivo: ${nomeArquivo} (envio antigo; arquivo não disponível para baixar)`
                    : `Arquivo: ${nomeArquivo}`;
                item.appendChild(arquivo);

                if (!arquivoLegado && envio.arquivo.arquivoData) {
                    const baixarArquivo = document.createElement("a");
                    baixarArquivo.className = "envio-patrocinador-download";
                    baixarArquivo.href = envio.arquivo.arquivoData;
                    baixarArquivo.download = nomeArquivo;
                    baixarArquivo.textContent = "Baixar mídia";
                    item.appendChild(baixarArquivo);
                } else if (!arquivoLegado) {
                    arquivo.textContent +=
                        " (arquivo não disponível para baixar)";
                }
            }

            const detalhes = document.createElement("p");
            detalhes.className = "envio-patrocinador-detalhes";

            const dataEnvio = new Date(envio.criadoEm);
            const dataFormatada = Number.isNaN(dataEnvio.getTime())
                ? "Data não informada"
                : dataEnvio.toLocaleString("pt-BR");

            detalhes.textContent =
                `Status: ${envio.status || "Pendente"} - Enviado em: ${dataFormatada}`;
            item.appendChild(detalhes);

            listaEnviosPatrocinador.appendChild(item);
        });
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

                const titulo = document.createElement("p");
                titulo.className = "material-publicado-titulo";
                const acoes = document.createElement("div");
                acoes.className = "material-publicado-acoes";

                if (material.tipo === "relatorio") {
                    titulo.textContent = material.nome || "Relatório";

                    if (material.arquivoData) {
                        const visualizar = document.createElement("a");
                        visualizar.href = material.arquivoData;
                        visualizar.target = "_blank";
                        visualizar.rel = "noopener noreferrer";
                        visualizar.textContent = "Visualizar";
                        acoes.appendChild(visualizar);

                        const baixar = document.createElement("a");
                        baixar.href = material.arquivoData;
                        baixar.download = material.nome || "relatorio";
                        baixar.textContent = "Baixar arquivo";
                        acoes.appendChild(baixar);
                    } else {
                        titulo.textContent += " (arquivo indisponível)";
                    }

                } else if (
                    material.tipo === "link" &&
                    material.url
                ) {
                    let endereco;

                    try {
                        endereco = new URL(material.url);
                    } catch {
                        titulo.textContent =
                            `Publicação indisponível: ${material.url}`;
                        item.appendChild(titulo);
                        listaMateriais.appendChild(item);
                        return;
                    }

                    if (!["http:", "https:"].includes(endereco.protocol)) {
                        titulo.textContent =
                            `Publicação indisponível: ${material.url}`;
                        item.appendChild(titulo);
                        listaMateriais.appendChild(item);
                        return;
                    }

                    titulo.textContent = endereco.href;

                    const abrir = document.createElement("a");
                    abrir.href = endereco.href;
                    abrir.target = "_blank";
                    abrir.rel = "noopener noreferrer";
                    abrir.textContent = "Abrir publicação";
                    acoes.appendChild(abrir);

                } else {
                    return;
                }

                item.append(titulo, acoes);
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
            async function (event) {
                event.preventDefault();

                const botaoEnviar = formularioEnvio.querySelector(
                    "button[type='submit']"
                );
                botaoEnviar.disabled = true;

                try {
                    if (!patrocinadorSelecionado) {
                        throw new Error(
                            "Identifique um patrocinador antes de enviar materiais."
                        );
                    }

                    const texto = document
                        .getElementById("sponsorTexto")
                        .value.trim();

                    const arquivoInput =
                        document.getElementById("sponsorArchive");

                    const arquivo = arquivoInput?.files?.[0];

                    if (!texto && !arquivo) {
                        throw new Error(
                            "Informe um conteúdo ou selecione um arquivo para enviar."
                        );
                    }

                    // Limite do protótipo: 1 MB por arquivo.
                    if (arquivo && arquivo.size > 1024 * 1024) {
                        throw new Error(
                            "O arquivo deve ter no máximo 1 MB."
                        );
                    }

                    const arquivoEnviado = arquivo
                        ? {
                            nome: arquivo.name,
                            tipo: arquivo.type,
                            arquivoData: await new Promise(
                                function (resolve, reject) {
                                    const leitor = new FileReader();

                                    leitor.onload = function () {
                                        if (typeof leitor.result === "string") {
                                            resolve(leitor.result);
                                        } else {
                                            reject(
                                                new Error(
                                                    "Não foi possível ler o arquivo selecionado."
                                                )
                                            );
                                        }
                                    };

                                    leitor.onerror = function () {
                                        reject(
                                            leitor.error ||
                                            new Error(
                                                "Não foi possível ler o arquivo selecionado."
                                            )
                                        );
                                    };

                                    leitor.onabort = function () {
                                        reject(
                                            new Error(
                                                "A leitura do arquivo foi cancelada."
                                            )
                                        );
                                    };

                                    leitor.readAsDataURL(arquivo);
                                }
                            )
                        }
                        : null;

                    cadastrarEnvio(
                        patrocinadorSelecionado.id,
                        {
                            texto: texto,
                            arquivo: arquivoEnviado
                        }
                    );

                    renderizarEnviosPatrocinador(
                        patrocinadorSelecionado.id
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
                } finally {
                    botaoEnviar.disabled = false;
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
