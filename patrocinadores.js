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
        tituloEnvios.textContent = `Envios de conteúdo (${envios.length})`;

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

        // Mantém a ordem visual: dados da empresa, envios e ações.
        card.append(header, info, secaoEnvios, acoes);
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
