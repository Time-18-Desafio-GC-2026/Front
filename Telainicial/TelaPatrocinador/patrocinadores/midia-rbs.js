// Portal RBS — módulo: midia-rbs.

// INTEGRAÇÃO BACK-END: substituir o catálogo local de mídias por endpoints e armazenamento da API.
const MIDIA_RBS_KEY = "rbs_midia_rbs";

function listarMidiaRBS() {

    return JSON.parse(

        localStorage.getItem(MIDIA_RBS_KEY) || "[]"

    );

}

function listarMidiaRBSPorPatrocinador(patrocinadorId) {

    return listarMidiaRBS().filter(

        item => item.patrocinadorId === patrocinadorId

    );

}

function salvarMidiaRBS(registro) {

    const registros = listarMidiaRBS();



    registros.push(registro);



    localStorage.setItem(

        MIDIA_RBS_KEY,

        JSON.stringify(registros)

    );

}





// Cria a área administrativa para adicionar e consultar mídia da RBS.

function criarAreaMidiaRBS(patrocinador) {

    const secao = document.createElement("div");

    secao.className = "midia-rbs";



    const titulo = document.createElement("h5");

    titulo.textContent = "Materiais publicados pela RBS";



    const lista = document.createElement("div");

    lista.className = "midia-rbs-lista";



    const formularioLink = document.createElement("form");

    formularioLink.className = "midia-rbs-form";



    const campoLink = document.createElement("input");

    campoLink.type = "url";

    campoLink.placeholder = "https://link-da-publicacao.com";

    campoLink.required = true;

    campoLink.setAttribute("aria-label", "Link da publicação");



    const botaoLink = document.createElement("button");

    botaoLink.type = "submit";

    botaoLink.textContent = "Adicionar link";



    formularioLink.append(campoLink, botaoLink);



    const formularioArquivo = document.createElement("div");

    formularioArquivo.className = "midia-rbs-arquivo";



    const campoArquivo = document.createElement("input");

    campoArquivo.type = "file";

    campoArquivo.accept = ".pdf,.jpg,.jpeg,.png";

    campoArquivo.hidden = true;



    const botaoArquivo = document.createElement("button");

    botaoArquivo.type = "button";

    botaoArquivo.textContent = "Adicionar relatório de mídia";



    botaoArquivo.addEventListener("click", function () {

        campoArquivo.click();

    });



    campoArquivo.addEventListener("change", function () {

        const arquivo = campoArquivo.files[0];



        if (!arquivo) return;



        if (arquivo.size > 1024 * 1024) {

            alert("Para este protótipo, selecione um arquivo de até 1 MB.");

            campoArquivo.value = "";

            return;

        }



        const leitor = new FileReader();



        leitor.onload = function () {

            try {

                salvarMidiaRBS({

                    id: crypto.randomUUID(),

                    patrocinadorId: patrocinador.id,

                    tipo: "relatorio",

                    nome: arquivo.name,

                    arquivoData: leitor.result,

                    criadoEm: new Date().toISOString()

                });



                registrarHistorico(

                    `Admin RBS enviou o arquivo "${arquivo.name}" para ${patrocinador.nome}.`

                );



                renderizarPatrocinadores();

            } catch (erro) {

                console.error(erro);

                alert("Não foi possível salvar o relatório. O armazenamento do navegador pode estar cheio.");

            }

        };



        leitor.readAsDataURL(arquivo);

    });



    formularioLink.addEventListener("submit", function (event) {

        event.preventDefault();



        const url = campoLink.value.trim();



        try {

            const endereco = new URL(url);



            if (!["http:", "https:"].includes(endereco.protocol)) {

                throw new Error("Use um endereço HTTP ou HTTPS.");

            }



            salvarMidiaRBS({

                id: crypto.randomUUID(),

                patrocinadorId: patrocinador.id,

                tipo: "link",

                url: endereco.href,

                criadoEm: new Date().toISOString()

            });



            registrarHistorico(

                `Admin RBS adicionou o link "${endereco.href}" para ${patrocinador.nome}.`

            );



            renderizarPatrocinadores();

        } catch (erro) {

            alert(erro.message || "Informe um link válido.");

        }

    });



    const registros = listarMidiaRBSPorPatrocinador(patrocinador.id);



    if (registros.length === 0) {

        const vazio = document.createElement("p");

        vazio.textContent = "Nenhum relatório ou link adicionado pela RBS.";

        vazio.className = "midia-rbs-vazio";

        lista.appendChild(vazio);

    }



    registros.forEach(function (registro) {

        const item = document.createElement("div");

        item.className = "midia-rbs-item";



        if (registro.tipo === "relatorio") {

            const linkArquivo = document.createElement("a");

            linkArquivo.href = registro.arquivoData;

            linkArquivo.target = "_blank";

            linkArquivo.rel = "noopener noreferrer";

            linkArquivo.textContent = "Visualizar relatório: " + registro.nome;



            linkArquivo.addEventListener("click", function () {

                registrarHistorico(

                    `Arquivo "${registro.nome}" visualizado por ${patrocinador.nome}.`

                );

            });



            const baixarArquivo = document.createElement("a");

            baixarArquivo.href = registro.arquivoData;

            baixarArquivo.download = registro.nome;

            baixarArquivo.textContent = "Baixar";



            baixarArquivo.addEventListener("click", function () {

                registrarHistorico(

                    `Arquivo "${registro.nome}" baixado por ${patrocinador.nome}.`

                );

            });



            item.append(linkArquivo, baixarArquivo);

        }



        if (registro.tipo === "link") {

            const linkPost = document.createElement("a");

            linkPost.href = registro.url;

            linkPost.target = "_blank";

            linkPost.rel = "noopener noreferrer";

            linkPost.textContent = registro.url;



            item.appendChild(linkPost);

        }



        lista.appendChild(item);

    });



    secao.append(

        titulo,

        lista,

        formularioLink,

        formularioArquivo

    );



    formularioArquivo.append(botaoArquivo, campoArquivo);



    return secao;

}



// ============================================================

// 6. FILTROS E NORMALIZAÇÃO DE TEXTO

// ============================================================
