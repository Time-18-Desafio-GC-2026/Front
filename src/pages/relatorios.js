// ==========================================================================
// PORTAL RBS — CONTROLADOR DE RELATÓRIOS COM GRÁFICOS E INSIGHTS (PYTHON API)
// ==========================================================================
const PYTHON_ANALYTICS_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:8000"
    : "https://portal-patrocinador-python-etl.onrender.com"; // 

document.addEventListener("DOMContentLoaded", async () => {
    const sessao = JSON.parse(localStorage.getItem("rbs_sessao") || "null");
    if (!sessao) return;

    const ehPatrocinador = String(sessao.perfil).toLowerCase() === "patrocinador";
    const summary = document.getElementById("reportSummary");
    const sponsorSelect = document.getElementById("sponsorSelect");
    const reportForm = document.getElementById("reportForm");
    const downloadReportButton = document.getElementById("downloadReportButton");

    let marcasCarregadas = [];

    const carregarPatrocinadores = async () => {
        try {
            marcasCarregadas = (await apiRequest("/marcas", "GET")) || [];
            sponsorSelect.innerHTML = "";

            if (marcasCarregadas.length === 0) {
                const optVazio = document.createElement("option");
                optVazio.value = "";
                optVazio.textContent = "Nenhuma marca cadastrada";
                sponsorSelect.appendChild(optVazio);
                if (downloadReportButton) downloadReportButton.disabled = true;
                return;
            }

            marcasCarregadas
                .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                .forEach((marca) => {
                    const option = document.createElement("option");
                    option.value = marca.id;
                    option.textContent = `${marca.nome} (${marca.cota})`;
                    sponsorSelect.appendChild(option);
                });
        } catch (erro) {
            console.error("Erro ao buscar marcas para o relatório:", erro);
        }
    };

    await carregarPatrocinadores();

    reportForm?.addEventListener("submit", (event) => {
        event.preventDefault();
    });

    // Gera análises, gráficos e insights acionando o Java (Supabase) + Microsserviço Python
    async function processarRelatorioDaMarca() {
        const edicaoAno = document.getElementById("downloadFormat")?.value || "2026";
        const marcaSelecionadaId = sponsorSelect.value;
        const tipoRelatorio = document.getElementById("reportType")?.value || "Consolidado";

        if (!marcaSelecionadaId) {
            alert("Selecione um patrocinador válido.");
            return;
        }

        if (downloadReportButton) {
            downloadReportButton.disabled = true;
            downloadReportButton.textContent = "Processando dados no serviço Python...";
        }

        try {
            // 1. Busca os dados reais exclusivos desta empresa no Back-end Java (PostgreSQL)
            const relatorio = await apiRequest(`/marcas/${marcaSelecionadaId}/relatorio-consolidado`, "GET");
            const indicadores = relatorio.indicadoresConsolidados || [];

            // REGRA DE NEGÓCIO: Se a empresa não possui dados de planilha enviados pela RBS, bloqueia a geração!
            if (indicadores.length === 0) {
                summary.innerHTML = `
                    <div style="padding: 1.25rem; border-radius: 8px; background: rgba(180, 35, 24, 0.12); border: 1px solid #b42318; color: inherit;">
                        <strong style="color: #b42318; font-size: 1rem;">⚠️ Relatório Indisponível para ${relatorio.marcaNome}</strong>
                        <p style="margin: 0.5rem 0 0; font-size: 0.92rem;">
                            Esta empresa ainda não possui indicadores de Mídia ou Pesquisa processados no banco de dados.
                            ${ehPatrocinador
                        ? "Aguarde a equipe RBS publicar a planilha oficial de resultados (.xlsx) da sua marca."
                        : "Para liberar o relatório desta marca, acesse o Dashboard, abra o card do patrocinador e envie a planilha <b>.xlsx</b> em <i>Adicionar relatório de mídia</i>."}
                        </p>
                    </div>
                `;
                alert(`Não é possível baixar o relatório: a empresa "${relatorio.marcaNome}" ainda não possui dados de mídia ou pesquisa cadastrados.`);
                return;
            }

            // 2. Aciona o Microsserviço Python para gerar os Gráficos e Insights Analíticos a partir dos dados da marca
            let analisePython = null;
            try {
                const respPython = await fetch(`${PYTHON_ANALYTICS_URL}/api/v1/relatorios/analisar`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        marcaNome: relatorio.marcaNome,
                        cota: relatorio.cota,
                        evento: relatorio.evento,
                        edicao: edicaoAno,
                        totalMateriais: (relatorio.materiaisEntregues || []).length,
                        totalPerguntas: (relatorio.perguntasPesquisa || []).length,
                        indicadores: indicadores
                    })
                });

                if (respPython.ok) {
                    analisePython = await respPython.json();
                }
            } catch (erroPy) {
                console.warn("Serviço Python offline na porta 8000, renderizando indicadores brutos:", erroPy);
            }

            const insights = analisePython?.insightsExecutivo || [
                `A marca ${relatorio.marcaNome} possui ${indicadores.length} indicadores auditados na base de dados.`
            ];
            const graficoMidia = analisePython?.graficoMidiaPorCanal || [];
            const graficoPesquisa = analisePython?.graficoPesquisaDestaques || [];

            // 3. Renderiza o Painel Visual com Insights e Gráficos na tela
            const htmlInsights = insights
                .map(texto => `<li style="margin-bottom: 0.5rem; line-height: 1.45;">💡 ${texto}</li>`)
                .join("");

            const htmlGraficoMidia = graficoMidia.length > 0
                ? graficoMidia.map(item => `
                    <div style="margin-bottom: 0.75rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px;">
                            <span>${item.rotulo}</span>
                            <span>${Number(item.valor).toLocaleString("pt-BR")} views (${item.percentual}%)</span>
                        </div>
                        <div style="width: 100%; height: 14px; background: rgba(0,0,0,0.12); border-radius: 999px; overflow: hidden;">
                            <div style="width: ${Math.max(item.percentual, 4)}%; height: 100%; background: ${item.cor || "#f47b20"}; border-radius: 999px;"></div>
                        </div>
                    </div>
                `).join("")
                : "<p style='font-size:0.85rem;'>Sem métricas de visualização por canal.</p>";

            const htmlGraficoPesquisa = graficoPesquisa.length > 0
                ? graficoPesquisa.map(item => `
                    <div style="margin-bottom: 0.75rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px;">
                            <span>${item.rotulo}</span>
                            <span>${item.percentual}% (${item.valor} resp.)</span>
                        </div>
                        <div style="width: 100%; height: 14px; background: rgba(0,0,0,0.12); border-radius: 999px; overflow: hidden;">
                            <div style="width: ${Math.min(Math.max(item.percentual, 4), 100)}%; height: 100%; background: #101d4d; border-radius: 999px;"></div>
                        </div>
                    </div>
                `).join("")
                : "<p style='font-size:0.85rem;'>Sem métricas percentuais de pesquisa.</p>";

            summary.innerHTML = `
                <div id="relatorioVisualContainer" style="background: #ffffff; color: #1f2937; padding: 1.5rem; border-radius: 10px; border: 1px solid #dfe5ec; margin-top: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f47b20; padding-bottom: 0.75rem; margin-bottom: 1rem;">
                        <div>
                            <h3 style="margin: 0; color: #101d4d; font-size: 1.25rem;">Relatório Executivo — ${relatorio.marcaNome}</h3>
                            <small style="color: #475569;">Cota: <b>${relatorio.cota}</b> | Evento: ${relatorio.evento} (${edicaoAno}) | Foco: ${tipoRelatorio}</small>
                        </div>
                        <button type="button" id="btnImprimirPdf" style="padding: 8px 14px; background: #101d4d; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                            🖨️ Salvar / Imprimir Relatório (PDF)
                        </button>
                    </div>

                    <div style="background: #f8fafc; border-left: 4px solid #f47b20; padding: 1rem; border-radius: 6px; margin-bottom: 1.25rem;">
                        <h4 style="margin: 0 0 0.5rem; color: #101d4d;">1. Insights Analíticos Gerados (Serviço Python)</h4>
                        <ul style="margin: 0; padding-left: 1.2rem; font-size: 0.92rem; color: #334155;">
                            ${htmlInsights}
                        </ul>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; margin-bottom: 1.25rem;">
                        <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <h4 style="margin: 0 0 0.75rem; color: #101d4d;">2. Gráfico de Alcance por Canal de Mídia</h4>
                            ${htmlGraficoMidia}
                        </div>
                        <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <h4 style="margin: 0 0 0.75rem; color: #101d4d;">3. Destaques da Pesquisa de Ativação (%)</h4>
                            ${htmlGraficoPesquisa}
                        </div>
                    </div>

                    <div style="font-size: 0.85rem; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 0.75rem;">
                        <strong>Entregas Auditadas no Portal:</strong>
                        ${(relatorio.materiaisEntregues || []).length} arquivos/links no Supabase Storage |
                        ${(relatorio.perguntasPesquisa || []).length}/3 perguntas oficiais cadastradas |
                        ${indicadores.length} indicadores validados pelo pipeline Pandas.
                    </div>
                </div>
            `;

            // Permite salvar o relatório visual completo com gráficos em PDF nativo do navegador
            document.getElementById("btnImprimirPdf")?.addEventListener("click", () => {
                window.print();
            });

        } catch (erro) {
            console.error("Erro ao gerar relatório:", erro);
            alert(erro.message || "Não foi possível gerar o relatório consolidado.");
        } finally {
            if (downloadReportButton) {
                downloadReportButton.disabled = false;
                downloadReportButton.textContent = "Gerar Relatório com Gráficos e Insights";
            }
        }
    }

    downloadReportButton?.addEventListener("click", processarRelatorioDaMarca);
});