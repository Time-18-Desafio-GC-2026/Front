
/**
 * Ponto de entrada do gerenciamento de patrocinadores.
 * Os arquivos auxiliares devem ser carregados antes deste arquivo.
 */

function inicializarPatrocinadores() {
    if (typeof renderizarPatrocinadores !== "function") {
        console.error(
            "Erro: a função renderizarPatrocinadores não foi carregada."
        );
        return;
    }

    renderizarPatrocinadores();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        inicializarPatrocinadores,
        { once: true }
    );
} else {
    inicializarPatrocinadores();
}
