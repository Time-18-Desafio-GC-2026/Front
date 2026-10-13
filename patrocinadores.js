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

    return novoEnvio;
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

        header.append(nome, cota);

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

        const tituloEnvios = document.createElement("h4");
        tituloEnvios.textContent = `Envios de conteúdo e mídia (${envios.length})`;

        secaoEnvios.appendChild(tituloEnvios);

        if (envios.length === 0) {
            const vazio = document.createElement("p");
            vazio.className = "envios-vazio";
            vazio.textContent = "Nenhum conteúdo enviado.";
            secaoEnvios.appendChild(vazio);
        } else {
            envios.forEach(function (envio) {
                const item = document.createElement("div");
                item.className = "envio-item";

                // Conteúdo textual enviado
                if (envio.texto) {
                    const texto = document.createElement("p");
                    texto.className = "envio-texto";
                    texto.textContent = envio.texto;
                    item.appendChild(texto);
                }

                // Arquivo enviado
                if (envio.arquivo) {
                    const arquivo = document.createElement("p");
                    arquivo.className = "envio-arquivo";
                    arquivo.textContent = `Arquivo: ${envio.arquivo}`;
                    item.appendChild(arquivo);
                }

                secaoEnvios.appendChild(item);
            });
        }
             
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

            excluirPatrocinador(patrocinador.id);
            renderizarPatrocinadores();
        });

        
            acoes.append(botaoEditar, botaoExcluir);

            const secaoCortesias = criarSecaoCortesias(patrocinador);

            card.append(
                header,
                info,
                secaoEnvios,
                secaoCortesias,
                acoes
            );

            grid.appendChild(card);

    });
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

    const titulo = document.createElement("h4");
    titulo.textContent = "Cortesias";

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
    secao.append(titulo, grade, lounge);

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

            alert("Cortesias salvas com sucesso!");

            renderizarPatrocinadores();

        } catch (erro) {
            console.error("Erro ao salvar cortesias:", erro);
            alert(erro.message || "Não foi possível salvar as cortesias.");
        }
    });

    secao.append(botaoEditar, formulario);

    return secao;
}
