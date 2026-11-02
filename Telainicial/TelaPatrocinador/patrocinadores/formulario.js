// Portal RBS — módulo: formulario.

// INTEGRAÇÃO BACK-END: substituir a edição local por uma atualização via API.
function editarPatrocinador(id, novosDados) {

    const patrocinadores = listarPatrocinadores();



    const indice = patrocinadores.findIndex(

        patrocinador => patrocinador.id === id

    );



    if (indice === -1) {

        throw new Error("Patrocinador não encontrado.");

    }



    patrocinadores[indice] = {

        ...patrocinadores[indice],

        nome: novosDados.nome,

        cnpj: novosDados.cnpj,

        email: novosDados.email,

        cota: novosDados.cota,

        arquivo: novosDados.arquivo

            ? novosDados.arquivo

            : patrocinadores[indice].arquivo

    };



    salvarPatrocinadores(patrocinadores);



    return patrocinadores[indice];

}





// Abre o formulário existente no HTML para editar uma empresa.

function abrirEdicaoPatrocinador(id) {

    const patrocinador = listarPatrocinadores().find(

        item => item.id === id

    );



    if (!patrocinador) {

        alert("Patrocinador não encontrado.");

        return;

    }



    document.getElementById("sponsorName").value =

        patrocinador.nome || "";



    document.getElementById("sponsorCnpj").value =

        patrocinador.cnpj || "";



    document.getElementById("sponsorEmails").value =

        patrocinador.email || "";



    document.getElementById("sponsorQuota").value =

        patrocinador.cota || "";



    document.getElementById("sponsorComercialPlan").value = "";



    document.getElementById("sponsorForm").dataset.editandoId = id;



    document.querySelector("#sponsorForm [type='submit']")

        .textContent = "Salvar alterações";



    document.querySelector("#newSponsorForm h3").textContent =

        "Editar patrocinador";



    document.getElementById("newSponsorForm").classList.add("open");



    document.getElementById("newSponsorButton")

        .setAttribute("aria-expanded", "true");

}



// ============================================================

// 9. GERENCIAMENTO E PERSISTÊNCIA DE CORTESIAS

// ============================================================
