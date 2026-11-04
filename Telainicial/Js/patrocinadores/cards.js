// Portal RBS — módulo: cards.

// INTEGRAÇÃO BACK-END: obter os dados de conta e sessão usados nas ações pelos serviços de autenticação.
function renderizarPatrocinadores(patrocinadoresParaExibir, modoDetalhes = false) {

    const grid = document.getElementById("patrocinadoresGrid");



    // Se a página não tiver a área dos cards, não faz nada.

    if (!grid) return;



    const patrocinadores = patrocinadoresParaExibir || listarPatrocinadores();



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
        card.dataset.patrocinadorId = String(patrocinador.id);

        if (!modoDetalhes) {
            card.setAttribute("role", "link");
            card.tabIndex = 0;
            card.setAttribute(
                "aria-label",
                `Abrir detalhes de ${patrocinador.nome || "empresa"}`
            );

            function abrirDetalhes() {
                const url = new URL("detalhes-patrocinador.html", window.location.href);
                url.searchParams.set("id", String(patrocinador.id));
                window.location.href = url.href;
            }

            card.addEventListener("click", event => {
                if (event.target.closest("button, a, input, select, textarea, label")) return;
                abrirDetalhes();
            });
            card.addEventListener("keydown", event => {
                if (event.target !== card || !["Enter", " "].includes(event.key)) return;
                event.preventDefault();
                abrirDetalhes();
            });
        }



        const header = document.createElement("div");

        header.className = "patrocinador-card-header";

        const foto = document.createElement("div");
        foto.className = "patrocinador-foto";
        if (patrocinador.foto) {
            const imagem = document.createElement("img");
            imagem.src = patrocinador.foto;
            imagem.alt = `Foto de ${patrocinador.nome || "empresa"}`;
            foto.appendChild(imagem);
        } else {
            foto.classList.add("patrocinador-foto-vazia");
            foto.textContent = "Foto não cadastrada";

            if (modoDetalhes) {
                const seletorFoto = document.createElement("input");
                seletorFoto.type = "file";
                seletorFoto.accept = "image/jpeg,image/png,image/webp";
                seletorFoto.hidden = true;
                seletorFoto.setAttribute("aria-label", `Selecionar foto de ${patrocinador.nome || "empresa"}`);

                foto.setAttribute("role", "button");
                foto.tabIndex = 0;
                foto.setAttribute("aria-label", `Adicionar foto para ${patrocinador.nome || "empresa"}`);
                foto.title = "Clique para adicionar uma foto";
                foto.appendChild(seletorFoto);

                foto.addEventListener("click", event => {
                    event.stopPropagation();
                    seletorFoto.click();
                });
                foto.addEventListener("keydown", event => {
                    if (!["Enter", " "].includes(event.key)) return;
                    event.preventDefault();
                    event.stopPropagation();
                    seletorFoto.click();
                });
                seletorFoto.addEventListener("change", () => {
                    const arquivo = seletorFoto.files?.[0];
                    if (!arquivo) return;

                    if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) {
                        alert("A foto deve estar no formato JPG, PNG ou WEBP.");
                        seletorFoto.value = "";
                        return;
                    }
                    if (arquivo.size > 2 * 1024 * 1024) {
                        alert("A foto deve ter no máximo 2 MB.");
                        seletorFoto.value = "";
                        return;
                    }

                    const leitor = new FileReader();
                    leitor.addEventListener("load", () => {
                        if (typeof leitor.result !== "string") {
                            alert("Não foi possível ler a foto selecionada.");
                            return;
                        }

                        try {
                            editarPatrocinador(patrocinador.id, {
                                nome: patrocinador.nome,
                                cnpj: patrocinador.cnpj,
                                email: patrocinador.email,
                                cota: patrocinador.cota,
                                arquivo: patrocinador.arquivo,
                                foto: leitor.result
                            });
                            renderizarDetalhePatrocinador(patrocinador.id);
                        } catch (erro) {
                            console.error("Erro ao salvar a foto da empresa:", erro);
                            alert(erro.message || "Não foi possível salvar a foto.");
                        }
                    });
                    leitor.addEventListener("error", () => {
                        console.error("Não foi possível ler a foto selecionada.");
                        alert("Não foi possível ler a foto selecionada.");
                    });
                    leitor.readAsDataURL(arquivo);
                });
            }
        }


        const nome = document.createElement("h3");

        nome.textContent = patrocinador.nome || "Empresa sem nome";



        const cota = document.createElement("span");

        cota.className = "patrocinador-cota";

        cota.textContent = patrocinador.cota || "Cota não informada";



        header.append(foto, nome);

        if (modoDetalhes) {
            const botaoRecolherTudo = document.createElement("button");
            botaoRecolherTudo.type = "button";
            botaoRecolherTudo.className = "botao-recolher";
            botaoRecolherTudo.textContent = "⌄";
            botaoRecolherTudo.setAttribute("aria-expanded", "false");
            botaoRecolherTudo.setAttribute(
                "aria-label",
                "Recolher conteúdo do patrocinador"
            );
            header.appendChild(botaoRecolherTudo);

            botaoRecolherTudo.addEventListener("click", function () {
                const vaiRecolher = !conteudoPatrocinador.hidden;
                conteudoPatrocinador.hidden = vaiRecolher;
                botaoRecolherTudo.textContent = vaiRecolher ? "⌄" : "⌃";
                botaoRecolherTudo.setAttribute("aria-expanded", String(!vaiRecolher));
                botaoRecolherTudo.setAttribute(
                    "aria-label",
                    vaiRecolher
                        ? "Expandir conteúdo do patrocinador"
                        : "Recolher conteúdo do patrocinador"
                );
            });
        }

        header.appendChild(cota);



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

                    const linhaTexto = document.createElement("div");

                    linhaTexto.className = "envio-linha";

                    const texto = document.createElement("p");

                    texto.className = "envio-texto";

                    texto.textContent = `Arquivo em texto: ${envio.texto}`;

                    const baixarTexto = document.createElement("a");

                    baixarTexto.className = "envio-download";
                    if (modoDetalhes) {
                        baixarTexto.classList.add("button", "button-primary");
                    }

                    baixarTexto.href = URL.createObjectURL(
                        new Blob([envio.texto], {
                            type: "text/plain;charset=utf-8"
                        })
                    );

                    baixarTexto.download =
                        `conteudo-enviado-${envio.id || "patrocinador"}.txt`;

                    baixarTexto.textContent = "Baixar conteúdo";

                    linhaTexto.append(texto, baixarTexto);

                    item.appendChild(linhaTexto);

                }



                // Arquivo enviado.

                if (envio.arquivo) {

                    // Compatibilidade com envios antigos que guardavam
                    // somente o nome do arquivo.

                    if (

                        typeof envio.arquivo === "object" &&

                        envio.arquivo.arquivoData

                    ) {

                        const linhaArquivo = document.createElement("div");
                        linhaArquivo.className = "envio-linha";

                        const nomeArquivo = document.createElement("p");
                        nomeArquivo.className = "envio-arquivo-nome";
                        nomeArquivo.textContent =
                            `Mídia: ${envio.arquivo.nome || "Arquivo enviado"}`;

                        const baixarArquivo = document.createElement("a");
                        baixarArquivo.className = "envio-download";
                        if (modoDetalhes) {
                            baixarArquivo.classList.add("button", "button-primary");
                        }
                        baixarArquivo.href = envio.arquivo.arquivoData;
                        baixarArquivo.download =
                            envio.arquivo.nome || "arquivo-enviado";
                        baixarArquivo.textContent = "Baixar mídia";

                        linhaArquivo.append(nomeArquivo, baixarArquivo);
                        item.appendChild(linhaArquivo);

                    } else {

                        // Registros antigos não possuem o conteúdo.

                        const arquivoAntigo = document.createElement("p");
                        arquivoAntigo.className = "envio-arquivo";
                        arquivoAntigo.textContent =

                            "Arquivo antigo (somente nome): " +

                            String(envio.arquivo);

                        item.appendChild(arquivoAntigo);
                    }

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
        if (modoDetalhes) {
            botaoEditar.classList.add("button", "button-primary");
        }

        botaoEditar.textContent = "Editar";



        botaoEditar.addEventListener("click", function () {
            if (modoDetalhes) {
                const url = new URL("index.html", window.location.href);
                url.searchParams.set("editar", String(patrocinador.id));
                url.searchParams.set("voltarParaEmpresa", String(patrocinador.id));
                url.hash = "dashboard";
                window.location.href = url.href;
                return;
            }

            abrirEdicaoPatrocinador(patrocinador.id);

        });



        const botaoExcluir = document.createElement("button");

        botaoExcluir.type = "button";

        botaoExcluir.className = "botao-excluir";
        if (modoDetalhes) {
            botaoExcluir.classList.add("button", "button-primary");
        }

        botaoExcluir.textContent = "Excluir";



        botaoExcluir.addEventListener("click", function () {

            const confirmar = confirm(

                `Deseja realmente excluir ${patrocinador.nome}?`

            );



            if (!confirmar) return;



            excluirPatrocinador(patrocinador.id);

            if (typeof registrarHistorico === "function") {
                registrarHistorico(
                    `Admin RBS excluiu a empresa "${patrocinador.nome}".`
                );
            } else {
                console.error("Registro de auditoria indisponível ao excluir patrocinador.");
            }

            if (modoDetalhes) {
                window.location.href = "index.html#dashboard";
            } else {
                renderizarPatrocinadores();
            }

        });



        const secaoCortesias = criarSecaoCortesias(patrocinador);
        const botaoEditarCortesias = modoDetalhes
            ? secaoCortesias.querySelector(".botao-editar-cortesias")
            : null;

        if (modoDetalhes && botaoEditarCortesias) {
            acoes.append(botaoEditar, botaoEditarCortesias, botaoExcluir);
        } else {
            acoes.append(botaoEditar, botaoExcluir);
        }



        const conteudoPatrocinador = document.createElement("div");

        conteudoPatrocinador.className = "patrocinador-conteudo";

        conteudoPatrocinador.hidden = true;



        conteudoPatrocinador.append(info, secaoEnvios, secaoCortesias, acoes);


        card.append(header, conteudoPatrocinador);



        grid.appendChild(card);

    });



    if (typeof configurarFiltrosPatrocinadores === "function") {
        configurarFiltrosPatrocinadores();
    }

}

function renderizarDetalhePatrocinador(id) {
    const grid = document.getElementById("patrocinadoresGrid");
    if (!grid) return;

    const patrocinador = listarPatrocinadores().find(
        item => String(item.id) === String(id)
    );

    if (!patrocinador) {
        const mensagem = document.createElement("div");
        mensagem.className = "patrocinadores-vazio";
        mensagem.textContent = "Esta empresa não foi encontrada.";
        grid.replaceChildren(mensagem);
        return;
    }

    renderizarPatrocinadores([patrocinador], true);

    const card = grid.querySelector(".patrocinador-card");
    const conteudo = card?.querySelector(".patrocinador-conteudo");
    const botaoPrincipal = card?.querySelector(
        ".patrocinador-card-header .botao-recolher"
    );

    if (conteudo) conteudo.hidden = false;
    if (botaoPrincipal) {
        botaoPrincipal.textContent = "⌃";
        botaoPrincipal.setAttribute("aria-expanded", "true");
        botaoPrincipal.setAttribute("aria-label", "Recolher conteúdo do patrocinador");
    }

    card?.querySelectorAll(".secao-conteudo").forEach(secao => {
        secao.hidden = false;
        const botao = secao.previousElementSibling?.querySelector(".botao-recolher");
        if (botao) {
            botao.textContent = "⌃";
            botao.setAttribute("aria-expanded", "true");
        }
    });
}
// ============================================================

// 8. EDIÇÃO DE DADOS DO PATROCINADOR

// ============================================================
