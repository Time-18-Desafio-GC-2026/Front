// Portal RBS — módulo: envios.

// INTEGRAÇÃO BACK-END: substituir a leitura/gravação local dos envios por endpoints da API.
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





// ============================================================

// 5. MÍDIA E PUBLICAÇÕES ENVIADAS PELA RBS

// ============================================================
