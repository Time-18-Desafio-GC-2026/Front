// Portal RBS — módulo: cadastro.

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



// Exclui um patrocinador e os dados vinculados a ele.

function excluirPatrocinador(id) {

    const patrocinadores = listarPatrocinadores();



    const patrocinadorExiste = patrocinadores.some(

        patrocinador => patrocinador.id === id

    );



    if (!patrocinadorExiste) {

        throw new Error("Patrocinador não encontrado.");

    }



    // 1. Remove o cadastro da empresa.

    salvarPatrocinadores(

        patrocinadores.filter(

            patrocinador => patrocinador.id !== id

        )

    );



    // 2. Remove as contas vinculadas à empresa.

    const usuarios = JSON.parse(

        localStorage.getItem(USUARIOS_KEY) || "[]"

    );



    localStorage.setItem(

        USUARIOS_KEY,

        JSON.stringify(

            usuarios.filter(

                usuario => usuario.patrocinadorId !== id

            )

        )

    );



    // 3. Remove os envios da empresa.

    const envios = listarEnvios();



    localStorage.setItem(

        ENVIOS_KEY,

        JSON.stringify(

            envios.filter(

                envio => envio.patrocinadorId !== id

            )

        )

    );



    // 4. Remove as cortesias da empresa.

    const cortesias = listarCortesias();



    localStorage.setItem(

        CORTESIAS_KEY,

        JSON.stringify(

            cortesias.filter(

                cortesia => cortesia.patrocinadorId !== id

            )

        )

    );



    // 5. Remove os materiais publicados pela RBS para a empresa.

    const midias = listarMidiaRBS();



    localStorage.setItem(

        MIDIA_RBS_KEY,

        JSON.stringify(

            midias.filter(

                midia => midia.patrocinadorId !== id

            )

        )

    );



    // O histórico de atividades não é apagado.

}





// ============================================================

// 4. GERENCIAMENTO DOS ENVIOS DOS PATROCINADORES

// ============================================================
