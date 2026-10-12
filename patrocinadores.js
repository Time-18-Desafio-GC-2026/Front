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
