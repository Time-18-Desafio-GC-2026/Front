// Portal RBS — módulo: storage.


const PATROCINADORES_KEY = "rbs_patrocinadores";

function listarPatrocinadores() {
    return lerListaLocalStorage(PATROCINADORES_KEY);
}

function salvarPatrocinadores(patrocinadores) {
    salvarListaLocalStorage(
        PATROCINADORES_KEY,
        patrocinadores
    );
}



/**
 * Lê uma lista do localStorage.
 * Retorna uma lista vazia quando a chave não existe.
 */
function lerListaLocalStorage(chave) {
    try {
        const dados = JSON.parse(
            localStorage.getItem(chave) || "[]"
        );

        if (!Array.isArray(dados)) {
            console.error(
                `O dado armazenado em "${chave}" não é uma lista.`
            );

            return [];
        }

        return dados;
    } catch (erro) {
        console.error(
            `Erro ao ler "${chave}" do localStorage:`,
            erro
        );

        return [];
    }
}

/**
 * Salva uma lista no localStorage.
 */
function salvarListaLocalStorage(chave, dados) {
    if (!Array.isArray(dados)) {
        throw new TypeError(
            "O valor a ser salvo precisa ser uma lista."
        );
    }

    localStorage.setItem(chave, JSON.stringify(dados));
}

// ============================================================

// 2. VALIDAÇÃO DE E-MAILS E CRIAÇÃO DE CONTAS

// ============================================================
