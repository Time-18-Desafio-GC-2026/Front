// Portal RBS — módulo: storage.

// INTEGRAÇÃO BACK-END: substituir esta leitura/gravação local por endpoints de patrocinadores.
const PATROCINADORES_KEY = "rbs_patrocinadores";
const PATROCINADORES_CHANGE_EVENT = "rbs:patrocinadores-atualizados";
const PATROCINADORES_DEPENDENCY_KEYS = new Set([
    PATROCINADORES_KEY,
    "rbs_usuarios",
    "rbs_envios",
    "rbs_cortesias",
    "rbs_midia_rbs"
]);



// Recupera os patrocinadores salvos no localStorage.

function listarPatrocinadores() {

    return JSON.parse(

        localStorage.getItem(PATROCINADORES_KEY) || "[]"

    );

}



// Salva a lista atualizada de patrocinadores.

function salvarPatrocinadores(patrocinadores) {

    localStorage.setItem(

        PATROCINADORES_KEY,

        JSON.stringify(patrocinadores)

    );

    window.dispatchEvent(new Event(PATROCINADORES_CHANGE_EVENT));

}

function observarAtualizacoesPatrocinadores(callback) {
    const aoAlterarPatrocinadores = () => callback();
    const aoAlterarArmazenamento = event => {
        if (event.key === null || PATROCINADORES_DEPENDENCY_KEYS.has(event.key)) {
            callback();
        }
    };

    window.addEventListener(PATROCINADORES_CHANGE_EVENT, aoAlterarPatrocinadores);
    window.addEventListener("storage", aoAlterarArmazenamento);

    return function pararObservacao() {
        window.removeEventListener(PATROCINADORES_CHANGE_EVENT, aoAlterarPatrocinadores);
        window.removeEventListener("storage", aoAlterarArmazenamento);
    };

}





// ============================================================

// 2. VALIDAÇÃO DE E-MAILS E CRIAÇÃO DE CONTAS

// ============================================================
