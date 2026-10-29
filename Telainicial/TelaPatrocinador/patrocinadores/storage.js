// Portal RBS — módulo: storage.

const PATROCINADORES_KEY = "rbs_patrocinadores";



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

}





// ============================================================

// 2. VALIDAÇÃO DE E-MAILS E CRIAÇÃO DE CONTAS

// ============================================================
