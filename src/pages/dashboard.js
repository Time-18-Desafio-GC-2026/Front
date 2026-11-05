// ==========================================================================
// PORTAL RBS — CONTROLADOR CONSOLIDADO DO PAINEL ADMIN (DRY + SUPABASE STORAGE)
// ==========================================================================
const PATROCINADORES_KEY = "rbs_patrocinadores";
const USUARIOS_KEY = "rbs_usuarios";
const ENVIOS_KEY = "rbs_envios";
const MIDIA_RBS_KEY = "rbs_midia_rbs";
const CONTRATOS_KEY = "rbs_contratos";
const CORTESIAS_KEY = "rbs_cortesias";
const SETORES_CORTESIA = ["Arena", "Camarote", "Premium"];

const MAPA_COTA_PARA_API = {
    "Master": "MASTER",
    "Subcota G": "SUB_COTA_G",
    "Subcota": "SUB_COTA"
};

const MAPA_COTA_PARA_FRONT = {
    "MASTER": "Master",
    "SUB_COTA_G": "Subcota G",
    "SUB_COTA": "Subcota"
};

function traduzirCotaParaApi(cotaFront) {
    return MAPA_COTA_PARA_API[cotaFront] || "SUB_COTA";
}

function traduzirCotaParaFront(cotaApi) {
    return MAPA_COTA_PARA_FRONT[cotaApi] || cotaApi;
}

function gerarSenhaPadraoPorNome(nomeMarca) {
    const prefixoLimpo = String(nomeMarca || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6) || "Marca";
    return `${prefixoLimpo}@2026`;
}

function obterSenhaPadraoMarca(marcaId, nomeMarca) {
    const senhasSalvas = JSON.parse(localStorage.getItem("rbs_senhas_padrao") || "{}");
    return senhasSalvas[marcaId] || gerarSenhaPadraoPorNome(nomeMarca);
}

function salvarSenhaPadraoMarca(marcaId, novaSenha) {
    const senhasSalvas = JSON.parse(localStorage.getItem("rbs_senhas_padrao") || "{}");
    senhasSalvas[marcaId] = novaSenha;
    localStorage.setItem("rbs_senhas_padrao", JSON.stringify(senhasSalvas));
}

function lerListaLocalStorage(chave) {
    try {
        const dados = JSON.parse(localStorage.getItem(chave) || "[]");
        return Array.isArray(dados) ? dados : [];
    } catch (erro) {
        console.error(`Erro ao ler "${chave}":`, erro);
        return [];
    }
}

function salvarListaLocalStorage(chave, dados) {
    if (!Array.isArray(dados)) {
        throw new TypeError("O valor a ser salvo precisa ser uma lista.");
    }
    localStorage.setItem(chave, JSON.stringify(dados));
}

function listarPatrocinadores() {
    return lerListaLocalStorage(PATROCINADORES_KEY);
}

function salvarPatrocinadores(patrocinadores) {
    salvarListaLocalStorage(PATROCINADORES_KEY, patrocinadores);
}

function validarArquivoFoto(arquivo) {
    if (!arquivo) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) {
        throw new Error("A foto deve estar no formato JPG, PNG ou WEBP.");
    }
    if (arquivo.size > 2 * 1024 * 1024) {
        throw new Error("A foto deve ter no máximo 2 MB.");
    }
}

/**
 * Sincroniza Marcas, Usuários, Cortesias, Contratos e Materiais com o PostgreSQL + Supabase Storage.
 */
async function sincronizarDadosComBackend() {
    try {
        const [marcasApi, usuariosApi] = await Promise.all([
            apiRequest("/marcas", "GET"),
            apiRequest("/usuarios", "GET").catch(() => [])
        ]);
        if (!Array.isArray(marcasApi)) return;

        const cacheAnterior = listarPatrocinadores();
        const patrocinadoresSincronizados = [];
        const enviosCliente = [];
        const midiasRbs = [];
        const contratosMarca = [];
        const cortesiasBanco = [];

        for (const m of marcasApi) {
            const anterior = cacheAnterior.find(item => item.id === m.id) || {};
            const contasDaMarca = (usuariosApi || []).filter(
                u => String(u.marcaId) === String(m.id)
            );
            const emailsFormatados = contasDaMarca.length > 0
                ? contasDaMarca.map(u => u.email).join(", ")
                : (anterior.email || "");

            const senhaPadrao = obterSenhaPadraoMarca(m.id, m.nome);
            salvarSenhaPadraoMarca(m.id, senhaPadrao);

            const [materiaisApi, cortesiaApi] = await Promise.all([
                apiRequest(`/marcas/${m.id}/materiais`, "GET").catch(() => []),
                apiRequest(`/marcas/${m.id}/cortesias`, "GET").catch(() => null)
            ]);

            if (cortesiaApi) {
                cortesiasBanco.push({
                    patrocinadorId: m.id,
                    setores: {
                        Arena: {
                            passaporte: cortesiaApi.arenaPassaporte || 0,
                            sexta: cortesiaApi.arenaSexta || 0,
                            sabado: cortesiaApi.arenaSabado || 0
                        },
                        Camarote: {
                            passaporte: cortesiaApi.camarotePassaporte || 0,
                            sexta: cortesiaApi.camaroteSexta || 0,
                            sabado: cortesiaApi.camaroteSabado || 0
                        },
                        Premium: {
                            passaporte: cortesiaApi.premiumPassaporte || 0,
                            sexta: cortesiaApi.premiumSexta || 0,
                            sabado: cortesiaApi.premiumSabado || 0
                        }
                    },
                    atualizadoEm: cortesiaApi.atualizadoEm
                });
            }

            const planoComercial = (materiaisApi || []).find(mat => mat.tipoMaterial === "PLANO_COMERCIAL");
            const fotoEmpresaMat = (materiaisApi || []).find(mat => mat.tipoMaterial === "FOTO_EMPRESA");

            (materiaisApi || []).forEach(mat => {
                const urlArquivoNuvem = mat.caminhoStorage || mat.urlExterna || null;

                if (mat.tipoMaterial === "CONTRATO" || mat.abaDestino === "ABA_7_CONTRATO") {
                    contratosMarca.push({
                        id: mat.id,
                        patrocinadorId: m.id,
                        titulo: mat.titulo,
                        descricao: mat.descricao || "",
                        arquivoData: urlArquivoNuvem || "#",
                        autorNome: mat.autorNome || (mat.autorPerfil === "PATROCINADOR" ? "Empresa Patrocinadora" : "Administração RBS"),
                        autorPerfil: mat.autorPerfil,
                        status: mat.status,
                        criadoEm: mat.criadoEm
                    });
                } else if (mat.autorPerfil === "PATROCINADOR") {
                    enviosCliente.push({
                        id: mat.id,
                        patrocinadorId: m.id,
                        texto: mat.descricao || mat.titulo,
                        arquivo: urlArquivoNuvem ? { nome: mat.titulo, arquivoData: urlArquivoNuvem } : null,
                        status: mat.status,
                        criadoEm: mat.criadoEm
                    });
                } else if (mat.tipoMaterial !== "PLANO_COMERCIAL" && mat.tipoMaterial !== "FOTO_EMPRESA") {
                    midiasRbs.push({
                        id: mat.id,
                        patrocinadorId: m.id,
                        tipo: mat.tipoMaterial === "LINK_POST" ? "link" : "relatorio",
                        nome: mat.titulo,
                        url: mat.urlExterna || mat.descricao,
                        arquivoData: urlArquivoNuvem || "#",
                        criadoEm: mat.criadoEm
                    });
                }
            });

            patrocinadoresSincronizados.push({
                id: m.id,
                nome: m.nome,
                cnpj: m.cnpj,
                email: emailsFormatados,
                senhaPadrao: senhaPadrao,
                cota: traduzirCotaParaFront(m.cota),
                arquivo: planoComercial ? planoComercial.titulo : "",
                planoComercialUrl: planoComercial ? (planoComercial.caminhoStorage || planoComercial.urlExterna) : null,
                planoComercialId: planoComercial ? planoComercial.id : null,
                foto: fotoEmpresaMat
                    ? (fotoEmpresaMat.caminhoStorage || fotoEmpresaMat.urlExterna)
                    : (anterior.foto || ""),
                criadoEm: m.criadoEm
            });
        }

        salvarPatrocinadores(patrocinadoresSincronizados);
        localStorage.setItem(USUARIOS_KEY, JSON.stringify(
            (usuariosApi || []).map(u => ({
                id: u.id,
                nome: u.nome || u.email,
                email: u.email,
                ativo: u.ativo,
                perfil: u.perfil === "PATROCINADOR" ? "patrocinador" : "funcionario",
                patrocinadorId: u.marcaId
            }))
        ));
        localStorage.setItem(ENVIOS_KEY, JSON.stringify(enviosCliente));
        localStorage.setItem(MIDIA_RBS_KEY, JSON.stringify(midiasRbs));
        localStorage.setItem(CONTRATOS_KEY, JSON.stringify(contratosMarca));
        localStorage.setItem(CORTESIAS_KEY, JSON.stringify(cortesiasBanco));
    } catch (erro) {
        console.error("Erro ao sincronizar com o Back-end:", erro);
    }
}

function normalizarEmailsPatrocinador(valor) {
    return [...new Set(
        String(valor || "")
            .split(/[;,]/)
            .map(email => email.trim().toLowerCase())
            .filter(Boolean)
    )];
}

function validarEmailsPatrocinador(valor) {
    const emails = normalizarEmailsPatrocinador(valor);
    if (emails.length === 0) {
        throw new Error("Informe pelo menos um e-mail.");
    }
    const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalido = emails.find(email => !formatoEmail.test(email));
    if (invalido) {
        throw new Error(`E-mail inválido: ${invalido}`);
    }
    return emails;
}

function listarEnviosPorPatrocinador(patrocinadorId) {
    const todos = JSON.parse(localStorage.getItem(ENVIOS_KEY) || "[]");
    return todos.filter(envio => String(envio.patrocinadorId) === String(patrocinadorId));
}

function listarContratosPorPatrocinador(patrocinadorId) {
    const todos = JSON.parse(localStorage.getItem(CONTRATOS_KEY) || "[]");
    return todos.filter(c => String(c.patrocinadorId) === String(patrocinadorId));
}

function listarMidiaRBSPorPatrocinador(patrocinadorId) {
    const todos = JSON.parse(localStorage.getItem(MIDIA_RBS_KEY) || "[]");
    return todos.filter(item => String(item.patrocinadorId) === String(patrocinadorId));
}

// --- MODULO: Contrato de Patrocínio em Fases (Substitui a versão anterior a cada fase) ---
function criarSecaoContratos(patrocinador) {
    const contratos = listarContratosPorPatrocinador(patrocinador.id);
    const contratoAtual = contratos[0] || null;

    const secao = document.createElement("section");
    secao.className = "patrocinador-cortesias";

    const cabecalho = document.createElement("div");
    cabecalho.className = "secao-cabecalho";
    const titulo = document.createElement("h4");
    titulo.textContent = "Contrato de Patrocínio";
    cabecalho.appendChild(titulo);

    const conteudo = document.createElement("div");
    conteudo.className = "secao-conteudo";
    conteudo.hidden = false;

    let faseLabel = "Fase 1: Aguardando envio do contrato pela RBS";
    let textoBotaoUpload = "Adicionar Contrato em PDF (Enviar para Empresa)";
    let statusNovoUpload = "AGUARDANDO_ASSINATURA_EMPRESA";
    let descNovoUpload = "Fase 1/3: Aguardando assinatura da empresa patrocinadora";

    if (contratoAtual) {
        if (contratoAtual.status === "CONTRATO_FINALIZADO") {
            faseLabel = "Fase 3/3: Contrato Final Assinado (RBS + Empresa)";
            textoBotaoUpload = "Substituir Contrato Final Assinado (PDF)";
            statusNovoUpload = "CONTRATO_FINALIZADO";
            descNovoUpload = "Fase 3/3: Contrato final assinado por ambas as partes";
        } else if (contratoAtual.autorPerfil === "PATROCINADOR" || contratoAtual.status === "ASSINADO_PELA_EMPRESA") {
            faseLabel = "Fase 2/3: Assinado pela Empresa — Aguardando assinatura final da RBS";
            textoBotaoUpload = "Enviar Contrato Assinado pela RBS (Finalizar)";
            statusNovoUpload = "CONTRATO_FINALIZADO";
            descNovoUpload = "Fase 3/3: Contrato final assinado por ambas as partes";
        } else {
            faseLabel = "Fase 1/3: Enviado pela RBS — Aguardando assinatura da Empresa";
            textoBotaoUpload = "Substituir Minuta do Contrato (PDF)";
            statusNovoUpload = "AGUARDANDO_ASSINATURA_EMPRESA";
            descNovoUpload = "Fase 1/3: Aguardando assinatura da empresa patrocinadora";
        }
    }

    const lista = document.createElement("div");
    lista.className = "midia-rbs-lista";

    if (!contratoAtual) {
        const vazio = document.createElement("p");
        vazio.className = "midia-rbs-vazio";
        vazio.textContent = "Nenhum contrato ativo no momento. Envie o PDF inicial para a empresa assinar.";
        lista.appendChild(vazio);
    } else {
        const item = document.createElement("div");
        item.className = "envio-item";

        const linha = document.createElement("div");
        linha.className = "envio-linha";

        const infoTexto = document.createElement("div");
        infoTexto.style.flex = "1";
        const dataStr = contratoAtual.criadoEm ? new Date(contratoAtual.criadoEm).toLocaleString("pt-BR") : "";
        infoTexto.innerHTML = `
            <span class="envio-status" style="margin-bottom:6px;">${faseLabel}</span>
            <p class="envio-texto" style="margin:4px 0;"><strong>${contratoAtual.titulo}</strong></p>
            <small style="color:#64748b; font-size:0.78rem;">Atualizado por: ${contratoAtual.autorNome} • ${dataStr}</small>
        `;

        const acoesContrato = document.createElement("div");
        acoesContrato.style.display = "flex";
        acoesContrato.style.gap = "8px";
        acoesContrato.style.alignItems = "center";

        const btnBaixar = document.createElement("a");
        btnBaixar.className = "envio-download button button-primary";
        btnBaixar.href = contratoAtual.arquivoData;
        btnBaixar.target = "_blank";
        btnBaixar.rel = "noopener noreferrer";
        btnBaixar.download = contratoAtual.titulo || "contrato.pdf";
        btnBaixar.textContent = "Visualizar / Baixar PDF";
        btnBaixar.addEventListener("click", () => {
            if (contratoAtual.id) {
                apiRequest(`/materiais/${contratoAtual.id}/acessar`, "POST").catch(() => { });
            }
        });

        const btnRemoverContrato = document.createElement("button");
        btnRemoverContrato.type = "button";
        btnRemoverContrato.className = "btn-acao-perigo";
        btnRemoverContrato.textContent = "Remover";
        btnRemoverContrato.addEventListener("click", async () => {
            if (!window.confirm("Deseja remover o arquivo de contrato atual?")) return;
            try {
                for (const c of contratos) {
                    await apiRequest(`/materiais/${c.id}`, "DELETE").catch(() => { });
                }
                await sincronizarDadosComBackend();
                atualizarTelaPatrocinadores(patrocinador.id);
            } catch (erro) {
                alert(erro.message || "Erro ao remover contrato.");
            }
        });

        acoesContrato.append(btnBaixar, btnRemoverContrato);
        linha.append(infoTexto, acoesContrato);
        item.appendChild(linha);
        lista.appendChild(item);
    }

    const divUpload = document.createElement("div");
    divUpload.className = "midia-rbs-arquivo";
    divUpload.style.marginTop = "10px";

    const inputPdf = document.createElement("input");
    inputPdf.type = "file";
    inputPdf.accept = ".pdf,application/pdf";
    inputPdf.hidden = true;

    const btnEnviarPdf = document.createElement("button");
    btnEnviarPdf.type = "button";
    btnEnviarPdf.className = "button button-primary";
    btnEnviarPdf.textContent = textoBotaoUpload;

    btnEnviarPdf.addEventListener("click", () => inputPdf.click());

    inputPdf.addEventListener("change", async () => {
        const arquivo = inputPdf.files?.[0];
        if (!arquivo) return;
        btnEnviarPdf.disabled = true;
        btnEnviarPdf.textContent = "Atualizando contrato...";
        try {
            // Substitui versões anteriores para manter apenas o documento atualizado da fase atual
            for (const c of contratos) {
                await apiRequest(`/materiais/${c.id}`, "DELETE").catch(() => { });
            }

            const novoMat = await apiUploadMaterial(patrocinador.id, {
                titulo: arquivo.name,
                descricao: descNovoUpload,
                abaDestino: "ABA_7_CONTRATO",
                tipoMaterial: "CONTRATO",
                caminhoStorage: null,
                urlExterna: null
            }, arquivo);

            if (novoMat && novoMat.id && statusNovoUpload !== "ENVIADO") {
                await apiRequest(`/materiais/${novoMat.id}/status`, "PATCH", {
                    status: statusNovoUpload
                }).catch(() => { });
            }

            alert("Contrato atualizado com sucesso na plataforma!");
            await sincronizarDadosComBackend();
            atualizarTelaPatrocinadores(patrocinador.id);
        } catch (erro) {
            alert(erro.message || "Não foi possível atualizar o contrato em PDF.");
        } finally {
            btnEnviarPdf.disabled = false;
            btnEnviarPdf.textContent = textoBotaoUpload;
            inputPdf.value = "";
        }
    });

    divUpload.append(btnEnviarPdf, inputPdf);
    conteudo.append(lista, divUpload);
    secao.append(cabecalho, conteudo);
    return secao;
}

// --- MODULO: Mídia e Conteúdo (Dividido entre Envios da Marca e Envios da RBS) ---
function criarSecaoMidiaUnificada(patrocinador) {
    const enviosMarca = listarEnviosPorPatrocinador(patrocinador.id);
    const enviosRbs = listarMidiaRBSPorPatrocinador(patrocinador.id);

    const secao = document.createElement("div");
    secao.className = "patrocinador-envios";

    const cabecalho = document.createElement("div");
    cabecalho.className = "secao-cabecalho";
    const titulo = document.createElement("h4");
    titulo.textContent = "Mídia e Conteúdo";
    cabecalho.appendChild(titulo);

    const conteudo = document.createElement("div");
    conteudo.className = "secao-conteudo";
    conteudo.hidden = false;

    // SUB-BLOCO 1: Envios da Marca
    const blocoMarca = document.createElement("div");
    blocoMarca.className = "midia-subbloco";
    const h5Marca = document.createElement("h5");
    h5Marca.textContent = "Envios da Marca";
    blocoMarca.appendChild(h5Marca);

    if (enviosMarca.length === 0) {
        const vazio = document.createElement("p");
        vazio.className = "envios-vazio";
        vazio.textContent = "Nenhum conteúdo enviado pela marca patrocinadora.";
        blocoMarca.appendChild(vazio);
    } else {
        enviosMarca.forEach(function (envio) {
            const item = document.createElement("div");
            item.className = "envio-item";
            if (envio.texto) {
                const linhaTexto = document.createElement("div");
                linhaTexto.className = "envio-linha";
                const texto = document.createElement("p");
                texto.className = "envio-texto";
                texto.textContent = `Texto: ${envio.texto}`;
                const baixarTexto = document.createElement("a");
                baixarTexto.className = "envio-download button button-primary";
                baixarTexto.href = URL.createObjectURL(
                    new Blob([envio.texto], { type: "text/plain;charset=utf-8" })
                );
                baixarTexto.download = `conteudo-enviado-${envio.id || "patrocinador"}.txt`;
                baixarTexto.textContent = "Baixar conteúdo";
                linhaTexto.append(texto, baixarTexto);
                item.appendChild(linhaTexto);
            }
            if (envio.arquivo && envio.arquivo.arquivoData && envio.arquivo.arquivoData !== "#") {
                const linhaArquivo = document.createElement("div");
                linhaArquivo.className = "envio-linha";
                const nomeArquivo = document.createElement("p");
                nomeArquivo.className = "envio-arquivo-nome";
                nomeArquivo.textContent = `Arquivo: ${envio.arquivo.nome || "Arquivo enviado"}`;
                const baixarArquivo = document.createElement("a");
                baixarArquivo.className = "envio-download button button-primary";
                baixarArquivo.href = envio.arquivo.arquivoData;
                baixarArquivo.target = "_blank";
                baixarArquivo.rel = "noopener noreferrer";
                baixarArquivo.download = envio.arquivo.nome || "arquivo-enviado";
                baixarArquivo.textContent = "Baixar mídia";
                baixarArquivo.addEventListener("click", function () {
                    if (envio.id) {
                        apiRequest(`/materiais/${envio.id}/acessar`, "POST").catch(() => { });
                    }
                });
                linhaArquivo.append(nomeArquivo, baixarArquivo);
                item.appendChild(linhaArquivo);
            }
            blocoMarca.appendChild(item);
        });
    }

    // SUB-BLOCO 2: Envios da RBS (Com botão de apagar cada item e botão de enviar abaixo de Adicionar link)
    const blocoRbs = document.createElement("div");
    blocoRbs.className = "midia-subbloco";
    const h5Rbs = document.createElement("h5");
    h5Rbs.textContent = "Envios da RBS";
    blocoRbs.appendChild(h5Rbs);

    const listaRbs = document.createElement("div");
    listaRbs.className = "midia-rbs-lista";

    if (enviosRbs.length === 0) {
        const vazioRbs = document.createElement("p");
        vazioRbs.className = "midia-rbs-vazio";
        vazioRbs.textContent = "Nenhum relatório, mídia ou link enviado pela RBS.";
        listaRbs.appendChild(vazioRbs);
    } else {
        enviosRbs.forEach(function (registro) {
            const item = document.createElement("div");
            item.className = "midia-rbs-item";
            const linha = document.createElement("div");
            linha.className = "envio-linha";

            const linkPrincipal = document.createElement("a");
            linkPrincipal.className = "envio-arquivo-nome";
            linkPrincipal.target = "_blank";
            linkPrincipal.rel = "noopener noreferrer";

            if (registro.tipo === "relatorio") {
                linkPrincipal.href = registro.arquivoData;
                linkPrincipal.textContent = registro.nome;
            } else {
                linkPrincipal.href = registro.url;
                linkPrincipal.textContent = registro.url;
            }

            linkPrincipal.addEventListener("click", function () {
                if (registro.id) {
                    apiRequest(`/materiais/${registro.id}/acessar`, "POST").catch(() => { });
                }
            });

            const acoesItem = document.createElement("div");
            acoesItem.style.display = "flex";
            acoesItem.style.gap = "8px";
            acoesItem.style.alignItems = "center";

            if (registro.tipo === "relatorio") {
                const baixarArquivo = document.createElement("a");
                baixarArquivo.className = "envio-download button button-primary";
                baixarArquivo.href = registro.arquivoData;
                baixarArquivo.target = "_blank";
                baixarArquivo.rel = "noopener noreferrer";
                baixarArquivo.download = registro.nome;
                baixarArquivo.textContent = "Baixar";
                acoesItem.appendChild(baixarArquivo);
            }

            const btnApagar = document.createElement("button");
            btnApagar.type = "button";
            btnApagar.className = "btn-acao-perigo";
            btnApagar.textContent = "Apagar";
            btnApagar.addEventListener("click", async () => {
                if (!window.confirm(`Deseja apagar "${registro.nome || registro.url}"?`)) return;
                try {
                    await apiRequest(`/materiais/${registro.id}`, "DELETE");
                    await sincronizarDadosComBackend();
                    atualizarTelaPatrocinadores(patrocinador.id);
                } catch (erro) {
                    alert(erro.message || "Não foi possível apagar o conteúdo.");
                }
            });

            acoesItem.appendChild(btnApagar);
            linha.append(linkPrincipal, acoesItem);
            item.appendChild(linha);
            listaRbs.appendChild(item);
        });
    }

    const controlesContainer = document.createElement("div");
    controlesContainer.className = "midia-rbs-controles-empilhados";

    const formularioLink = document.createElement("form");
    formularioLink.className = "midia-rbs-form";
    const campoLink = document.createElement("input");
    campoLink.type = "url";
    campoLink.placeholder = "https://link-da-publicacao.com";
    campoLink.required = true;
    const botaoLink = document.createElement("button");
    botaoLink.type = "submit";
    botaoLink.className = "button button-primary";
    botaoLink.textContent = "Adicionar link";
    formularioLink.append(campoLink, botaoLink);

    // Botão Adicionar relatório de mídia posicionado ABAIXO de Adicionar link
    const formularioArquivo = document.createElement("div");
    formularioArquivo.className = "midia-rbs-arquivo";
    const campoArquivo = document.createElement("input");
    campoArquivo.type = "file";
    campoArquivo.accept = ".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.mp4,.zip";
    campoArquivo.hidden = true;
    const botaoArquivo = document.createElement("button");
    botaoArquivo.type = "button";
    botaoArquivo.className = "button button-primary";
    botaoArquivo.textContent = "Adicionar relatório de mídia / conteúdo";
    botaoArquivo.addEventListener("click", () => campoArquivo.click());

    campoArquivo.addEventListener("change", async function () {
        const arquivo = campoArquivo.files[0];
        if (!arquivo) return;
        botaoArquivo.disabled = true;
        botaoArquivo.textContent = "Enviando para a nuvem...";
        try {
            await apiUploadMaterial(patrocinador.id, {
                titulo: arquivo.name,
                descricao: "Mídia / Relatório publicado pela RBS",
                abaDestino: "ABA_3_MIDIA",
                tipoMaterial: "PLANILHA_MIDIA",
                caminhoStorage: null,
                urlExterna: null
            }, arquivo);
            alert("Conteúdo enviado com sucesso!");
            await sincronizarDadosComBackend();
            atualizarTelaPatrocinadores(patrocinador.id);
        } catch (erro) {
            alert(erro.message || "Não foi possível enviar o arquivo.");
        } finally {
            botaoArquivo.disabled = false;
            botaoArquivo.textContent = "Adicionar relatório de mídia / conteúdo";
            campoArquivo.value = "";
        }
    });

    formularioLink.addEventListener("submit", async function (event) {
        event.preventDefault();
        const url = campoLink.value.trim();
        try {
            const endereco = new URL(url);
            if (!["http:", "https:"].includes(endereco.protocol)) {
                throw new Error("Use um endereço HTTP ou HTTPS.");
            }
            await apiUploadMaterial(patrocinador.id, {
                titulo: "Link de Publicação RBS",
                descricao: endereco.href,
                abaDestino: "ABA_3_MIDIA",
                tipoMaterial: "LINK_POST",
                caminhoStorage: null,
                urlExterna: endereco.href
            }, null);
            await sincronizarDadosComBackend();
            atualizarTelaPatrocinadores(patrocinador.id);
        } catch (erro) {
            alert(erro.message || "Informe um link válido.");
        }
    });

    formularioArquivo.append(botaoArquivo, campoArquivo);
    controlesContainer.append(formularioLink, formularioArquivo);
    blocoRbs.append(listaRbs, controlesContainer);

    conteudo.append(blocoMarca, blocoRbs);
    secao.append(cabecalho, conteudo);
    return secao;
}

// --- MODULO: Cortesias (Apenas setores numéricos, sem Lounge, e botão Editar dentro do bloco) ---
function listarCortesias() {
    return JSON.parse(localStorage.getItem(CORTESIAS_KEY) || "[]");
}

function obterCortesias(patrocinadorId) {
    const registro = listarCortesias().find(item => item.patrocinadorId === patrocinadorId);
    if (registro) return registro;
    const setores = {};
    SETORES_CORTESIA.forEach(setor => {
        setores[setor] = { passaporte: 0, sexta: 0, sabado: 0 };
    });
    return { patrocinadorId, setores };
}

function criarSecaoCortesias(patrocinador) {
    const dados = obterCortesias(patrocinador.id);
    const secao = document.createElement("section");
    secao.className = "patrocinador-cortesias";

    const cabecalhoCortesias = document.createElement("div");
    cabecalhoCortesias.className = "secao-cabecalho";
    const titulo = document.createElement("h4");
    titulo.textContent = "Cortesias";
    cabecalhoCortesias.appendChild(titulo);

    const conteudoCortesias = document.createElement("div");
    conteudoCortesias.className = "secao-conteudo";
    conteudoCortesias.hidden = false;

    const grade = document.createElement("div");
    grade.className = "cortesias-grade";
    grade.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";

    function adicionarResumo(pai, rotulo, valor) {
        const linha = document.createElement("div");
        linha.className = "cortesia-resumo";
        const nome = document.createElement("span");
        nome.textContent = rotulo;
        const quantidade = document.createElement("strong");
        quantidade.textContent = String(valor ?? 0);
        linha.append(nome, quantidade);
        pai.appendChild(linha);
    }

    SETORES_CORTESIA.forEach(setor => {
        const bloco = document.createElement("div");
        bloco.className = "cortesia-setor";
        const nomeSetor = document.createElement("h5");
        nomeSetor.textContent = setor;
        bloco.appendChild(nomeSetor);
        const quantidades = dados.setores[setor] || {};
        adicionarResumo(bloco, "Passaporte", quantidades.passaporte);
        adicionarResumo(bloco, "Sexta-feira", quantidades.sexta);
        adicionarResumo(bloco, "Sábado", quantidades.sabado);
        grade.appendChild(bloco);
    });

    conteudoCortesias.appendChild(grade);

    // Botão Editar cortesias fica dentro do próprio bloco de Cortesias
    const botaoEditar = document.createElement("button");
    botaoEditar.type = "button";
    botaoEditar.className = "botao-editar-cortesias button button-primary";
    botaoEditar.textContent = "Editar cortesias";

    const formulario = document.createElement("form");
    formulario.className = "form-cortesias";
    formulario.hidden = true;
    const tituloFormulario = document.createElement("h5");
    tituloFormulario.textContent = "Definir quantidades de ingressos";
    formulario.appendChild(tituloFormulario);

    const campos = {};
    SETORES_CORTESIA.forEach(setor => {
        const subtitulo = document.createElement("h5");
        subtitulo.textContent = setor;
        formulario.appendChild(subtitulo);
        campos[setor] = {};
        [
            ["passaporte", "Passaporte"],
            ["sexta", "Sexta-feira"],
            ["sabado", "Sábado"]
        ].forEach(([tipo, rotulo]) => {
            const grupo = document.createElement("label");
            grupo.className = "campo-cortesia";
            grupo.textContent = rotulo;
            const input = document.createElement("input");
            input.type = "number";
            input.min = "0";
            input.step = "1";
            input.required = true;
            input.value = dados.setores[setor]?.[tipo] ?? 0;
            campos[setor][tipo] = input;
            grupo.appendChild(input);
            formulario.appendChild(grupo);
        });
    });

    const botoes = document.createElement("div");
    botoes.className = "cortesias-acoes";
    const salvar = document.createElement("button");
    salvar.type = "submit";
    salvar.className = "button button-primary";
    salvar.textContent = "Salvar cortesias";
    const cancelar = document.createElement("button");
    cancelar.type = "button";
    cancelar.textContent = "Cancelar";
    botoes.append(salvar, cancelar);
    formulario.appendChild(botoes);

    botaoEditar.addEventListener("click", function () {
        formulario.hidden = false;
        botaoEditar.hidden = true;
    });

    cancelar.addEventListener("click", function () {
        formulario.reset();
        formulario.hidden = true;
        botaoEditar.hidden = false;
    });

    formulario.addEventListener("submit", async function (event) {
        event.preventDefault();
        const payloadApi = {
            arenaPassaporte: Number(campos["Arena"]["passaporte"].value) || 0,
            arenaSexta: Number(campos["Arena"]["sexta"].value) || 0,
            arenaSabado: Number(campos["Arena"]["sabado"].value) || 0,
            camarotePassaporte: Number(campos["Camarote"]["passaporte"].value) || 0,
            camaroteSexta: Number(campos["Camarote"]["sexta"].value) || 0,
            camaroteSabado: Number(campos["Camarote"]["sabado"].value) || 0,
            premiumPassaporte: Number(campos["Premium"]["passaporte"].value) || 0,
            premiumSexta: Number(campos["Premium"]["sexta"].value) || 0,
            premiumSabado: Number(campos["Premium"]["sabado"].value) || 0,
            loungeInfo: ""
        };
        try {
            await apiRequest(`/marcas/${patrocinador.id}/cortesias`, "PUT", payloadApi);
            alert("Cortesias salvas com sucesso!");
            await sincronizarDadosComBackend();
            atualizarTelaPatrocinadores(patrocinador.id);
        } catch (erro) {
            alert(erro.message || "Não foi possível salvar as cortesias.");
        }
    });

    conteudoCortesias.append(botaoEditar, formulario);
    secao.append(cabecalhoCortesias, conteudoCortesias);
    return secao;
}

// --- MODULO: Filtros ---
function normalizarTexto(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function configurarFiltrosPatrocinadores() {
    const campoBusca = document.getElementById("buscarPatrocinador");
    const filtroCota = document.getElementById("filtrarCota");
    if (!campoBusca || !filtroCota) return;

    const cotaAnterior = filtroCota.value;
    const cotas = [...new Set(
        listarPatrocinadores()
            .map(patrocinador => patrocinador.cota)
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "pt-BR"));

    filtroCota.replaceChildren();
    const opcaoTodas = document.createElement("option");
    opcaoTodas.value = "";
    opcaoTodas.textContent = "Todas as cotas";
    filtroCota.appendChild(opcaoTodas);

    cotas.forEach(cota => {
        const opcao = document.createElement("option");
        opcao.value = cota;
        opcao.textContent = cota;
        filtroCota.appendChild(opcao);
    });
    filtroCota.value = cotas.includes(cotaAnterior) ? cotaAnterior : "";

    function aplicarFiltros() {
        const busca = normalizarTexto(campoBusca.value);
        const cotaSelecionada = filtroCota.value;
        const cards = document.querySelectorAll("#patrocinadoresGrid .patrocinador-card");
        cards.forEach(card => {
            const nome = normalizarTexto(
                card.querySelector(".patrocinador-card-header h3")?.textContent
            );
            const cnpj = normalizarTexto(card.dataset.cnpj || "");
            const cota = card.querySelector(".patrocinador-cota")?.textContent.trim() || "";
            const correspondeBusca = !busca || nome.includes(busca) || cnpj.includes(busca);
            const correspondeCota = !cotaSelecionada || cota === cotaSelecionada;
            card.hidden = !(correspondeBusca && correspondeCota);
        });
    }

    campoBusca.addEventListener("input", aplicarFiltros);
    filtroCota.addEventListener("change", aplicarFiltros);
    aplicarFiltros();
}

// --- MODULO: Cadastro, Edição Completa e Exclusão ---
async function cadastrarPatrocinador(dados) {
    const emailsValidos = validarEmailsPatrocinador(dados.email);
    const senhaPadraoInicial = gerarSenhaPadraoPorNome(dados.nome);

    const marcaCriada = await apiRequest("/marcas", "POST", {
        nome: dados.nome,
        cnpj: dados.cnpj,
        cota: traduzirCotaParaApi(dados.cota),
        senhaPadrao: senhaPadraoInicial
    });

    salvarSenhaPadraoMarca(marcaCriada.id, senhaPadraoInicial);

    for (const email of emailsValidos) {
        await apiRequest(`/marcas/${marcaCriada.id}/patrocinadores`, "POST", {
            email: email,
            nome: dados.nome
        });
    }

    if (dados.arquivoFisico) {
        await apiUploadMaterial(marcaCriada.id, {
            titulo: dados.arquivoFisico.name,
            descricao: "Plano Comercial da Marca",
            abaDestino: "ABA_1_PERFIL",
            tipoMaterial: "PLANO_COMERCIAL",
            caminhoStorage: null,
            urlExterna: null
        }, dados.arquivoFisico);
    }

    if (dados.fotoFisica) {
        await apiUploadMaterial(marcaCriada.id, {
            titulo: dados.fotoFisica.name,
            descricao: "Foto / Logo da Empresa",
            abaDestino: "ABA_1_PERFIL",
            tipoMaterial: "FOTO_EMPRESA",
            caminhoStorage: null,
            urlExterna: null
        }, dados.fotoFisica);
    }

    await sincronizarDadosComBackend();
    return marcaCriada;
}

async function editarPatrocinadorInline(patrocinadorAtual, novosDados) {
    const emailsNovos = validarEmailsPatrocinador(novosDados.email);

    await apiRequest(`/marcas/${patrocinadorAtual.id}`, "PUT", {
        nome: novosDados.nome,
        cnpj: novosDados.cnpj,
        cota: traduzirCotaParaApi(novosDados.cota),
        senhaPadrao: novosDados.senhaPadrao
    });

    // Sincroniza adição e remoção de e-mails da empresa
    const todosUsuarios = JSON.parse(localStorage.getItem(USUARIOS_KEY) || "[]");
    const contasDaMarca = todosUsuarios.filter(
        u => String(u.patrocinadorId) === String(patrocinadorAtual.id)
    );

    // 1. Adiciona e-mails novos
    for (const email of emailsNovos) {
        const jaExiste = contasDaMarca.some(u => String(u.email || "").toLowerCase() === email);
        if (!jaExiste) {
            await apiRequest(`/marcas/${patrocinadorAtual.id}/patrocinadores`, "POST", {
                email: email,
                nome: novosDados.nome
            });
        }
    }

    // 2. Remove e-mails que foram retirados da lista pelo Admin
    for (const contaAntiga of contasDaMarca) {
        const mantido = emailsNovos.includes(String(contaAntiga.email || "").toLowerCase());
        if (!mantido) {
            await apiRequest(`/usuarios/${contaAntiga.id}/desativar`, "POST").catch(() => { });
            await apiRequest(`/usuarios/${contaAntiga.id}`, "DELETE").catch(() => { });
        }
    }

    // 3. Se alterou a senha padrão da marca, salva a nova senha padrão
    if (novosDados.senhaPadrao && novosDados.senhaPadrao.trim().length >= 6) {
        salvarSenhaPadraoMarca(patrocinadorAtual.id, novosDados.senhaPadrao.trim());
    }

    // 4. Se enviou novo Plano Comercial, substitui o antigo
    if (novosDados.arquivoFisico) {
        if (patrocinadorAtual.planoComercialId) {
            await apiRequest(`/materiais/${patrocinadorAtual.planoComercialId}`, "DELETE").catch(() => { });
        }
        await apiUploadMaterial(patrocinadorAtual.id, {
            titulo: novosDados.arquivoFisico.name,
            descricao: "Plano Comercial atualizado",
            abaDestino: "ABA_1_PERFIL",
            tipoMaterial: "PLANO_COMERCIAL",
            caminhoStorage: null,
            urlExterna: null
        }, novosDados.arquivoFisico);
    }

    // 5. Se enviou nova Foto da empresa
    if (novosDados.fotoFisica) {
        await apiUploadMaterial(patrocinadorAtual.id, {
            titulo: novosDados.fotoFisica.name,
            descricao: "Foto / Logo da Empresa",
            abaDestino: "ABA_1_PERFIL",
            tipoMaterial: "FOTO_EMPRESA",
            caminhoStorage: null,
            urlExterna: null
        }, novosDados.fotoFisica);
    }

    await sincronizarDadosComBackend();
}

async function excluirPatrocinador(id) {
    await apiRequest(`/marcas/${id}/desativar`, "POST");
    await apiRequest(`/marcas/${id}`, "DELETE");
    await sincronizarDadosComBackend();
}

function atualizarTelaPatrocinadores(patrocinadorId) {
    if (document.body.classList.contains("sponsor-detail-page")) {
        const idAlvo = patrocinadorId || new URLSearchParams(window.location.search).get("id");
        renderizarDetalhePatrocinador(idAlvo);
    } else {
        renderizarPatrocinadores();
    }
}

// --- MODULO: Renderização dos Cards ---
function renderizarPatrocinadores(patrocinadoresParaExibir, modoDetalhes = false) {
    const grid = document.getElementById("patrocinadoresGrid");
    if (!grid) return;

    const patrocinadores = patrocinadoresParaExibir || listarPatrocinadores();
    grid.replaceChildren();

    if (patrocinadores.length === 0) {
        const mensagem = document.createElement("div");
        mensagem.className = "patrocinadores-vazio";
        mensagem.textContent = "Nenhum patrocinador cadastrado ainda.";
        grid.appendChild(mensagem);
        return;
    }

    patrocinadores.forEach(function (patrocinador) {
        const card = document.createElement("article");
        card.className = "patrocinador-card";
        card.dataset.patrocinadorId = String(patrocinador.id);
        card.dataset.cnpj = String(patrocinador.cnpj || "");

        const header = document.createElement("div");
        header.className = "patrocinador-card-header";

        const foto = document.createElement("div");
        foto.className = "patrocinador-foto";
        if (patrocinador.foto) {
            const imagem = document.createElement("img");
            imagem.src = patrocinador.foto;
            imagem.alt = `Foto de ${patrocinador.nome || "empresa"}`;
            foto.appendChild(imagem);
        } else {
            foto.classList.add("patrocinador-foto-vazia");
            foto.textContent = "Foto não cadastrada";
            if (modoDetalhes) {
                const seletorFoto = document.createElement("input");
                seletorFoto.type = "file";
                seletorFoto.accept = "image/jpeg,image/png,image/webp";
                seletorFoto.hidden = true;
                foto.setAttribute("role", "button");
                foto.tabIndex = 0;
                foto.title = "Clique para adicionar uma foto";
                foto.appendChild(seletorFoto);

                foto.addEventListener("click", event => {
                    event.stopPropagation();
                    seletorFoto.click();
                });
                seletorFoto.addEventListener("change", async () => {
                    const arquivo = seletorFoto.files?.[0];
                    if (!arquivo) return;
                    try {
                        validarArquivoFoto(arquivo);
                        await apiUploadMaterial(patrocinador.id, {
                            titulo: arquivo.name,
                            descricao: "Foto / Logo da Empresa",
                            abaDestino: "ABA_1_PERFIL",
                            tipoMaterial: "FOTO_EMPRESA",
                            caminhoStorage: null,
                            urlExterna: null
                        }, arquivo);
                        await sincronizarDadosComBackend();
                        renderizarDetalhePatrocinador(patrocinador.id);
                    } catch (erro) {
                        alert(erro.message || "Não foi possível salvar a foto.");
                    }
                });
            }
        }

        const nome = document.createElement("h3");
        nome.textContent = patrocinador.nome || "Empresa sem nome";
        const cota = document.createElement("span");
        cota.className = "patrocinador-cota";
        cota.textContent = patrocinador.cota || "Cota não informada";

        // MODO DASHBOARD PRINCIPAL (Card compacto sem dropdown)
        if (!modoDetalhes) {
            card.setAttribute("role", "link");
            card.tabIndex = 0;
            card.setAttribute("aria-label", `Abrir detalhes de ${patrocinador.nome || "empresa"}`);

            function abrirDetalhes() {
                const url = new URL("detalhes-patrocinador.html", window.location.href);
                url.searchParams.set("id", String(patrocinador.id));
                window.location.href = url.href;
            }

            card.addEventListener("click", event => {
                if (event.target.closest("button, a, input, select, textarea, label")) return;
                abrirDetalhes();
            });
            card.addEventListener("keydown", event => {
                if (event.target !== card || !["Enter", " "].includes(event.key)) return;
                event.preventDefault();
                abrirDetalhes();
            });

            header.append(foto, nome, cota);
            card.appendChild(header);
            grid.appendChild(card);
            return;
        }

        // MODO DETALHES DA EMPRESA: Cota ao lado do Nome + Botão Editar onde estava a Cota
        if (typeof window.definirTituloMarcaTopbar === "function") {
            window.definirTituloMarcaTopbar(patrocinador.nome);
        }

        const blocoNomeECota = document.createElement("div");
        blocoNomeECota.className = "titulo-cota-inline";
        blocoNomeECota.append(nome, cota);

        const botaoEditarTopo = document.createElement("button");
        botaoEditarTopo.type = "button";
        botaoEditarTopo.className = "button button-primary";
        botaoEditarTopo.textContent = "Editar";

        header.append(foto, blocoNomeECota, botaoEditarTopo);

        // 1. DADOS DA EMPRESA + SENHA PADRÃO INVISÍVEL COM MOSTRAR/OCULTAR
        const info = document.createElement("div");
        info.className = "patrocinador-info";

        function adicionarInfoSimples(rotulo, valor) {
            const item = document.createElement("div");
            item.className = "patrocinador-info-item";
            const titulo = document.createElement("strong");
            titulo.textContent = rotulo;
            const conteudo = document.createElement("span");
            conteudo.textContent = valor || "Não informado";
            item.append(titulo, conteudo);
            info.appendChild(item);
        }

        adicionarInfoSimples("CNPJ", patrocinador.cnpj);
        adicionarInfoSimples("E-mail", patrocinador.email);

        // Senha padrão da marca (invisível por padrão + botão Mostrar)
        const senhaReal = patrocinador.senhaPadrao || obterSenhaPadraoMarca(patrocinador.id, patrocinador.nome);
        const itemSenha = document.createElement("div");
        itemSenha.className = "patrocinador-info-item";
        const tituloSenha = document.createElement("strong");
        tituloSenha.textContent = "Senha padrão da marca";
        const linhaSenha = document.createElement("div");
        linhaSenha.className = "senha-padrao-inline";
        const valorSenha = document.createElement("span");
        valorSenha.textContent = "••••••••••";
        const btnMostrarSenha = document.createElement("button");
        btnMostrarSenha.type = "button";
        btnMostrarSenha.className = "btn-acao-pequeno";
        btnMostrarSenha.textContent = "Mostrar";
        let senhaVisivel = false;
        btnMostrarSenha.addEventListener("click", () => {
            senhaVisivel = !senhaVisivel;
            valorSenha.textContent = senhaVisivel ? senhaReal : "••••••••••";
            btnMostrarSenha.textContent = senhaVisivel ? "Ocultar" : "Mostrar";
        });
        linhaSenha.append(valorSenha, btnMostrarSenha);
        itemSenha.append(tituloSenha, linhaSenha);
        info.appendChild(itemSenha);

        // Plano Comercial (com opção de abrir ou remover)
        const itemPlano = document.createElement("div");
        itemPlano.className = "patrocinador-info-item";
        const tituloPlano = document.createElement("strong");
        tituloPlano.textContent = "Plano comercial";
        const linhaPlano = document.createElement("div");
        linhaPlano.className = "senha-padrao-inline";

        if (patrocinador.planoComercialUrl) {
            const linkPlano = document.createElement("a");
            linkPlano.href = patrocinador.planoComercialUrl;
            linkPlano.target = "_blank";
            linkPlano.rel = "noopener noreferrer";
            linkPlano.textContent = patrocinador.arquivo || "Abrir Plano Comercial";
            linkPlano.addEventListener("click", () => {
                if (patrocinador.planoComercialId) {
                    apiRequest(`/materiais/${patrocinador.planoComercialId}/acessar`, "POST").catch(() => { });
                }
            });

            const btnRemoverPlano = document.createElement("button");
            btnRemoverPlano.type = "button";
            btnRemoverPlano.className = "btn-acao-perigo";
            btnRemoverPlano.textContent = "Remover plano";
            btnRemoverPlano.addEventListener("click", async () => {
                if (!window.confirm("Deseja remover o Plano Comercial atual desta empresa?")) return;
                try {
                    await apiRequest(`/materiais/${patrocinador.planoComercialId}`, "DELETE");
                    await sincronizarDadosComBackend();
                    renderizarDetalhePatrocinador(patrocinador.id);
                } catch (erro) {
                    alert(erro.message || "Não foi possível remover o Plano Comercial.");
                }
            });
            linhaPlano.append(linkPlano, btnRemoverPlano);
        } else {
            const semPlano = document.createElement("span");
            semPlano.textContent = "Não informado";
            linhaPlano.appendChild(semPlano);
        }
        itemPlano.append(tituloPlano, linhaPlano);
        info.appendChild(itemPlano);

        // FORMULÁRIO DE EDIÇÃO INLINE (Abre na própria página ao clicar em Editar)
        const formEdicaoInline = document.createElement("form");
        formEdicaoInline.className = "form-edicao-inline";
        formEdicaoInline.hidden = true;
        formEdicaoInline.innerHTML = `
            <h4>Editar dados da empresa</h4>
            <div class="form-edicao-grid">
                <div class="form-group">
                    <label>Nome da empresa</label>
                    <input type="text" name="nome" value="${patrocinador.nome || ""}" required>
                </div>
                <div class="form-group">
                    <label>CNPJ</label>
                    <input type="text" name="cnpj" value="${patrocinador.cnpj || ""}" maxlength="18" required>
                </div>
                <div class="form-group">
                    <label>Cota</label>
                    <select name="cota" required>
                        <option value="Master" ${patrocinador.cota === "Master" ? "selected" : ""}>Master</option>
                        <option value="Subcota G" ${patrocinador.cota === "Subcota G" ? "selected" : ""}>Subcota G</option>
                        <option value="Subcota" ${patrocinador.cota === "Subcota" ? "selected" : ""}>Subcota</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Senha padrão da marca</label>
                    <input type="text" name="senhaPadrao" value="${senhaReal}" required>
                </div>
            </div>
            <div class="form-group" style="margin-top:8px;">
                <label>E-mails autorizados (separados por vírgula)</label>
                <input type="text" name="emails" value="${patrocinador.email || ""}" required>
            </div>
            <div class="form-edicao-grid" style="margin-top:8px;">
                <div class="form-group">
                    <label>Adicionar / Substituir Plano Comercial</label>
                    <input type="file" name="planoComercial">
                </div>
                <div class="form-group">
                    <label>Alterar Foto da Empresa</label>
                    <input type="file" name="fotoEmpresa" accept="image/png,image/jpeg,image/webp">
                </div>
            </div>
            <div class="form-actions" style="margin-top:12px;">
                <button type="button" class="form-cancel" id="btnCancelarEdicaoInline">Cancelar</button>
                <button type="submit" class="button button-primary">Salvar alterações</button>
            </div>
        `;

        botaoEditarTopo.addEventListener("click", () => {
            formEdicaoInline.hidden = !formEdicaoInline.hidden;
        });

        formEdicaoInline.querySelector("#btnCancelarEdicaoInline").addEventListener("click", () => {
            formEdicaoInline.hidden = true;
        });

        formEdicaoInline.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btnSalvar = formEdicaoInline.querySelector("[type='submit']");
            btnSalvar.disabled = true;
            btnSalvar.textContent = "Salvando...";
            try {
                const arqFoto = formEdicaoInline.elements.fotoEmpresa?.files?.[0] || null;
                validarArquivoFoto(arqFoto);

                await editarPatrocinadorInline(patrocinador, {
                    nome: formEdicaoInline.elements.nome.value.trim(),
                    cnpj: formEdicaoInline.elements.cnpj.value.trim(),
                    cota: formEdicaoInline.elements.cota.value,
                    email: formEdicaoInline.elements.emails.value.trim(),
                    senhaPadrao: formEdicaoInline.elements.senhaPadrao.value.trim(),
                    arquivoFisico: formEdicaoInline.elements.planoComercial?.files?.[0] || null,
                    fotoFisica: arqFoto
                });
                alert("Dados da empresa atualizados com sucesso!");
                renderizarDetalhePatrocinador(patrocinador.id);
            } catch (erro) {
                alert(erro.message || "Não foi possível atualizar os dados da empresa.");
            } finally {
                btnSalvar.disabled = false;
                btnSalvar.textContent = "Salvar alterações";
            }
        });

        // 2. CONTRATO DE PATROCÍNIO (Logo abaixo dos dados da empresa, antes de Mídia e Conteúdo)
        const secaoContratos = criarSecaoContratos(patrocinador);

        // 3. MÍDIA E CONTEÚDO (Dividido entre Envios da Marca e Envios da RBS)
        const secaoMidia = criarSecaoMidiaUnificada(patrocinador);

        // 4. CORTESIAS (Sem Lounge e com botão Editar dentro do bloco)
        const secaoCortesias = criarSecaoCortesias(patrocinador);

        // 5. EXCLUIR PATROCINADOR (Lá embaixo, exigindo digitar a senha padrão da empresa)
        const acoesRodape = document.createElement("div");
        acoesRodape.className = "patrocinador-acoes";
        acoesRodape.style.justifyContent = "flex-end";
        acoesRodape.style.marginTop = "16px";
        acoesRodape.style.paddingTop = "16px";
        acoesRodape.style.borderTop = "1px solid var(--border)";

        const botaoExcluir = document.createElement("button");
        botaoExcluir.type = "button";
        botaoExcluir.className = "btn-acao-perigo";
        botaoExcluir.style.padding = "9px 16px";
        botaoExcluir.textContent = "Excluir patrocinador";
        botaoExcluir.addEventListener("click", async function () {
            const senhaEsperada = patrocinador.senhaPadrao || obterSenhaPadraoMarca(patrocinador.id, patrocinador.nome);
            const senhaDigitada = window.prompt(
                `Medida de segurança: Para excluir permanentemente "${patrocinador.nome}", digite a senha padrão desta empresa:`
            );
            if (senhaDigitada === null) return;
            if (senhaDigitada.trim() !== senhaEsperada) {
                alert("Senha incorreta! A exclusão do patrocinador foi cancelada por segurança.");
                return;
            }
            try {
                await excluirPatrocinador(patrocinador.id);
                window.location.href = "indexAdministrador.html";
            } catch (erro) {
                alert(erro.message || "Não foi possível excluir o patrocinador.");
            }
        });

        acoesRodape.appendChild(botaoExcluir);

        const conteudoPatrocinador = document.createElement("div");
        conteudoPatrocinador.className = "patrocinador-conteudo";
        conteudoPatrocinador.hidden = false;
        conteudoPatrocinador.append(
            info,
            formEdicaoInline,
            secaoContratos,
            secaoMidia,
            secaoCortesias,
            acoesRodape
        );

        card.append(header, conteudoPatrocinador);
        grid.appendChild(card);
    });

    configurarFiltrosPatrocinadores();
}

function renderizarDetalhePatrocinador(id) {
    const grid = document.getElementById("patrocinadoresGrid");
    if (!grid) return;

    const patrocinador = listarPatrocinadores().find(
        item => String(item.id) === String(id)
    );
    if (!patrocinador) {
        const mensagem = document.createElement("div");
        mensagem.className = "patrocinadores-vazio";
        mensagem.textContent = "Esta empresa não foi encontrada.";
        grid.replaceChildren(mensagem);
        return;
    }

    renderizarPatrocinadores([patrocinador], true);
}

// --- Inicialização ---
document.addEventListener("DOMContentLoaded", async function () {
    const isDetailPage = document.body.classList.contains("sponsor-detail-page");
    const parametrosUrl = new URLSearchParams(window.location.search);
    const idDetalhe = parametrosUrl.get("id");

    await sincronizarDadosComBackend();

    if (isDetailPage) {
        renderizarDetalhePatrocinador(idDetalhe);
        document.getElementById("backToDashboard")?.addEventListener("click", function () {
            window.location.href = "indexAdministrador.html";
        });
        return;
    }

    renderizarPatrocinadores();

    const newSponsorButton = document.getElementById("newSponsorButton");
    const newSponsorForm = document.getElementById("newSponsorForm");
    const closeSponsorForm = document.getElementById("closeSponsorForm");
    const cancelSponsor = document.getElementById("cancelSponsor");
    const sponsorForm = document.getElementById("sponsorForm");

    function closeForm() {
        if (!newSponsorForm || !newSponsorButton) return;
        newSponsorForm.classList.remove("open");
        newSponsorButton.setAttribute("aria-expanded", "false");
    }

    if (newSponsorButton && newSponsorForm) {
        closeForm();
        newSponsorButton.addEventListener("click", function () {
            const isOpen = newSponsorForm.classList.toggle("open");
            newSponsorButton.setAttribute("aria-expanded", String(isOpen));
        });
        closeSponsorForm?.addEventListener("click", closeForm);
        cancelSponsor?.addEventListener("click", closeForm);
        document.addEventListener("click", function (event) {
            const clicouFora = !newSponsorForm.parentElement.contains(event.target);
            if (clicouFora) {
                closeForm();
            }
        });
    }

    if (sponsorForm) {
        const submitButton = sponsorForm.querySelector("[type='submit']");

        sponsorForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const nome = document.getElementById("sponsorName").value.trim();
            const cnpj = document.getElementById("sponsorCnpj").value.trim();
            const email = document.getElementById("sponsorEmails").value.trim();
            const cota = document.getElementById("sponsorQuota").value;
            const inputArquivo = document.getElementById("sponsorComercialPlan");
            const arquivoFisico = inputArquivo?.files?.[0] || null;
            const inputFoto = document.getElementById("sponsorPhoto");
            const fotoFisica = inputFoto?.files?.[0] || null;

            if (submitButton) submitButton.disabled = true;

            try {
                validarArquivoFoto(fotoFisica);

                await cadastrarPatrocinador({
                    nome,
                    cnpj,
                    email,
                    cota,
                    arquivo: arquivoFisico ? arquivoFisico.name : "",
                    arquivoFisico,
                    fotoFisica
                });

                alert("Patrocinador cadastrado com sucesso!");
                sponsorForm.reset();
                closeForm();
                renderizarPatrocinadores();
            } catch (erro) {
                console.error("Erro ao salvar patrocinador:", erro);
                alert(erro.message || "Não foi possível salvar o patrocinador.");
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        });
    }
});