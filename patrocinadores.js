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