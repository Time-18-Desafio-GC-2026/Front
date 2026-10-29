// Portal RBS — módulo: cortesias.

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

                0,

                Number(dados.setores?.[setor]?.passaporte) || 0

            ),

            sexta: Math.max(

                0,

                Number(dados.setores?.[setor]?.sexta) || 0

            ),

            sabado: Math.max(

                0,

                Number(dados.setores?.[setor]?.sabado) || 0

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





// ============================================================

// 10. INTERFACE E FORMULÁRIO DE CORTESIAS

// ============================================================

function criarSecaoCortesias(patrocinador) {

    const dados = obterCortesias(patrocinador.id);



    const secao = document.createElement("section");

    secao.className = "patrocinador-cortesias";



    const cabecalhoCortesias = document.createElement("div");

    cabecalhoCortesias.className = "secao-cabecalho";



    const titulo = document.createElement("h4");

    titulo.textContent = "Cortesias";



    const botaoCortesias = document.createElement("button");

    botaoCortesias.type = "button";

    botaoCortesias.className = "botao-recolher";

    botaoCortesias.textContent = "⌄";

    botaoCortesias.setAttribute("aria-expanded", "false");



    cabecalhoCortesias.append(titulo, botaoCortesias);



    const conteudoCortesias = document.createElement("div");

    conteudoCortesias.className = "secao-conteudo";

    conteudoCortesias.hidden = true;



    const grade = document.createElement("div");

    grade.className = "cortesias-grade";



    // Adiciona uma linha de informação de cortesia.

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



    // Exibe os setores e suas quantidades de cortesias.

    SETORES_CORTESIA.forEach(setor => {

        const bloco = document.createElement("div");

        bloco.className = "cortesia-setor";



        const nomeSetor = document.createElement("h5");

        nomeSetor.textContent = setor;

        bloco.appendChild(nomeSetor);



        const quantidades = dados.setores[setor] || {};



        adicionarResumo(

            bloco,

            "Passaporte",

            quantidades.passaporte

        );



        adicionarResumo(

            bloco,

            "Sexta-feira",

            quantidades.sexta

        );



        adicionarResumo(

            bloco,

            "Sábado",

            quantidades.sabado

        );



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



    conteudoCortesias.append(grade, lounge);



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



    // Cria os campos numéricos de cada setor.

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



    // Campo de informações do Lounge.

    const labelLounge = document.createElement("label");

    labelLounge.className = "campo-cortesia";

    labelLounge.textContent = "Informações do Lounge";



    const inputLounge = document.createElement("textarea");

    inputLounge.rows = 3;

    inputLounge.value = dados.loungeInfo || "";

    inputLounge.placeholder =

        "Descreva as informações do Lounge...";



    labelLounge.appendChild(inputLounge);

    formulario.appendChild(labelLounge);



    // Botões de salvar e cancelar.

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



    // Abre o formulário.

    botaoEditar.addEventListener("click", function () {

        formulario.hidden = false;

        botaoEditar.hidden = true;

    });



    // Cancela a edição.

    cancelar.addEventListener("click", function () {

        formulario.reset();

        formulario.hidden = true;

        botaoEditar.hidden = false;

    });



    // Salva as cortesias.

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



            registrarHistorico(

                `Admin RBS editou as cortesias da empresa "${patrocinador.nome}".`

            );



            alert("Cortesias salvas com sucesso!");



            renderizarPatrocinadores();

        } catch (erro) {

            console.error("Erro ao salvar cortesias:", erro);



            alert(

                erro.message ||

                "Não foi possível salvar as cortesias."

            );

        }

    });



    conteudoCortesias.append(botaoEditar, formulario);



    secao.append(

        cabecalhoCortesias,

        conteudoCortesias

    );



    // Expande ou recolhe a seção de cortesias.

    botaoCortesias.addEventListener("click", function () {

        const vaiRecolher = !conteudoCortesias.hidden;



        conteudoCortesias.hidden = vaiRecolher;

        botaoCortesias.textContent = vaiRecolher ? "⌄" : "⌃";



        botaoCortesias.setAttribute(

            "aria-expanded",

            String(!vaiRecolher)

        );

    });



    return secao;

}
