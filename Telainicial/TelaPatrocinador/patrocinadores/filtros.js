// Portal RBS — módulo: filtros.

function normalizarTexto(valor) {

    return String(valor || "")

        .normalize("NFD")

        .replace(/[\u0300-\u036f]/g, "")

        .toLowerCase()

        .trim();

}

function configurarFiltrosPatrocinadores() {

    const campoBusca = document.getElementById("buscarPatrocinador");

    const filtroCota = document.getElementById("filtrarCota");



    if (!campoBusca || !filtroCota) return;



    // Preenche o filtro com as cotas existentes.

    const cotaAnterior = filtroCota.value;



    const cotas = [...new Set(

        listarPatrocinadores()

            .map(patrocinador => patrocinador.cota)

            .filter(Boolean)

    )].sort((a, b) => a.localeCompare(b, "pt-BR"));



    filtroCota.replaceChildren();



    const opcaoTodas = document.createElement("option");

    opcaoTodas.value = "";

    opcaoTodas.textContent = "Todas as cotas";

    filtroCota.appendChild(opcaoTodas);



    cotas.forEach(cota => {

        const opcao = document.createElement("option");

        opcao.value = cota;

        opcao.textContent = cota;

        filtroCota.appendChild(opcao);

    });



    filtroCota.value = cotas.includes(cotaAnterior)

        ? cotaAnterior

        : "";



    function aplicarFiltros() {

        const busca = normalizarTexto(campoBusca.value);

        const cotaSelecionada = filtroCota.value;



        const cards = document.querySelectorAll(

            "#patrocinadoresGrid .patrocinador-card"

        );



        cards.forEach(card => {

            const nome = normalizarTexto(

                card.querySelector(".patrocinador-card-header h3")

                    ?.textContent

            );



            const cnpj = normalizarTexto(

                [...card.querySelectorAll(".patrocinador-info-item")]

                    .find(item =>

                        normalizarTexto(

                            item.querySelector("strong")?.textContent

                        ) === "cnpj"

                    )

                    ?.querySelector("span")?.textContent

            );



            const cota = card.querySelector(".patrocinador-cota")

                ?.textContent.trim() || "";



            const correspondeBusca =

                !busca ||

                nome.includes(busca) ||

                cnpj.includes(busca);



            const correspondeCota =

                !cotaSelecionada ||

                cota === cotaSelecionada;



            card.hidden = !(

                correspondeBusca && correspondeCota

            );

        });

    }



    campoBusca.addEventListener("input", aplicarFiltros);

    filtroCota.addEventListener("change", aplicarFiltros);



    aplicarFiltros();

}





// ============================================================

// 7. RENDERIZAÇÃO DOS CARDS DOS PATROCINADORES

// ============================================================
