// Portal RBS — módulo: cards.

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



        const botaoRecolherTudo = document.createElement("button");

        botaoRecolherTudo.type = "button";

        botaoRecolherTudo.className = "botao-recolher";

        botaoRecolherTudo.textContent = "⌄";

        botaoRecolherTudo.setAttribute("aria-expanded", "false");

        botaoRecolherTudo.setAttribute(

            "aria-label",

            "Recolher conteúdo do patrocinador"

        );



        header.append(nome, botaoRecolherTudo, cota);



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



        // Busca as contas vinculadas a este patrocinador.

        const usuarios = JSON.parse(

            localStorage.getItem("rbs_usuarios") || "[]"

        );



        const contasPatrocinador = usuarios.filter(

            usuario => usuario.patrocinadorId === patrocinador.id

        );



        // Comportamento original: exibe o e-mail e a senha de cada conta.

        contasPatrocinador.forEach(conta => {

            adicionarInformacao(

                `Senha (${conta.email})`,

                conta.senha

            );

        });



        // Busca os envios vinculados a esta empresa pelo ID.

        const envios = listarEnviosPorPatrocinador(patrocinador.id);



        const secaoEnvios = document.createElement("div");

        secaoEnvios.className = "patrocinador-envios";



        const cabecalhoEnvios = document.createElement("div");

        cabecalhoEnvios.className = "secao-cabecalho";



        const tituloEnvios = document.createElement("h4");

        tituloEnvios.textContent =

            `Mídia e Conteúdo (${envios.length})`;



        const botaoEnvios = document.createElement("button");

        botaoEnvios.type = "button";

        botaoEnvios.className = "botao-recolher";

        botaoEnvios.textContent = "⌄";

        botaoEnvios.setAttribute("aria-expanded", "false");



        const conteudoEnvios = document.createElement("div");

        conteudoEnvios.className = "secao-conteudo";

        conteudoEnvios.hidden = true;



        const tituloMateriaisCliente = document.createElement("h5");

        tituloMateriaisCliente.className = "titulo-materiais-cliente";

        tituloMateriaisCliente.textContent =

            "Materiais enviados pelo patrocinador";



        conteudoEnvios.appendChild(tituloMateriaisCliente);



        cabecalhoEnvios.append(tituloEnvios, botaoEnvios);

        secaoEnvios.append(cabecalhoEnvios, conteudoEnvios);



        if (envios.length === 0) {

            const vazio = document.createElement("p");

            vazio.className = "envios-vazio";

            vazio.textContent = "Nenhum conteúdo enviado.";

            conteudoEnvios.appendChild(vazio);

        } else {

            envios.forEach(function (envio) {

                const item = document.createElement("div");

                item.className = "envio-item";



                // Conteúdo textual enviado.

                if (envio.texto) {

                    const texto = document.createElement("p");

                    texto.className = "envio-texto";

                    texto.textContent = `Arquivo em texto: ${envio.texto}`;

                    item.appendChild(texto);

                }



                // Arquivo enviado.

                if (envio.arquivo) {

                    const linkArquivo = document.createElement("a");

                    linkArquivo.className = "envio-arquivo";



                    // Compatibilidade com envios antigos que guardavam

                    // somente o nome do arquivo.

                    if (

                        typeof envio.arquivo === "object" &&

                        envio.arquivo.arquivoData

                    ) {

                        linkArquivo.href = envio.arquivo.arquivoData;

                        linkArquivo.download =

                            envio.arquivo.nome || "arquivo-enviado";

                        linkArquivo.textContent =

                            "Baixar arquivo: " + linkArquivo.download;

                    } else {

                        // Registros antigos não possuem o conteúdo.

                        linkArquivo.removeAttribute("href");

                        linkArquivo.textContent =

                            "Arquivo antigo (somente nome): " +

                            String(envio.arquivo);

                    }



                    item.appendChild(linkArquivo);

                }



                conteudoEnvios.appendChild(item);

            });

        }



        const areaMidiaRBS = criarAreaMidiaRBS(patrocinador);

        conteudoEnvios.appendChild(areaMidiaRBS);



        botaoEnvios.addEventListener("click", function () {

            const vaiRecolher = !conteudoEnvios.hidden;



            conteudoEnvios.hidden = vaiRecolher;

            botaoEnvios.textContent = vaiRecolher ? "⌄" : "⌃";



            botaoEnvios.setAttribute(

                "aria-expanded",

                String(!vaiRecolher)

            );

        });



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



            // Registra quem realizou a exclusão.

            const sessaoAtual = JSON.parse(

                localStorage.getItem("rbs_sessao") || "null"

            );



            const usuarios = JSON.parse(

                localStorage.getItem("rbs_usuarios") || "[]"

            );



            const usuarioAtual = usuarios.find(usuario =>

                String(usuario.id) === String(sessaoAtual?.usuarioId)

            );



            registrarHistorico(

                `Admin RBS excluiu a empresa "${patrocinador.nome}".`,

                usuarioAtual?.email ||

                    sessaoAtual?.email ||

                    "Conta não identificada"

            );



            excluirPatrocinador(patrocinador.id);

            renderizarPatrocinadores();

        });



        acoes.append(botaoEditar, botaoExcluir);



        const secaoCortesias = criarSecaoCortesias(patrocinador);



        const conteudoPatrocinador = document.createElement("div");

        conteudoPatrocinador.className = "patrocinador-conteudo";

        conteudoPatrocinador.hidden = true;



        conteudoPatrocinador.append(

            info,

            secaoEnvios,

            secaoCortesias,

            acoes

        );



        card.append(header, conteudoPatrocinador);



        botaoRecolherTudo.addEventListener("click", function () {

            const vaiRecolher = !conteudoPatrocinador.hidden;



            conteudoPatrocinador.hidden = vaiRecolher;

            botaoRecolherTudo.textContent = vaiRecolher ? "⌄" : "⌃";



            botaoRecolherTudo.setAttribute(

                "aria-expanded",

                String(!vaiRecolher)

            );



            botaoRecolherTudo.setAttribute(

                "aria-label",

                vaiRecolher

                    ? "Expandir conteúdo do patrocinador"

                    : "Recolher conteúdo do patrocinador"

            );

        });



        grid.appendChild(card);

    });



    configurarFiltrosPatrocinadores();

}
// ============================================================

// 8. EDIÇÃO DE DADOS DO PATROCINADOR

// ============================================================
