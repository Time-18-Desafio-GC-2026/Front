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

        card.append(header, info);
        grid.appendChild(card);
    });
}

document.addEventListener("DOMContentLoaded", renderizarPatrocinadores);
