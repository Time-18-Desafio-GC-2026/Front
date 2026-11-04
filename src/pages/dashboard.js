// ==========================================================================
// PORTAL RBS — CONTROLADOR CONSOLIDADO DO PAINEL ADMIN (DRY + SUPABASE STORAGE)
// ==========================================================================
const PATROCINADORES_KEY = "rbs_patrocinadores";
const USUARIOS_KEY = "rbs_usuarios";
const ENVIOS_KEY = "rbs_envios";
const MIDIA_RBS_KEY = "rbs_midia_rbs";
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
 * Sincroniza o estado do Front-end buscando Marcas, Allow-list e Materiais reais do PostgreSQL + Supabase Storage.
 */
async function sincronizarDadosComBackend() {
    try {
        const [marcasApi, usuariosApi] = await Promise.all([
            apiRequest("/marcas", "GET"),
            apiRequest("/usuarios", "GET").catch(() => [])
        ]);
        if (!Array.isArray(marcasApi)) return;

        const cacheAnterior = listarPatrocinadores();
        const senhasTemporarias = JSON.parse(localStorage.getItem("rbs_senhas_padrao") || "{}");
        const patrocinadoresSincronizados = [];
        const enviosCliente = [];
        const midiasRbs = [];
        const cortesiasBanco = [];

        for (const m of marcasApi) {
            const anterior = cacheAnterior.find(item => item.id === m.id) || {};
            const contasDaMarca = (usuariosApi || []).filter(
                u => String(u.marcaId) === String(m.id)
            );
            const emailsFormatados = contasDaMarca.length > 0
                ? contasDaMarca.map(u => u.email).join(", ")
                : (anterior.email || "");

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
                    loungeInfo: cortesiaApi.loungeInfo || "",
                    atualizadoEm: cortesiaApi.atualizadoEm
                });
            }

            const planoComercial = (materiaisApi || []).find(mat => mat.tipoMaterial === "PLANO_COMERCIAL");
            const fotoEmpresaMat = (materiaisApi || []).find(mat => mat.tipoMaterial === "FOTO_EMPRESA");

            (materiaisApi || []).forEach(mat => {
                const urlArquivoNuvem = mat.caminhoStorage || mat.urlExterna || null;
                if (mat.autorPerfil === "PATROCINADOR") {
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
                cota: traduzirCotaParaFront(m.cota),
                arquivo: planoComercial ? planoComercial.titulo : (anterior.arquivo || ""),
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
                senha: senhasTemporarias[u.marcaId] || "Protegida (BCrypt)",
                perfil: u.perfil === "PATROCINADOR" ? "patrocinador" : "funcionario",
                patrocinadorId: u.marcaId
            }))
        ));
        localStorage.setItem(ENVIOS_KEY, JSON.stringify(enviosCliente));
        localStorage.setItem(MIDIA_RBS_KEY, JSON.stringify(midiasRbs));
        localStorage.setItem(CORTESIAS_KEY, JSON.stringify(cortesiasBanco));
    } catch (erro) {
        console.error("Erro ao sincronizar com o Back-end:", erro);
    }
}

// --- MODULO: Validação de E-mails ---
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

// --- MODULO: Leitura de Envios ---
function listarEnvios() {
    return JSON.parse(localStorage.getItem(ENVIOS_KEY) || "[]");
}

function listarEnviosPorPatrocinador(patrocinadorId) {
    return listarEnvios().filter(
        envio => String(envio.patrocinadorId) === String(patrocinadorId)
    );
}

// --- MODULO: Mídia e Publicações RBS (Conectado ao Supabase Storage) ---
function listarMidiaRBS() {
    return JSON.parse(localStorage.getItem(MIDIA_RBS_KEY) || "[]");
}

function listarMidiaRBSPorPatrocinador(patrocinadorId) {
    return listarMidiaRBS().filter(item => item.patrocinadorId === patrocinadorId);
}

function criarAreaMidiaRBS(patrocinador) {
    const modoDetalhes = document.body.classList.contains("sponsor-detail-page");
    const secao = document.createElement("div");
    secao.className = "midia-rbs";
    const titulo = document.createElement("h5");
    titulo.textContent = "Materiais publicados pela RBS";
    const lista = document.createElement("div");
    lista.className = "midia-rbs-lista";

    const formularioLink = document.createElement("form");
    formularioLink.className = "midia-rbs-form";
    const campoLink = document.createElement("input");
    campoLink.type = "url";
    campoLink.placeholder = "https://link-da-publicacao.com";
    campoLink.required = true;
    campoLink.setAttribute("aria-label", "Link da publicação");
    const botaoLink = document.createElement("button");
    botaoLink.type = "submit";
    if (modoDetalhes) botaoLink.classList.add("button", "button-primary");
    botaoLink.textContent = "Adicionar link";
    formularioLink.append(campoLink, botaoLink);

    const formularioArquivo = document.createElement("div");
    formularioArquivo.className = "midia-rbs-arquivo";
    const campoArquivo = document.createElement("input");
    campoArquivo.type = "file";
    campoArquivo.accept = ".pdf,.jpg,.jpeg,.png,.xlsx,.xls";
    campoArquivo.hidden = true;
    const botaoArquivo = document.createElement("button");
    botaoArquivo.type = "button";
    if (modoDetalhes) botaoArquivo.classList.add("button", "button-primary");
    botaoArquivo.textContent = "Adicionar relatório de mídia";
    botaoArquivo.addEventListener("click", function () {
        campoArquivo.click();
    });

    // Upload real de arquivo pela RBS para o Supabase Storage (até 20 MB) + Gatilho Python se for .xlsx
    campoArquivo.addEventListener("change", async function () {
        const arquivo = campoArquivo.files[0];
        if (!arquivo) return;
        botaoArquivo.disabled = true;
        botaoArquivo.textContent = "Enviando para a nuvem...";
        try {
            await apiUploadMaterial(patrocinador.id, {
                titulo: arquivo.name,
                descricao: "Relatório de mídia publicado pela RBS",
                abaDestino: "ABA_3_MIDIA",
                tipoMaterial: "PLANILHA_MIDIA",
                caminhoStorage: null,
                urlExterna: null
            }, arquivo);
            alert("Relatório de mídia enviado com sucesso para o Supabase Storage!");
            await sincronizarDadosComBackend();
            atualizarTelaPatrocinadores(patrocinador.id);
        } catch (erro) {
            console.error(erro);
            alert(erro.message || "Não foi possível salvar o relatório.");
        } finally {
            botaoArquivo.disabled = false;
            botaoArquivo.textContent = "Adicionar relatório de mídia";
            campoArquivo.value = "";
        }
    });

    // Registro de Link de Publicação pela RBS via Multipart
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

    const registros = listarMidiaRBSPorPatrocinador(patrocinador.id);
    if (registros.length === 0) {
        const vazio = document.createElement("p");
        vazio.textContent = "Nenhum relatório ou link adicionado pela RBS.";
        vazio.className = "midia-rbs-vazio";
        lista.appendChild(vazio);
    }

    registros.forEach(function (registro) {
        const item = document.createElement("div");
        item.className = "midia-rbs-item";
        if (registro.tipo === "relatorio") {
            const linkArquivo = document.createElement("a");
            linkArquivo.className = "envio-arquivo-nome";
            linkArquivo.href = registro.arquivoData;
            linkArquivo.target = "_blank";
            linkArquivo.rel = "noopener noreferrer";
            linkArquivo.textContent = "Visualizar relatório: " + registro.nome;
            linkArquivo.addEventListener("click", function () {
                if (registro.id) {
                    apiRequest(`/materiais/${registro.id}/acessar`, "POST").catch(() => { });
                }
            });

            const baixarArquivo = document.createElement("a");
            baixarArquivo.className = "envio-download button button-primary";
            baixarArquivo.href = registro.arquivoData;
            baixarArquivo.target = "_blank";
            baixarArquivo.rel = "noopener noreferrer";
            baixarArquivo.download = registro.nome;
            baixarArquivo.textContent = "Baixar";
            baixarArquivo.addEventListener("click", function () {
                if (registro.id) {
                    apiRequest(`/materiais/${registro.id}/acessar`, "POST").catch(() => { });
                }
            });

            const linhaRelatorio = document.createElement("div");
            linhaRelatorio.className = "envio-linha";
            linhaRelatorio.append(linkArquivo, baixarArquivo);
            item.appendChild(linhaRelatorio);
        }
        if (registro.tipo === "link") {
            const linkPost = document.createElement("a");
            linkPost.href = registro.url;
            linkPost.target = "_blank";
            linkPost.rel = "noopener noreferrer";
            linkPost.textContent = registro.url;
            linkPost.addEventListener("click", function () {
                if (registro.id) {
                    apiRequest(`/materiais/${registro.id}/acessar`, "POST").catch(() => { });
                }
            });
            item.appendChild(linkPost);
        }
        lista.appendChild(item);
    });

    formularioArquivo.append(botaoArquivo, campoArquivo);
    secao.append(titulo, lista, formularioLink, formularioArquivo);
    return secao;
}

// --- MODULO: Cortesias ---
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
    return { patrocinadorId, setores, loungeInfo: "" };
}

function criarSecaoCortesias(patrocinador) {
    const modoDetalhes = document.body.classList.contains("sponsor-detail-page");
    const dados = obterCortesias(patrocinador.id);
    const secao = document.createElement("section");
    secao.className = "patrocinador-cortesias";
    const cabecalhoCortesias = document.createElement("div");
    cabecalhoCortesias.className = "secao-cabecalho";
    const titulo = document.createElement("h4");
    titulo.textContent = "Cortesias";
    const botaoCortesias = document.createElement("button");
    botaoCortesias.type = "button";
    botaoCortesias.className = "botao-recolher";
    botaoCortesias.textContent = "⌄";
    botaoCortesias.setAttribute("aria-expanded", "false");
    cabecalhoCortesias.append(titulo, botaoCortesias);

    const conteudoCortesias = document.createElement("div");
    conteudoCortesias.className = "secao-conteudo";
    conteudoCortesias.hidden = true;
    const grade = document.createElement("div");
    grade.className = "cortesias-grade";

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

    const lounge = document.createElement("div");
    lounge.className = "cortesia-setor";
    const tituloLounge = document.createElement("h5");
    tituloLounge.textContent = "Lounge";
    const textoLounge = document.createElement("p");
    textoLounge.className = "lounge-info";
    textoLounge.textContent = dados.loungeInfo || "Nenhuma informação cadastrada.";
    lounge.append(tituloLounge, textoLounge);
    conteudoCortesias.append(grade, lounge);

    const botaoEditar = document.createElement("button");
    botaoEditar.type = "button";
    botaoEditar.className = "botao-editar-cortesias";
    if (modoDetalhes) botaoEditar.classList.add("button", "button-primary");
    botaoEditar.textContent = "Editar cortesias";

    const formulario = document.createElement("form");
    formulario.className = "form-cortesias";
    formulario.hidden = true;
    const tituloFormulario = document.createElement("h5");
    tituloFormulario.textContent = "Definir quantidades";
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

    const labelLounge = document.createElement("label");
    labelLounge.className = "campo-cortesia";
    labelLounge.textContent = "Informações do Lounge";
    const inputLounge = document.createElement("textarea");
    inputLounge.rows = 3;
    inputLounge.value = dados.loungeInfo || "";
    inputLounge.placeholder = "Descreva as informações do Lounge...";
    labelLounge.appendChild(inputLounge);
    formulario.appendChild(labelLounge);

    const botoes = document.createElement("div");
    botoes.className = "cortesias-acoes";
    const salvar = document.createElement("button");
    salvar.type = "submit";
    if (modoDetalhes) salvar.classList.add("button", "button-primary");
    salvar.textContent = "Salvar";
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
            loungeInfo: inputLounge.value.trim()
        };
        try {
            await apiRequest(`/marcas/${patrocinador.id}/cortesias`, "PUT", payloadApi);
            alert("Cortesias salvas com sucesso no banco de dados!");
            await sincronizarDadosComBackend();
            atualizarTelaPatrocinadores(patrocinador.id);
        } catch (erro) {
            console.error("Erro ao salvar cortesias:", erro);
            alert(erro.message || "Não foi possível salvar as cortesias.");
        }
    });

    conteudoCortesias.append(botaoEditar, formulario);
    secao.append(cabecalhoCortesias, conteudoCortesias);
    botaoCortesias.addEventListener("click", function () {
        const vaiRecolher = !conteudoCortesias.hidden;
        conteudoCortesias.hidden = vaiRecolher;
        botaoCortesias.textContent = vaiRecolher ? "⌄" : "⌃";
        botaoCortesias.setAttribute("aria-expanded", String(!vaiRecolher));
    });
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
            const cnpj = normalizarTexto(
                [...card.querySelectorAll(".patrocinador-info-item")]
                    .find(item => normalizarTexto(item.querySelector("strong")?.textContent) === "cnpj")
                    ?.querySelector("span")?.textContent
            );
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

// --- MODULO: Cadastro, Edição e Exclusão com Upload Físico para o Supabase Storage ---
async function cadastrarPatrocinador(dados) {
    const emailsValidos = validarEmailsPatrocinador(dados.email);
    const prefixoLimpo = dados.nome.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6) || "Marca";
    const senhaPadraoInicial = `${prefixoLimpo}@2026`;

    const marcaCriada = await apiRequest("/marcas", "POST", {
        nome: dados.nome,
        cnpj: dados.cnpj,
        cota: traduzirCotaParaApi(dados.cota),
        senhaPadrao: senhaPadraoInicial
    });

    const senhasPadrao = JSON.parse(localStorage.getItem("rbs_senhas_padrao") || "{}");
    senhasPadrao[marcaCriada.id] = senhaPadraoInicial;
    localStorage.setItem("rbs_senhas_padrao", JSON.stringify(senhasPadrao));

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

async function editarPatrocinador(id, novosDados) {
    const marcaAtualizada = await apiRequest(`/marcas/${id}`, "PUT", {
        nome: novosDados.nome,
        cnpj: novosDados.cnpj,
        cota: traduzirCotaParaApi(novosDados.cota)
    });

    const emailsDigitados = normalizarEmailsPatrocinador(novosDados.email);
    const usuariosAtuais = JSON.parse(localStorage.getItem(USUARIOS_KEY) || "[]");
    for (const email of emailsDigitados) {
        const jaExiste = usuariosAtuais.some(
            u => String(u.email || "").toLowerCase() === email
        );
        if (!jaExiste) {
            await apiRequest(`/marcas/${id}/patrocinadores`, "POST", {
                email: email,
                nome: novosDados.nome
            });
        }
    }

    if (novosDados.arquivoFisico) {
        await apiUploadMaterial(id, {
            titulo: novosDados.arquivoFisico.name,
            descricao: "Plano Comercial atualizado",
            abaDestino: "ABA_1_PERFIL",
            tipoMaterial: "PLANO_COMERCIAL",
            caminhoStorage: null,
            urlExterna: null
        }, novosDados.arquivoFisico);
    }

    if (novosDados.fotoFisica) {
        await apiUploadMaterial(id, {
            titulo: novosDados.fotoFisica.name,
            descricao: "Foto / Logo da Empresa",
            abaDestino: "ABA_1_PERFIL",
            tipoMaterial: "FOTO_EMPRESA",
            caminhoStorage: null,
            urlExterna: null
        }, novosDados.fotoFisica);
    }

    await sincronizarDadosComBackend();
    return marcaAtualizada;
}

async function excluirPatrocinador(id) {
    await apiRequest(`/marcas/${id}/desativar`, "POST");
    await apiRequest(`/marcas/${id}`, "DELETE");
    await sincronizarDadosComBackend();
}

function abrirEdicaoPatrocinador(id) {
    const patrocinador = listarPatrocinadores().find(item => String(item.id) === String(id));
    if (!patrocinador) {
        alert("Patrocinador não encontrado.");
        return;
    }
    document.getElementById("sponsorName").value = patrocinador.nome || "";
    document.getElementById("sponsorCnpj").value = patrocinador.cnpj || "";
    document.getElementById("sponsorEmails").value = patrocinador.email || "";
    document.getElementById("sponsorQuota").value = patrocinador.cota || "";
    document.getElementById("sponsorComercialPlan").value = "";
    const inputFoto = document.getElementById("sponsorPhoto");
    if (inputFoto) inputFoto.value = "";
    document.getElementById("sponsorForm").dataset.editandoId = id;
    document.querySelector("#sponsorForm [type='submit']").textContent = "Salvar alterações";
    document.querySelector("#newSponsorForm h3").textContent = "Editar patrocinador";
    document.getElementById("newSponsorForm").classList.add("open");
    document.getElementById("newSponsorButton").setAttribute("aria-expanded", "true");
}

function atualizarTelaPatrocinadores(patrocinadorId) {
    if (document.body.classList.contains("sponsor-detail-page")) {
        const idAlvo = patrocinadorId || new URLSearchParams(window.location.search).get("id");
        renderizarDetalhePatrocinador(idAlvo);
    } else {
        renderizarPatrocinadores();
    }
}

// --- MODULO: Renderização dos Cards (Listagem Geral e Modo Detalhes da Empresa) ---
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
        }

        const header = document.createElement("div");
        header.className = "patrocinador-card-header";

        // Bloco de Foto / Logo da empresa adicionado pelo seu colega
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
                seletorFoto.setAttribute("aria-label", `Selecionar foto de ${patrocinador.nome || "empresa"}`);
                foto.setAttribute("role", "button");
                foto.tabIndex = 0;
                foto.setAttribute("aria-label", `Adicionar foto para ${patrocinador.nome || "empresa"}`);
                foto.title = "Clique para adicionar uma foto";
                foto.appendChild(seletorFoto);

                foto.addEventListener("click", event => {
                    event.stopPropagation();
                    seletorFoto.click();
                });
                seletorFoto.addEventListener("keydown", event => {
                    if (!["Enter", " "].includes(event.key)) return;
                    event.preventDefault();
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

        const botaoRecolherTudo = document.createElement("button");
        botaoRecolherTudo.type = "button";
        botaoRecolherTudo.className = "botao-recolher";
        botaoRecolherTudo.textContent = "⌄";
        botaoRecolherTudo.setAttribute("aria-expanded", "false");
        botaoRecolherTudo.setAttribute("aria-label", "Recolher conteúdo do patrocinador");

        header.append(foto, nome, botaoRecolherTudo, cota);

        const info = document.createElement("div");
        info.className = "patrocinador-info";

        function adicionarInformacao(rotulo, valor, urlLink = null, materialId = null) {
            const item = document.createElement("div");
            item.className = "patrocinador-info-item";
            const titulo = document.createElement("strong");
            titulo.textContent = rotulo;
            const conteudo = document.createElement("span");
            if (urlLink) {
                const link = document.createElement("a");
                link.href = urlLink;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = valor || "Abrir arquivo";
                link.addEventListener("click", () => {
                    if (materialId) apiRequest(`/materiais/${materialId}/acessar`, "POST").catch(() => { });
                });
                conteudo.appendChild(link);
            } else {
                conteudo.textContent = valor || "Não informado";
            }
            item.append(titulo, conteudo);
            info.appendChild(item);
        }

        adicionarInformacao("CNPJ", patrocinador.cnpj);
        adicionarInformacao("E-mail", patrocinador.email);
        adicionarInformacao(
            "Plano comercial",
            patrocinador.arquivo,
            patrocinador.planoComercialUrl,
            patrocinador.planoComercialId
        );

        const usuarios = JSON.parse(localStorage.getItem(USUARIOS_KEY) || "[]");
        const contasPatrocinador = usuarios.filter(usuario => usuario.patrocinadorId === patrocinador.id);
        contasPatrocinador.forEach(conta => {
            adicionarInformacao(`Senha (${conta.email})`, conta.senha);
        });

        const envios = listarEnviosPorPatrocinador(patrocinador.id);
        const secaoEnvios = document.createElement("div");
        secaoEnvios.className = "patrocinador-envios";
        const cabecalhoEnvios = document.createElement("div");
        cabecalhoEnvios.className = "secao-cabecalho";
        const tituloEnvios = document.createElement("h4");
        tituloEnvios.textContent = `Mídia e Conteúdo (${envios.length})`;
        const botaoEnvios = document.createElement("button");
        botaoEnvios.type = "button";
        botaoEnvios.className = "botao-recolher";
        botaoEnvios.textContent = "⌄";
        botaoEnvios.setAttribute("aria-expanded", "false");

        const conteudoEnvios = document.createElement("div");
        conteudoEnvios.className = "secao-conteudo";
        conteudoEnvios.hidden = true;

        const tituloMateriaisCliente = document.createElement("h5");
        tituloMateriaisCliente.className = "titulo-materiais-cliente";
        tituloMateriaisCliente.textContent = "Materiais enviados pelo patrocinador";
        conteudoEnvios.appendChild(tituloMateriaisCliente);

        cabecalhoEnvios.append(tituloEnvios, botaoEnvios);
        secaoEnvios.append(cabecalhoEnvios, conteudoEnvios);

        if (envios.length === 0) {
            const vazio = document.createElement("p");
            vazio.className = "envios-vazio";
            vazio.textContent = "Nenhum conteúdo enviado.";
            conteudoEnvios.appendChild(vazio);
        } else {
            envios.forEach(function (envio) {
                const item = document.createElement("div");
                item.className = "envio-item";
                if (envio.texto) {
                    const linhaTexto = document.createElement("div");
                    linhaTexto.className = "envio-linha";
                    const texto = document.createElement("p");
                    texto.className = "envio-texto";
                    texto.textContent = `Arquivo em texto: ${envio.texto}`;
                    const baixarTexto = document.createElement("a");
                    baixarTexto.className = "envio-download";
                    if (modoDetalhes) baixarTexto.classList.add("button", "button-primary");
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
                    nomeArquivo.textContent = `Mídia: ${envio.arquivo.nome || "Arquivo enviado"}`;
                    const baixarArquivo = document.createElement("a");
                    baixarArquivo.className = "envio-download";
                    if (modoDetalhes) baixarArquivo.classList.add("button", "button-primary");
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
                conteudoEnvios.appendChild(item);
            });
        }

        const areaMidiaRBS = criarAreaMidiaRBS(patrocinador);
        conteudoEnvios.appendChild(areaMidiaRBS);

        botaoEnvios.addEventListener("click", function () {
            const vaiRecolher = !conteudoEnvios.hidden;
            conteudoEnvios.hidden = vaiRecolher;
            botaoEnvios.textContent = vaiRecolher ? "⌄" : "⌃";
            botaoEnvios.setAttribute("aria-expanded", String(!vaiRecolher));
        });

        const acoes = document.createElement("div");
        acoes.className = "patrocinador-acoes";

        const botaoEditar = document.createElement("button");
        botaoEditar.type = "button";
        botaoEditar.className = "botao-editar";
        if (modoDetalhes) botaoEditar.classList.add("button", "button-primary");
        botaoEditar.textContent = "Editar";
        botaoEditar.addEventListener("click", function () {
            if (modoDetalhes) {
                const url = new URL("indexAdministrador.html", window.location.href);
                url.searchParams.set("editar", String(patrocinador.id));
                url.searchParams.set("voltarParaEmpresa", String(patrocinador.id));
                url.hash = "dashboard";
                window.location.href = url.href;
                return;
            }
            abrirEdicaoPatrocinador(patrocinador.id);
        });

        const botaoExcluir = document.createElement("button");
        botaoExcluir.type = "button";
        botaoExcluir.className = "botao-excluir";
        if (modoDetalhes) botaoExcluir.classList.add("button", "button-primary");
        botaoExcluir.textContent = "Excluir";
        botaoExcluir.addEventListener("click", async function () {
            if (!confirm(`Deseja realmente excluir ${patrocinador.nome}?`)) return;
            try {
                await excluirPatrocinador(patrocinador.id);
                if (modoDetalhes) {
                    window.location.href = "indexAdministrador.html#dashboard";
                } else {
                    renderizarPatrocinadores();
                }
            } catch (erro) {
                alert(erro.message || "Não foi possível excluir o patrocinador.");
            }
        });

        const secaoCortesias = criarSecaoCortesias(patrocinador);
        const botaoEditarCortesias = modoDetalhes
            ? secaoCortesias.querySelector(".botao-editar-cortesias")
            : null;

        if (modoDetalhes && botaoEditarCortesias) {
            acoes.append(botaoEditar, botaoEditarCortesias, botaoExcluir);
        } else {
            acoes.append(botaoEditar, botaoExcluir);
        }

        const conteudoPatrocinador = document.createElement("div");
        conteudoPatrocinador.className = "patrocinador-conteudo";
        conteudoPatrocinador.hidden = true;
        conteudoPatrocinador.append(info, secaoEnvios, secaoCortesias, acoes);

        card.append(header, conteudoPatrocinador);

        botaoRecolherTudo.addEventListener("click", function () {
            const vaiRecolher = !conteudoPatrocinador.hidden;
            conteudoPatrocinador.hidden = vaiRecolher;
            botaoRecolherTudo.textContent = vaiRecolher ? "⌄" : "⌃";
            botaoRecolherTudo.setAttribute("aria-expanded", String(!vaiRecolher));
        });

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

    const card = grid.querySelector(".patrocinador-card");
    const conteudo = card?.querySelector(".patrocinador-conteudo");
    const botaoPrincipal = card?.querySelector(".patrocinador-card-header .botao-recolher");
    if (conteudo) conteudo.hidden = false;
    if (botaoPrincipal) {
        botaoPrincipal.textContent = "⌃";
        botaoPrincipal.setAttribute("aria-expanded", "true");
        botaoPrincipal.setAttribute("aria-label", "Recolher conteúdo do patrocinador");
    }
    card?.querySelectorAll(".secao-conteudo").forEach(secao => {
        secao.hidden = false;
        const botao = secao.previousElementSibling?.querySelector(".botao-recolher");
        if (botao) {
            botao.textContent = "⌃";
            botao.setAttribute("aria-expanded", "true");
        }
    });
}

// --- Inicialização e Eventos do Formulário Principal ---
document.addEventListener("DOMContentLoaded", async function () {
    const isDetailPage = document.body.classList.contains("sponsor-detail-page");
    const parametrosUrl = new URLSearchParams(window.location.search);
    const idDetalhe = parametrosUrl.get("id");
    const idParaEditar = parametrosUrl.get("editar");
    const idParaVoltar = parametrosUrl.get("voltarParaEmpresa");
    const retornarParaDetalheId = idParaEditar && idParaEditar === idParaVoltar ? idParaVoltar : null;

    await sincronizarDadosComBackend();

    if (isDetailPage) {
        renderizarDetalhePatrocinador(idDetalhe);
        document.getElementById("backToDashboard")?.addEventListener("click", function () {
            window.location.href = "indexAdministrador.html#dashboard";
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
            const clicouEmEditar = event.target.closest(".botao-editar");
            if (clicouFora && !clicouEmEditar) {
                closeForm();
            }
        });
    }

    if (sponsorForm) {
        const submitButton = sponsorForm.querySelector("[type='submit']");
        const tituloFormulario = newSponsorForm?.querySelector("h3");

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

                const dados = {
                    nome,
                    cnpj,
                    email,
                    cota,
                    arquivo: arquivoFisico ? arquivoFisico.name : "",
                    arquivoFisico,
                    fotoFisica
                };

                const idEdicao = sponsorForm.dataset.editandoId;
                if (idEdicao) {
                    await editarPatrocinador(idEdicao, dados);
                    alert("Patrocinador atualizado com sucesso no banco de dados!");
                    delete sponsorForm.dataset.editandoId;
                } else {
                    await cadastrarPatrocinador(dados);
                    alert("Patrocinador, Allow-list e Plano Comercial salvos com sucesso!");
                }

                sponsorForm.reset();
                closeForm();
                if (submitButton) submitButton.textContent = "Cadastrar patrocinador";
                if (tituloFormulario) tituloFormulario.textContent = "Novo patrocinador";

                if (idEdicao && retornarParaDetalheId === idEdicao) {
                    const detalheUrl = new URL("detalhes-patrocinador.html", window.location.href);
                    detalheUrl.searchParams.set("id", idEdicao);
                    window.location.replace(detalheUrl.href);
                    return;
                }

                renderizarPatrocinadores();
            } catch (erro) {
                console.error("Erro ao salvar patrocinador:", erro);
                alert(erro.message || "Não foi possível salvar o patrocinador.");
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
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