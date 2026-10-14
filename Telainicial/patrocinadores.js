// esse documento se trata de um LocalStorage, a finalidade dele é de servir como um banco de dados temporário, até a implementação de um real

const STORAGE_KEY = "rbs_patrocinadores";

function listarPatrocinadores() {
    return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
    );
}

function salvarPatrocinadores(patrocinadores) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(patrocinadores)
    );
}

function cadastrarPatrocinador(dados) {
    const patrocinadores = listarPatrocinadores();

    const novoPatrocinador = {
        id: crypto.randomUUID(),
        nome: dados.nome,
        cnpj: dados.cnpj,
        email: dados.email,
        cota: dados.cota,
        texto: dados.texto,
        arquivo: dados.arquivo,
        criadoEm: new Date().toISOString()
    };

    patrocinadores.push(novoPatrocinador);
    salvarPatrocinadores(patrocinadores);

    return novoPatrocinador;
}

function excluirPatrocinador(id) {
    const patrocinadores = listarPatrocinadores();

    const atualizados = patrocinadores.filter(
        patrocinador => patrocinador.id !== id
    );

    salvarPatrocinadores(atualizados);
}


const ENVIOS_KEY = "rbs_envios";

// Lista os envios realizados por todos os patrocinadores.
function listarEnvios() {
    return JSON.parse(
        localStorage.getItem(ENVIOS_KEY) || "[]"
    );
}

// Lista somente os envios de uma empresa.
function listarEnviosPorPatrocinador(patrocinadorId) {
    return listarEnvios().filter(
        envio => envio.patrocinadorId === patrocinadorId
    );
}

// Registra um envio vinculado a uma empresa existente.
function cadastrarEnvio(patrocinadorId, dados) {
    const patrocinadores = listarPatrocinadores();

    const patrocinadorExiste = patrocinadores.some(
        patrocinador => patrocinador.id === patrocinadorId
    );

    if (!patrocinadorExiste) {
        throw new Error("Patrocinador não encontrado.");
    }

    const envios = listarEnvios();

    const novoEnvio = {
        id: crypto.randomUUID(),
        patrocinadorId: patrocinadorId,
        texto: dados.texto || "",
        arquivo: dados.arquivo || null,
        status: "Pendente",
        criadoEm: new Date().toISOString()
    };

    envios.push(novoEnvio);

    localStorage.setItem(
        ENVIOS_KEY,
        JSON.stringify(envios)
    );

    if (dados.arquivo || dados.texto) {
        const patrocinador = patrocinadores.find(
            item => item.id === patrocinadorId
        );
        const descricaoEnvio = dados.arquivo
            ? `o arquivo "${dados.arquivo}"`
            : "um conteúdo em texto";

        registrarHistorico(
            `A empresa "${patrocinador.nome}" enviou ${descricaoEnvio} para a equipe RBS.`,
            dados.atorEmail
        );
    }

    return novoEnvio;
}

//rbs envia relatorio demidia e link de post
const MIDIA_RBS_KEY = "rbs_midia_rbs";

function listarMidiaRBS() {
    return JSON.parse(
        localStorage.getItem(MIDIA_RBS_KEY) || "[]"
    );
}

function listarMidiaRBSPorPatrocinador(patrocinadorId) {
    return listarMidiaRBS().filter(
        item => item.patrocinadorId === patrocinadorId
    );
}

function salvarMidiaRBS(registro) {
    const registros = listarMidiaRBS();

    registros.push(registro);

    localStorage.setItem(
        MIDIA_RBS_KEY,
        JSON.stringify(registros)
    );
}


function criarAreaMidiaRBS(patrocinador) {
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
    botaoLink.textContent = "Adicionar link";

    formularioLink.append(campoLink, botaoLink);

    const formularioArquivo = document.createElement("div");
    formularioArquivo.className = "midia-rbs-arquivo";

    const campoArquivo = document.createElement("input");
    campoArquivo.type = "file";
    campoArquivo.accept = ".pdf,.jpg,.jpeg,.png";
    campoArquivo.hidden = true;

    const botaoArquivo = document.createElement("button");
    botaoArquivo.type = "button";
    botaoArquivo.textContent = "Adicionar relatório de mídia";

    botaoArquivo.addEventListener("click", function () {
        campoArquivo.click();
    });

    campoArquivo.addEventListener("change", function () {
        const arquivo = campoArquivo.files[0];

        if (!arquivo) return;

        if (arquivo.size > 1024 * 1024) {
            alert("Para este protótipo, selecione um arquivo de até 1 MB.");
            campoArquivo.value = "";
            return;
        }

        const leitor = new FileReader();

        leitor.onload = function () {
            try {
                salvarMidiaRBS({
                    id: crypto.randomUUID(),
                    patrocinadorId: patrocinador.id,
                    tipo: "relatorio",
                    nome: arquivo.name,
                    arquivoData: leitor.result,
                    criadoEm: new Date().toISOString()
                });

                registrarHistorico(
                    `Admin RBS enviou o arquivo "${arquivo.name}" para ${patrocinador.nome}.`
                );
                renderizarPatrocinadores();
            } catch (erro) {
                console.error(erro);
                alert("Não foi possível salvar o relatório. O armazenamento do navegador pode estar cheio.");
            }
        };

        leitor.readAsDataURL(arquivo);
    });

    formularioLink.addEventListener("submit", function (event) {
        event.preventDefault();

        const url = campoLink.value.trim();

        try {
            const endereco = new URL(url);

            if (!["http:", "https:"].includes(endereco.protocol)) {
                throw new Error("Use um endereço HTTP ou HTTPS.");
            }

            salvarMidiaRBS({
                id: crypto.randomUUID(),
                patrocinadorId: patrocinador.id,
                tipo: "link",
                url: endereco.href,
                criadoEm: new Date().toISOString()
            });

            // Registra quem adicionou o link e a qual empresa ele pertence.
            registrarHistorico(
                `Admin RBS adicionou o link "${endereco.href}" para ${patrocinador.nome}.`
            );
            renderizarPatrocinadores();
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
            linkArquivo.href = registro.arquivoData;
            linkArquivo.target = "_blank";
            linkArquivo.rel = "noopener noreferrer";
            linkArquivo.textContent = "Visualizar relatório: " + registro.nome;
            linkArquivo.addEventListener("click", function () {
                registrarHistorico(
                    `Arquivo "${registro.nome}" visualizado por ${patrocinador.nome}.`
                );
            });

            const baixarArquivo = document.createElement("a");
            baixarArquivo.href = registro.arquivoData;
            baixarArquivo.download = registro.nome;
            baixarArquivo.textContent = "Baixar";
            baixarArquivo.addEventListener("click", function () {
                registrarHistorico(
                    `Arquivo "${registro.nome}" baixado por ${patrocinador.nome}.`
                );
            });

            item.append(linkArquivo, baixarArquivo);
        }

        if (registro.tipo === "link") {
            const linkPost = document.createElement("a");
            linkPost.href = registro.url;
            linkPost.target = "_blank";
            linkPost.rel = "noopener noreferrer";
            linkPost.textContent = registro.url;

            item.appendChild(linkPost);
        }

        lista.appendChild(item);
    });

    secao.append(
        titulo,
        lista,
        formularioLink,
        formularioArquivo
    );

    formularioArquivo.append(botaoArquivo, campoArquivo);

    return secao;
}
 

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

    // Preenche o filtro com as cotas existentes.
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

    filtroCota.value = cotas.includes(cotaAnterior)
        ? cotaAnterior
        : "";

    function aplicarFiltros() {
        const busca = normalizarTexto(campoBusca.value);
        const cotaSelecionada = filtroCota.value;

        const cards = document.querySelectorAll(
            "#patrocinadoresGrid .patrocinador-card"
        );

        cards.forEach(card => {
            const nome = normalizarTexto(
                card.querySelector(".patrocinador-card-header h3")
                    ?.textContent
            );

            const cnpj = normalizarTexto(
                [...card.querySelectorAll(".patrocinador-info-item")]
                    .find(item =>
                        normalizarTexto(
                            item.querySelector("strong")?.textContent
                        ) === "cnpj"
                    )
                    ?.querySelector("span")?.textContent
            );

            const cota = card.querySelector(".patrocinador-cota")
                ?.textContent.trim() || "";

            const correspondeBusca =
                !busca ||
                nome.includes(busca) ||
                cnpj.includes(busca);

            const correspondeCota =
                !cotaSelecionada ||
                cota === cotaSelecionada;

            card.hidden = !(
                correspondeBusca && correspondeCota
            );
        });
    }

    campoBusca.addEventListener("input", aplicarFiltros);
    filtroCota.addEventListener("change", aplicarFiltros);

    aplicarFiltros();
}

// FUNÇÃO QUE GERA OS CARDS DOS PATROCINADORES
function renderizarPatrocinadores() {
    const grid = document.getElementById("patrocinadoresGrid");

    // Se a página não tiver a área dos cards, não faz nada.
    if (!grid) return;

    const patrocinadores = listarPatrocinadores();

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

        const header = document.createElement("div");
        header.className = "patrocinador-card-header";

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
        botaoRecolherTudo.setAttribute(
        "aria-label",
        "Recolher conteúdo do patrocinador"
    );

        header.append(nome, botaoRecolherTudo, cota);

        const info = document.createElement("div");
        info.className = "patrocinador-info";

        function adicionarInformacao(rotulo, valor) {
            const item = document.createElement("div");
            item.className = "patrocinador-info-item";

            const titulo = document.createElement("strong");
            titulo.textContent = rotulo;

            const conteudo = document.createElement("span");
            conteudo.textContent = valor || "Não informado";

            item.append(titulo, conteudo);
            info.appendChild(item);
        }

        adicionarInformacao("CNPJ", patrocinador.cnpj);
        adicionarInformacao("E-mail", patrocinador.email);
        adicionarInformacao(
            "Plano comercial",
            patrocinador.arquivo
        );
        
        // Busca os envios vinculados a esta empresa pelo ID.
        const envios = listarEnviosPorPatrocinador(patrocinador.id);

        const secaoEnvios = document.createElement("div");
        secaoEnvios.className = "patrocinador-envios";

        
        const cabecalhoEnvios = document.createElement("div");
        cabecalhoEnvios.className = "secao-cabecalho";

        const tituloEnvios = document.createElement("h4");
        tituloEnvios.textContent =
            `Mídia e Conteúdo (${envios.length})`;

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

                // Conteúdo textual enviado
                if (envio.texto) {
                    const texto = document.createElement("p");
                    texto.className = "envio-texto";
                    texto.textContent = `Arquivo em texto: ${envio.texto}`;
                    item.appendChild(texto);
                }

                // Arquivo enviado
                if (envio.arquivo) {
                    const arquivo = document.createElement("p");
                    arquivo.className = "envio-arquivo";
                    arquivo.textContent = `Arquivo em documento (Docx, pdf ou etc.): ${envio.arquivo}`;
                    item.appendChild(arquivo);
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

            botaoEnvios.setAttribute(
                "aria-expanded",
                String(!vaiRecolher)
            );
        });
             
        const acoes = document.createElement("div");
        acoes.className = "patrocinador-acoes";

        const botaoEditar = document.createElement("button");
        botaoEditar.type = "button";
        botaoEditar.className = "botao-editar";
        botaoEditar.textContent = "Editar";

        botaoEditar.addEventListener("click", function () {
            abrirEdicaoPatrocinador(patrocinador.id);
        });

        const botaoExcluir = document.createElement("button");
        botaoExcluir.type = "button";
        botaoExcluir.className = "botao-excluir";
        botaoExcluir.textContent = "Excluir";

        botaoExcluir.addEventListener("click", function () {
            const confirmar = confirm(
                `Deseja realmente excluir ${patrocinador.nome}?`
            );

            if (!confirmar) return;

            // Guarda a exclusão somente após a confirmação do usuário.
            registrarHistorico(
                `Admin RBS excluiu a empresa "${patrocinador.nome}".`
            );
            excluirPatrocinador(patrocinador.id);
            renderizarPatrocinadores();
        });

        
            
            acoes.append(botaoEditar, botaoExcluir);

            const secaoCortesias = criarSecaoCortesias(patrocinador);

            const conteudoPatrocinador = document.createElement("div");
            conteudoPatrocinador.className = "patrocinador-conteudo";
            conteudoPatrocinador.hidden = true;

            conteudoPatrocinador.append(
                info,
                secaoEnvios,
                secaoCortesias,
                acoes
            );

            card.append(header, conteudoPatrocinador);

            botaoRecolherTudo.addEventListener("click", function () {
                const vaiRecolher = !conteudoPatrocinador.hidden;

                conteudoPatrocinador.hidden = vaiRecolher;
                botaoRecolherTudo.textContent = vaiRecolher ? "⌄" : "⌃";

                botaoRecolherTudo.setAttribute(
                    "aria-expanded",
                    String(!vaiRecolher)
                );

                botaoRecolherTudo.setAttribute(
                    "aria-label",
                    vaiRecolher
                        ? "Expandir conteúdo do patrocinador"
                        : "Recolher conteúdo do patrocinador"
                );
            });

            grid.appendChild(card);
    });

    configurarFiltrosPatrocinadores();
}

document.addEventListener("DOMContentLoaded", renderizarPatrocinadores);

// FUNÇÃO QUE EDITA OS DADOS DE UM PATROCINADOR
function editarPatrocinador(id, novosDados) {
    const patrocinadores = listarPatrocinadores();

    const indice = patrocinadores.findIndex(
        patrocinador => patrocinador.id === id
    );

    if (indice === -1) {
        throw new Error("Patrocinador não encontrado.");
    }

    patrocinadores[indice] = {
        ...patrocinadores[indice],
        nome: novosDados.nome,
        cnpj: novosDados.cnpj,
        email: novosDados.email,
        cota: novosDados.cota,
        arquivo: novosDados.arquivo
            ? novosDados.arquivo
            : patrocinadores[indice].arquivo
    };

    salvarPatrocinadores(patrocinadores);

    return patrocinadores[indice];
}

    
const CORTESIAS_KEY = "rbs_cortesias";

const SETORES_CORTESIA = ["Arena", "Camarote", "Premium"];

function listarCortesias() {
    return JSON.parse(
        localStorage.getItem(CORTESIAS_KEY) || "[]"
    );
}

function obterCortesias(patrocinadorId) {
    const registro = listarCortesias().find(
        item => item.patrocinadorId === patrocinadorId
    );

    if (registro) return registro;

    // Valores iniciais para um patrocinador sem cortesias cadastradas.
    const setores = {};

    SETORES_CORTESIA.forEach(setor => {
        setores[setor] = {
            passaporte: 0,
            sexta: 0,
            sabado: 0
        };
    });

    return {
        patrocinadorId,
        setores,
        loungeInfo: ""
    };
}

function salvarCortesias(patrocinadorId, dados) {
    const patrocinadores = listarPatrocinadores();

    const existe = patrocinadores.some(
        patrocinador => patrocinador.id === patrocinadorId
    );

    if (!existe) {
        throw new Error("Patrocinador não encontrado.");
    }

    const registros = listarCortesias();

    const registro = {
        patrocinadorId,
        setores: {},
        loungeInfo: dados.loungeInfo || "",
        atualizadoEm: new Date().toISOString()
    };

    SETORES_CORTESIA.forEach(setor => {
        registro.setores[setor] = {
            passaporte: Math.max(
                0, Number(dados.setores?.[setor]?.passaporte) || 0
            ),
            sexta: Math.max(
                0, Number(dados.setores?.[setor]?.sexta) || 0
            ),
            sabado: Math.max(
                0, Number(dados.setores?.[setor]?.sabado) || 0
            )
        };
    });

    const indice = registros.findIndex(
        item => item.patrocinadorId === patrocinadorId
    );

    if (indice === -1) {
        registros.push(registro);
    } else {
        registros[indice] = registro;
    }

    localStorage.setItem(
        CORTESIAS_KEY,
        JSON.stringify(registros)
    );

    return registro;
}



function abrirEdicaoPatrocinador(id) {
    const patrocinador = listarPatrocinadores().find(
        item => item.id === id
    );

    if (!patrocinador) {
        alert("Patrocinador não encontrado.");
        return;
    }

    document.getElementById("sponsorName").value =
        patrocinador.nome || "";

    document.getElementById("sponsorCnpj").value =
        patrocinador.cnpj || "";

    document.getElementById("sponsorEmails").value =
        patrocinador.email || "";

    document.getElementById("sponsorQuota").value =
        patrocinador.cota || "";

    document.getElementById("sponsorComercialPlan").value = "";

    document.getElementById("sponsorForm").dataset.editandoId = id;

    document.querySelector("#sponsorForm [type='submit']")
        .textContent = "Salvar alterações";

    document.querySelector("#newSponsorForm h3").textContent =
        "Editar patrocinador";

    document.getElementById("newSponsorForm").classList.add("open");

    document.getElementById("newSponsorButton")
        .setAttribute("aria-expanded", "true");
}


function criarSecaoCortesias(patrocinador) {
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

    // Informações próprias do Lounge.
    const lounge = document.createElement("div");
    lounge.className = "cortesia-setor";

    const tituloLounge = document.createElement("h5");
    tituloLounge.textContent = "Lounge";

    const textoLounge = document.createElement("p");
    textoLounge.className = "lounge-info";
    textoLounge.textContent =
        dados.loungeInfo || "Nenhuma informação cadastrada.";

    lounge.append(tituloLounge, textoLounge);
    conteudoCortesias.append(grade, lounge);

    // Botão para abrir o formulário de edição.
    const botaoEditar = document.createElement("button");
    botaoEditar.type = "button";
    botaoEditar.className = "botao-editar-cortesias";
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

    formulario.addEventListener("submit", function (event) {
        event.preventDefault();

        const novosDados = {
            setores: {},
            loungeInfo: inputLounge.value.trim()
        };

        SETORES_CORTESIA.forEach(setor => {
            novosDados.setores[setor] = {};

            ["passaporte", "sexta", "sabado"].forEach(tipo => {
                novosDados.setores[setor][tipo] =
                    Number(campos[setor][tipo].value);
            });
        });

                try {
            salvarCortesias(patrocinador.id, novosDados);

            // Registra a alteração depois que as cortesias foram salvas.
            registrarHistorico(
                `Admin RBS editou as cortesias da empresa "${patrocinador.nome}".`
            );
            alert("Cortesias salvas com sucesso!");

            renderizarPatrocinadores();

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

            botaoCortesias.setAttribute(
                "aria-expanded",
                String(!vaiRecolher)
            );
        });

return secao;

}
