// indexHistorico.html/historico.js
var HISTORICO_KEY = "rbs_historico";
var USUARIO_EMAIL_KEY = "rbs_usuario_email";

// Cache em memória dos logs vindos do PostgreSQL (Supabase)
var historicoServidorCache = [];

function registrarHistorico(acao, emailAtor) {
    var historico = JSON.parse(localStorage.getItem(HISTORICO_KEY) || "[]");

    historico.push({
        email: emailAtor
            || sessionStorage.getItem(USUARIO_EMAIL_KEY)
            || "Conta não identificada",
        acao,
        dataHora: new Date().toISOString()
    });

    localStorage.setItem(HISTORICO_KEY, JSON.stringify(historico));
}

/**
 * Busca a trilha de auditoria real no Back-end Java (GET /auditoria)
 */
async function carregarAuditoriaDoBackend() {
    if (typeof apiRequest !== "function" || !localStorage.getItem("rbs_token")) {
        return;
    }

    try {
        const logsApi = await apiRequest("/auditoria", "GET");
        if (Array.isArray(logsApi)) {
            historicoServidorCache = logsApi.map(function (log) {
                return {
                    id: log.id,
                    email: log.atorNome || "Sistema / RBS",
                    acao: log.detalhe || log.acao,
                    dataHora: log.criadoEm
                };
            });
        }
    } catch (erro) {
        console.error("Erro ao carregar auditoria do servidor:", erro);
    }
}

// Filtro do Histórico
function filtrarHistorico(historico) {
    var emailInput = document.getElementById("filterEmail");
    var dateInput = document.getElementById("filterDate");
    var timeInput = document.getElementById("filterTime");

    var email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    var data = dateInput ? dateInput.value : "";
    var hora = timeInput ? timeInput.value : "";

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

    // Prioriza os logs oficiais do banco no Supabase; usa o local apenas se o banco estiver vazio
    var baseCompleta = historicoServidorCache.length > 0
        ? historicoServidorCache
        : JSON.parse(localStorage.getItem(HISTORICO_KEY) || "[]");

    var historico = filtrarHistorico(
        [...baseCompleta].sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))
    );

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

// Renderiza a tabela puxando do Back-end e atualiza os resultados ao mexer nos filtros.
document.addEventListener("DOMContentLoaded", async function () {
    var linhas = document.getElementById("historyRows");
    if (!linhas) return; // Só busca se estivermos na tela de Histórico

    await carregarAuditoriaDoBackend();
    renderizarHistorico();

    var filtros = document.getElementById("historyFilters");
    if (!filtros) return;

    filtros.addEventListener("input", renderizarHistorico);
    filtros.addEventListener("change", renderizarHistorico);
    filtros.addEventListener("reset", function () {
        window.setTimeout(renderizarHistorico, 0);
    });
});

