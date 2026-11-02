// ==========================================================================
// PORTAL RBS — CONTROLADOR DA ÁREA DO PATROCINADOR (DRY + SUPABASE STORAGE)
// ==========================================================================
document.addEventListener("DOMContentLoaded", async function () {

    // 1. ELEMENTOS DA INTERFACE
    const botaoNovoEnvio = document.getElementById("newSponsorButton");
    const formularioContainer = document.getElementById("newSponsorForm");
    const botaoFechar = document.getElementById("closeSponsorForm");
    const botaoCancelar = document.getElementById("cancelSponsor");
    const formularioEnvio = document.getElementById("sponsorForm");

    const botaoPerguntas = document.getElementById("botaoPerguntas");
    const formPerguntasContainer = document.getElementById("formPerguntas");
    const closePerguntasForm = document.getElementById("closePerguntasForm");
    const cancelPerguntas = document.getElementById("cancelPerguntas");
    const questionsForm = document.getElementById("questionsForm");
    const listaPerguntasSalvas = document.getElementById("listaPerguntasSalvas");

    const mensagemPatrocinador = document.getElementById("mensagemPatrocinador");
    const nomeEmpresa = document.getElementById("nomePatrocinador");
    const campoEmail = document.getElementById("sponsorActorEmail");
    const secaoMateriais = document.getElementById("materiaisPublicadosRBS");
    const listaMateriais = document.getElementById("listaMateriaisRBS");
    const listaMeusEnvios = document.getElementById("listaMeusEnvios");
    const resumoCortesiasCliente = document.getElementById("resumoCortesiasCliente");

    const MAPA_COTA_FRONT = {
        "MASTER": "Master",
        "SUB_COTA_G": "Subcota G",
        "SUB_COTA": "Subcota"
    };

    // 2. SESSÃO AUTENTICADA
    const sessao = JSON.parse(localStorage.getItem("rbs_sessao") || "null");
    const marcaId = sessao?.patrocinadorId;

    if (campoEmail) {
        campoEmail.value = sessionStorage.getItem("rbs_usuario_email") || sessao?.email || "";
    }

    // 3. CARREGAR PAINEL DO PATROCINADOR DIRETO DO SUPABASE VIA API JAVA
    async function carregarPainelDoPatrocinador() {
        if (!marcaId) {
            if (mensagemPatrocinador) {
                mensagemPatrocinador.textContent = "Não foi possível localizar sua empresa vinculada.";
            }
            if (botaoNovoEnvio) botaoNovoEnvio.disabled = true;
            return;
        }

        try {
            const [marcaApi, materiaisApi, cortesiaApi, relatorioApi] = await Promise.all([
                apiRequest(`/marcas/${marcaId}`, "GET"),
                apiRequest(`/marcas/${marcaId}/materiais`, "GET").catch(() => []),
                apiRequest(`/marcas/${marcaId}/cortesias`, "GET").catch(() => null),
                apiRequest(`/marcas/${marcaId}/relatorio-consolidado`, "GET").catch(() => null)
            ]);

            if (nomeEmpresa) {
                nomeEmpresa.textContent = marcaApi.nome;
            }

            const cotaLegivel = MAPA_COTA_FRONT[marcaApi.cota] || marcaApi.cota || "Não informada";
            const ehMaster = marcaApi.cota === "MASTER";

            const tituloCota = document.getElementById("tituloCota");
            const detalheCota = document.getElementById("detalheCota");

            if (tituloCota) {
                tituloCota.textContent = `Sua empresa faz parte da cota ${cotaLegivel}`;
            }

            if (mensagemPatrocinador) {
                mensagemPatrocinador.textContent = ehMaster
                    ? "Você possui a categoria de patrocínio Master."
                    : `Sua categoria de patrocínio é ${cotaLegivel}.`;
            }

            if (detalheCota) {
                detalheCota.classList.toggle("destaque-master", ehMaster);
            }

            renderizarMateriais(materiaisApi || []);
            renderizarCortesiasCliente(cortesiaApi);
            renderizarPerguntas(relatorioApi?.perguntasPesquisa || []);

        } catch (erro) {
            console.error("Erro ao carregar dados do patrocinador:", erro);
            if (mensagemPatrocinador) {
                mensagemPatrocinador.textContent = erro.message || "Erro ao consultar dados da empresa.";
            }
        }
    }

    // 4. RENDERIZAR MATERIAIS DA RBS E ENVIOS DO PATROCINADOR (COM BOTÕES DE VISUALIZAR E BAIXAR .TXT / MÍDIA)
    function renderizarMateriais(materiais) {
        if (secaoMateriais && listaMateriais) {
            listaMateriais.replaceChildren();
            const publicadosRbs = materiais.filter(m => m.autorPerfil !== "PATROCINADOR");

            if (publicadosRbs.length === 0) {
                const msg = document.createElement("p");
                msg.textContent = "Nenhum relatório, plano comercial ou link publicado pela RBS ainda.";
                listaMateriais.appendChild(msg);
            } else {
                publicadosRbs.forEach(mat => {
                    const item = document.createElement("div");
                    item.className = "material-publicado-item";

                    const titulo = document.createElement("p");
                    titulo.className = "material-publicado-titulo";

                    const acoes = document.createElement("div");
                    acoes.className = "material-publicado-acoes";

                    const urlNuvem = mat.caminhoStorage || mat.urlExterna;

                    if (mat.tipoMaterial === "LINK_POST" && mat.urlExterna) {
                        titulo.textContent = mat.urlExterna;
                        const abrir = document.createElement("a");
                        abrir.href = mat.urlExterna;
                        abrir.target = "_blank";
                        abrir.rel = "noopener noreferrer";
                        abrir.textContent = "Abrir publicação";
                        abrir.addEventListener("click", () => {
                            if (mat.id) apiRequest(`/materiais/${mat.id}/acessar`, "POST").catch(() => { });
                        });
                        acoes.appendChild(abrir);
                    } else {
                        titulo.textContent = `${mat.titulo} (${mat.descricao || "Arquivo RBS"})`;
                        if (urlNuvem && (urlNuvem.startsWith("http") || urlNuvem.startsWith("data:"))) {
                            const visualizar = document.createElement("a");
                            visualizar.href = urlNuvem;
                            visualizar.target = "_blank";
                            visualizar.rel = "noopener noreferrer";
                            visualizar.textContent = "Visualizar";
                            visualizar.addEventListener("click", () => {
                                if (mat.id) apiRequest(`/materiais/${mat.id}/acessar`, "POST").catch(() => { });
                            });

                            const baixar = document.createElement("a");
                            baixar.href = urlNuvem;
                            baixar.target = "_blank";
                            baixar.rel = "noopener noreferrer";
                            baixar.download = mat.titulo || "relatorio";
                            baixar.textContent = "Baixar arquivo";
                            baixar.addEventListener("click", () => {
                                if (mat.id) apiRequest(`/materiais/${mat.id}/acessar`, "POST").catch(() => { });
                            });

                            acoes.append(visualizar, baixar);
                        }
                    }

                    item.append(titulo, acoes);
                    listaMateriais.appendChild(item);
                });
            }
            secaoMateriais.hidden = false;
        }

        if (listaMeusEnvios) {
            listaMeusEnvios.replaceChildren();
            const enviadosCliente = materiais.filter(m => m.autorPerfil === "PATROCINADOR");

            if (enviadosCliente.length === 0) {
                const msg = document.createElement("p");
                msg.className = "envios-patrocinador-vazio";
                msg.textContent = "Você ainda não enviou conteúdos.";
                listaMeusEnvios.appendChild(msg);
            } else {
                enviadosCliente.forEach(mat => {
                    const item = document.createElement("article");
                    item.className = "envio-patrocinador-item";

                    if (mat.descricao) {
                        const texto = document.createElement("p");
                        texto.className = "envio-patrocinador-texto";
                        texto.textContent = mat.descricao;
                        item.appendChild(texto);

                        const baixarTexto = document.createElement("a");
                        baixarTexto.className = "envio-patrocinador-download";
                        baixarTexto.href = URL.createObjectURL(
                            new Blob([mat.descricao], { type: "text/plain;charset=utf-8" })
                        );
                        baixarTexto.download = `conteudo-enviado-${mat.id}.txt`;
                        baixarTexto.textContent = "Baixar conteúdo (.txt)";
                        item.appendChild(baixarTexto);
                    }

                    const urlNuvem = mat.caminhoStorage || mat.urlExterna;
                    if (urlNuvem && urlNuvem.startsWith("http")) {
                        const arquivoP = document.createElement("p");
                        arquivoP.className = "envio-patrocinador-arquivo";
                        arquivoP.textContent = `Arquivo: ${mat.titulo}`;
                        item.appendChild(arquivoP);

                        const baixarArquivo = document.createElement("a");
                        baixarArquivo.className = "envio-patrocinador-download";
                        baixarArquivo.href = urlNuvem;
                        baixarArquivo.target = "_blank";
                        baixarArquivo.rel = "noopener noreferrer";
                        baixarArquivo.download = mat.titulo || "arquivo";
                        baixarArquivo.textContent = "Baixar mídia";
                        baixarArquivo.addEventListener("click", () => {
                            if (mat.id) apiRequest(`/materiais/${mat.id}/acessar`, "POST").catch(() => { });
                        });
                        item.appendChild(baixarArquivo);
                    }

                    const detalhes = document.createElement("p");
                    detalhes.className = "envio-patrocinador-detalhes";
                    const dataFormatada = mat.criadoEm ? new Date(mat.criadoEm).toLocaleString("pt-BR") : "Data não informada";
                    detalhes.textContent = `Status: ${mat.status || "ENVIADO"} - Enviado em: ${dataFormatada}`;
                    item.appendChild(detalhes);

                    listaMeusEnvios.appendChild(item);
                });
            }
        }
    }

    // 5. RENDERIZAR QUADRO DE CORTESIAS DO CLIENTE
    function renderizarCortesiasCliente(cortesia) {
        if (!resumoCortesiasCliente) return;
        resumoCortesiasCliente.replaceChildren();

        if (!cortesia) {
            resumoCortesiasCliente.textContent = "Nenhuma cortesia cadastrada até o momento.";
            return;
        }

        const resumo = document.createElement("p");
        resumo.innerHTML = `
            <strong>Arena:</strong> Passaporte (${cortesia.arenaPassaporte}) | Sexta (${cortesia.arenaSexta}) | Sábado (${cortesia.arenaSabado})<br>
            <strong>Camarote:</strong> Passaporte (${cortesia.camarotePassaporte}) | Sexta (${cortesia.camaroteSexta}) | Sábado (${cortesia.camaroteSabado})<br>
            <strong>Premium:</strong> Passaporte (${cortesia.premiumPassaporte}) | Sexta (${cortesia.premiumSexta}) | Sábado (${cortesia.premiumSabado})<br>
            <strong>Lounge:</strong> ${cortesia.loungeInfo || "Sem observações de Lounge."}
        `;
        resumoCortesiasCliente.appendChild(resumo);
    }

    // 6. RENDERIZAR AS 3 PERGUNTAS DA PESQUISA OFICIAL
    function renderizarPerguntas(perguntas) {
        if (!listaPerguntasSalvas) return;
        listaPerguntasSalvas.replaceChildren();

        if (!perguntas || perguntas.length === 0) {
            const p = document.createElement("p");
            p.textContent = "Nenhuma pergunta personalizada cadastrada ainda.";
            listaPerguntasSalvas.appendChild(p);
            return;
        }

        perguntas.forEach(q => {
            const item = document.createElement("div");
            item.className = "material-publicado-item";
            item.textContent = `Pergunta ${q.numeroPergunta}: ${q.textoPergunta}`;

            const input = document.getElementById(`pergunta${q.numeroPergunta}`);
            if (input) input.value = q.textoPergunta || "";

            listaPerguntasSalvas.appendChild(item);
        });
    }

    // 7. ABERTURA E FECHAMENTO DOS FORMULÁRIOS
    function fecharFormularioEnvio() {
        if (!formularioContainer || !botaoNovoEnvio) return;
        formularioContainer.classList.remove("open");
        botaoNovoEnvio.setAttribute("aria-expanded", "false");
    }

    if (botaoNovoEnvio && formularioContainer) {
        fecharFormularioEnvio();
        botaoNovoEnvio.addEventListener("click", function () {
            const aberto = formularioContainer.classList.toggle("open");
            botaoNovoEnvio.setAttribute("aria-expanded", String(aberto));
        });
        botaoFechar?.addEventListener("click", fecharFormularioEnvio);
        botaoCancelar?.addEventListener("click", fecharFormularioEnvio);
    }

    function fecharFormularioPerguntas() {
        if (!formPerguntasContainer || !botaoPerguntas) return;
        formPerguntasContainer.classList.remove("open");
        botaoPerguntas.setAttribute("aria-expanded", "false");
    }

    if (botaoPerguntas && formPerguntasContainer) {
        fecharFormularioPerguntas();
        botaoPerguntas.addEventListener("click", function () {
            const aberto = formPerguntasContainer.classList.toggle("open");
            botaoPerguntas.setAttribute("aria-expanded", String(aberto));
        });
        closePerguntasForm?.addEventListener("click", fecharFormularioPerguntas);
        cancelPerguntas?.addEventListener("click", fecharFormularioPerguntas);
    }

    // 8. ENVIAR MÍDIA OU CONTEÚDO AO SUPABASE STORAGE VIA apiUploadMaterial (POST /marcas/{id}/materiais)
    if (formularioEnvio) {
        const botaoSubmitEnvio = formularioEnvio.querySelector("[type='submit']");

        formularioEnvio.addEventListener("submit", async function (event) {
            event.preventDefault();
            if (!marcaId) return;

            const texto = document.getElementById("sponsorTexto").value.trim();
            const arquivoInput = document.getElementById("sponsorArchive");
            const arquivo = arquivoInput?.files?.[0] || null;

            if (botaoSubmitEnvio) {
                botaoSubmitEnvio.disabled = true;
                botaoSubmitEnvio.textContent = "Enviando...";
            }

            if (!texto && !arquivo) {
                alert("Informe um conteúdo em texto ou selecione um arquivo para enviar.");
                return;
            }

            try {
                await apiUploadMaterial(marcaId, {
                    titulo: arquivo ? arquivo.name : "Conteúdo enviado pelo Patrocinador",
                    descricao: texto,
                    abaDestino: "ABA_2_MARCA",
                    tipoMaterial: "MIV_LOGO",
                    caminhoStorage: null,
                    urlExterna: null
                }, arquivo);

                alert("Material enviado com sucesso e armazenado no Supabase Storage!");
                formularioEnvio.reset();
                if (campoEmail) campoEmail.value = sessao?.email || "";
                fecharFormularioEnvio();
                await carregarPainelDoPatrocinador();

            } catch (erro) {
                console.error("Erro ao enviar material:", erro);
                alert(erro.message || "Não foi possível registrar o envio.");
            } finally {
                if (botaoSubmitEnvio) {
                    botaoSubmitEnvio.disabled = false;
                    botaoSubmitEnvio.textContent = "Enviar Dados";
                }
            }
        });
    }

    // 9. SALVAR AS 3 PERGUNTAS DA PESQUISA (POST /marcas/{id}/pesquisa-perguntas)
    if (questionsForm) {
        questionsForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            if (!marcaId) return;

            try {
                for (let num = 1; num <= 3; num++) {
                    const input = document.getElementById(`pergunta${num}`);
                    const texto = input ? input.value.trim() : "";

                    if (texto) {
                        await apiRequest(`/marcas/${marcaId}/pesquisa-perguntas`, "POST", {
                            numeroPergunta: num,
                            textoPergunta: texto
                        });
                    }
                }

                alert("Perguntas da pesquisa salvas com sucesso no banco de dados!");
                fecharFormularioPerguntas();
                await carregarPainelDoPatrocinador();
            } catch (erro) {
                console.error("Erro ao salvar perguntas:", erro);
                alert(erro.message || "Não foi possível salvar as perguntas.");
            }
        });
    }

    await carregarPainelDoPatrocinador();
});