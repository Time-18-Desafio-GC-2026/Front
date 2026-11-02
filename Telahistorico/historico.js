// Mantém o histórico no mesmo armazenamento local usado pelo portal.
// INTEGRAÇÃO BACK-END: trocar leitura/gravação local por endpoints de auditoria centralizados.
var HISTORICO_KEY = "rbs_historico";
var USUARIO_EMAIL_KEY = "rbs_usuario_email";


function registrarHistorico(acao, emailAtor) {
    try {
        var historico = JSON.parse(
            localStorage.getItem(HISTORICO_KEY) || "[]"
        );

        if (!Array.isArray(historico)) {
            throw new TypeError("O formato do histórico salvo é inválido.");
        }

        historico.push({
            email: emailAtor
                || sessionStorage.getItem(USUARIO_EMAIL_KEY)
                || "Conta não identificada",
            acao,
            dataHora: new Date().toISOString()
        });

        localStorage.setItem(HISTORICO_KEY, JSON.stringify(historico));
        return true;
    } catch (error) {
        console.error("Não foi possível registrar a atividade no histórico:", error);
        return false;
    }
}

// Filtro do Historico
function filtrarHistorico(historico) {
    var email = document.getElementById("filterEmail").value.trim().toLowerCase();
    var data = document.getElementById("filterDate").value;
    var hora = document.getElementById("filterTime").value;

    return historico.filter(function (registro) {
        var dataHora = new Date(registro.dataHora);
        var dataLocal = [
            dataHora.getFullYear(),
            String(dataHora.getMonth() + 1).padStart(2, "0"),
            String(dataHora.getDate()).padStart(2, "0")
        ].join("-");
        var horaLocal = [
            String(dataHora.getHours()).padStart(2, "0"),
            String(dataHora.getMinutes()).padStart(2, "0")
        ].join(":");

        return (!email || (registro.email || "").toLowerCase().includes(email))
            && (!data || dataLocal === data)
            && (!hora || horaLocal === hora);
    });
}

// Exibe as atividades filtradas, começando pelas mais recentes.
function renderizarHistorico() {
    var linhas = document.getElementById("historyRows");

    if (!linhas) return;

    var historico = filtrarHistorico(JSON.parse(
        localStorage.getItem(HISTORICO_KEY) || "[]"
    ).sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora)));

    linhas.replaceChildren();

    if (historico.length === 0) {
        var linha = document.createElement("tr");
        var mensagem = document.createElement("td");
        mensagem.colSpan = 4;
        mensagem.textContent = "Nenhuma atividade encontrada para esses filtros.";
        linha.appendChild(mensagem);
        linhas.appendChild(linha);
        return;
    }

    historico.forEach((registro) => {
        var dataHora = new Date(registro.dataHora);
        var linha = document.createElement("tr");

        [
            registro.email || "Conta não identificada",
            dataHora.toLocaleDateString("pt-BR"),
            dataHora.toLocaleTimeString("pt-BR"),
            registro.acao
        ].forEach((valor) => {
            var celula = document.createElement("td");
            celula.textContent = valor;
            linha.appendChild(celula);
        });

        linhas.appendChild(linha);
    });
}

// Renderiza a tabela e atualiza os resultados ao mexer nos filtros.
document.addEventListener("DOMContentLoaded", function () {
    renderizarHistorico();

    var filtros = document.getElementById("historyFilters");
    if (!filtros) return;

    filtros.addEventListener("input", renderizarHistorico);
    filtros.addEventListener("change", renderizarHistorico);
    filtros.addEventListener("reset", function () {
        // Aguarda o navegador restaurar os campos antes de refazer a busca.
        window.setTimeout(renderizarHistorico, 0);
    });
});

// Atualiza a tabela quando outra aba registrar uma nova atividade.
window.addEventListener("storage", function (event) {
    if (event.key === HISTORICO_KEY) {
        renderizarHistorico();
    }
});
