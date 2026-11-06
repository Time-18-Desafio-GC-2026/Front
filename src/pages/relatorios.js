// ==========================================================================
// PORTAL RBS — CONTROLADOR DE RELATÓRIOS COM GRÁFICOS E INSIGHTS (PYTHON + FALLBACK)
// ==========================================================================
const PYTHON_ANALYTICS_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:8000"
    : "https://portal-patrocinador-python-etl.onrender.com";

function gerarAnaliseLocalFallback(relatorio, indicadores, edicaoAno) {
    const coresCanais = {
        Instagram: "#E1306C",
        TikTok: "#00B4D8",
        YouTube: "#FF0000",
        Imprensa: "#F47B20",
        Outros: "#1677D2"
    };

    const totaisCanal = {};
    let mencoesTotais = 0;
    let visualizacoesTotais = 0;
    const seriePesquisa = [];
    let baseRespondentes = 0;

    (indicadores || []).forEach(ind => {
        const secao = String(ind.secao || "").toUpperCase();
        const val = Number(ind.valorNumerico || 0);
        const nome = String(ind.nomeIndicador || "");

        if (secao === "PERFIL" && val > 0) {
            baseRespondentes = Math.round(val);
        } else if (secao === "MIDIA") {
            let canal = "Outros";
            ["Instagram", "TikTok", "YouTube", "Imprensa"].forEach(c => {
                if (nome.toLowerCase().includes(c.toLowerCase())) canal = c;
            });
            if (nome.toLowerCase().includes("visualiza") || canal !== "Imprensa") {
                totaisCanal[canal] = (totaisCanal[canal] || 0) + val;
                visualizacoesTotais += val;
            } else {
                mencoesTotais += val;
            }
        } else if (secao === "PESQUISA" || secao === "PESQUISA_ATIVACAO") {
            const match = String(ind.valorTexto || "").match(/\(([0-9.]+)%\)/);
            const perc = match ? parseFloat(match[1]) : val;
            seriePesquisa.push({
                rotulo: nome,
                valor: val,
                percentual: perc,
                cor: perc >= 70 ? "#F47B20" : "#101d4d"
            });
        }
    });

    const somaMidia = Object.values(totaisCanal).reduce((a, b) => a + b, 0) || 1;
    const graficoMidiaPorCanal = Object.entries(totaisCanal)
        .sort((a, b) => b[1] - a[1])
        .map(([canal, total]) => ({
            rotulo: canal,
            valor: total,
            percentual: Number(((total / somaMidia) * 100).toFixed(1)),
            cor: coresCanais[canal] || "#1677D2"
        }));

    const graficoPesquisaDestaques = seriePesquisa
        .sort((a, b) => (b.percentual || 0) - (a.percentual || 0))
        .slice(0, 8);

    const insightsExecutivo = [];
    if (visualizacoesTotais > 0 && graficoMidiaPorCanal.length > 0) {
        const lider = graficoMidiaPorCanal[0];
        insightsExecutivo.push(
            `Performance de Alcance Digital: A marca ${relatorio.marcaNome} (Cota ${relatorio.cota}) acumulou ${visualizacoesTotais.toLocaleString("pt-BR")} visualizações auditadas no evento (${edicaoAno}), tendo o ${lider.rotulo} como principal canal de tração (${lider.percentual}% do share de mídia).`
        );
    }
    if (mencoesTotais > 0) {
        insightsExecutivo.push(
            `Repercussão Espontânea e Imprensa: Foram contabilizadas ${mencoesTotais.toLocaleString("pt-BR")} menções e citações diretas em veículos de imprensa e coberturas oficiais.`
        );
    }
    if (graficoPesquisaDestaques.length > 0) {
        const top = graficoPesquisaDestaques[0];
        insightsExecutivo.push(
            `Destaque na Pesquisa de Ativação: O indicador '${top.rotulo}' atingiu ${top.percentual}% de aprovação junto ao público pesquisado${baseRespondentes ? ` (base de ${baseRespondentes} planetários)` : ""}.`
        );
    }
    insightsExecutivo.push(
        `Governança da Parceria: O patrocínio conta com ${(relatorio.materiaisEntregues || []).length} entregas registradas no portal e ${(relatorio.perguntasPesquisa || []).length}/3 perguntas personalizadas na pesquisa oficial.`
    );

    return { insightsExecutivo, graficoMidiaPorCanal, graficoPesquisaDestaques };
}

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
            if (ehPatrocinador && sessao.patrocinadorId) {
                const minhaMarca = await apiRequest(`/marcas/${sessao.patrocinadorId}`, "GET");
                marcasCarregadas = minhaMarca ? [minhaMarca] : [];
            } else {
                marcasCarregadas = (await apiRequest("/marcas", "GET")) || [];
            }

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

    async function processarRelatorioDaMarca() {
        const edicaoAno = document.getElementById("downloadFormat")?.value || "2026";
        const marcaSelecionadaId = sponsorSelect.value;
        const tipoRelatorio = document.getElementById("reportType")?.value || "Todos";

        if (!marcaSelecionadaId) {
            alert("Selecione um patrocinador válido.");
            return;
        }

        if (downloadReportButton) {
            downloadReportButton.disabled = true;
            downloadReportButton.textContent = "Gerando relatório...";
        }

        try {
            const relatorio = await apiRequest(`/marcas/${marcaSelecionadaId}/relatorio-consolidado`, "GET");
            const indicadores = relatorio.indicadoresConsolidados || [];

            if (indicadores.length === 0) {
                summary.innerHTML = `
                    <div style="padding: 1.25rem; border-radius: 8px; background: #ffffff; border: 1px solid #b42318; color: #1e293b;">
                        <strong style="color: #b42318; font-size: 1rem;">Relatório Indisponível para ${relatorio.marcaNome}</strong>
                        <p style="margin: 0.5rem 0 0; font-size: 0.92rem;">
                            Esta empresa ainda não possui planilha de resultados (.xlsx) publicada pela RBS.
                            ${ehPatrocinador
                        ? "Aguarde a equipe RBS publicar a planilha oficial de resultados da sua marca."
                        : "Para liberar o relatório desta marca, abra os detalhes do patrocinador no Dashboard e envie o arquivo .xlsx em 'Adicionar relatório de mídia / conteúdo'."}
                        </p>
                    </div>
                `;
                return;
            }

            let analise = null;
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 6000);
                const respPython = await fetch(`${PYTHON_ANALYTICS_URL}/api/v1/relatorios/analisar`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
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
                clearTimeout(timer);
                if (respPython.ok) {
                    analise = await respPython.json();
                }
            } catch {
                // Usa o motor analítico local se o serviço Python estiver hibernando
            }

            if (!analise || (!analise.graficoMidiaPorCanal?.length && !analise.graficoPesquisaDestaques?.length)) {
                analise = gerarAnaliseLocalFallback(relatorio, indicadores, edicaoAno);
            }

            const insights = analise.insightsExecutivo || [];
            const graficoMidia = analise.graficoMidiaPorCanal || [];
            const graficoPesquisa = analise.graficoPesquisaDestaques || [];

            const htmlInsights = insights
                .map(texto => `<li style="margin-bottom: 0.5rem; line-height: 1.45;">${texto}</li>`)
                .join("");

            const htmlGraficoMidia = graficoMidia.length > 0
                ? graficoMidia.map(item => `
                    <div style="margin-bottom: 0.75rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: #1e293b;">
                            <span>${item.rotulo}</span>
                            <span>${Number(item.valor).toLocaleString("pt-BR")} views (${item.percentual}%)</span>
                        </div>
                        <div style="width: 100%; height: 14px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
                            <div style="width: ${Math.max(item.percentual, 4)}%; height: 100%; background: ${item.cor || "#f47b20"}; border-radius: 999px;"></div>
                        </div>
                    </div>
                `).join("")
                : "<p style='font-size:0.85rem; color:#475569;'>Sem métricas de visualização por canal.</p>";

            const htmlGraficoPesquisa = graficoPesquisa.length > 0
                ? graficoPesquisa.map(item => `
                    <div style="margin-bottom: 0.75rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: #1e293b;">
                            <span>${item.rotulo}</span>
                            <span>${item.percentual}% (${item.valor} resp.)</span>
                        </div>
                        <div style="width: 100%; height: 14px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
                            <div style="width: ${Math.min(Math.max(item.percentual, 4), 100)}%; height: 100%; background: #101d4d; border-radius: 999px;"></div>
                        </div>
                    </div>
                `).join("")
                : "<p style='font-size:0.85rem; color:#475569;'>Sem métricas percentuais de pesquisa.</p>";

            summary.innerHTML = `
                <div id="relatorioVisualContainer" style="background: #ffffff; color: #1f2937; padding: 1.5rem; border-radius: 10px; border: 1px solid #dfe5ec;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f47b20; padding-bottom: 0.75rem; margin-bottom: 1rem;">
                        <div>
                            <h3 style="margin: 0; color: #101d4d; font-size: 1.25rem;">Relatório Executivo — ${relatorio.marcaNome}</h3>
                            <small style="color: #475569;">Cota: <b>${relatorio.cota}</b> | Evento: ${relatorio.evento} (${edicaoAno}) | Foco: ${tipoRelatorio}</small>
                        </div>
                        <button type="button" id="btnImprimirPdf" class="button button-primary">
                            Salvar / Imprimir Relatório (PDF)
                        </button>
                    </div>
                    <div style="background: #f8fafc; border-left: 4px solid #f47b20; padding: 1rem; border-radius: 6px; margin-bottom: 1.25rem;">
                        <h4 style="margin: 0 0 0.5rem; color: #101d4d;">1. Insights Analíticos Executivos</h4>
                        <ul style="margin: 0; padding-left: 1.2rem; font-size: 0.92rem; color: #334155;">
                            ${htmlInsights}
                        </ul>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; margin-bottom: 1.25rem;">
                        <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <h4 style="margin: 0 0 0.75rem; color: #101d4d;">2. Alcance por Canal de Mídia</h4>
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
                        ${indicadores.length} indicadores consolidados na base de dados.
                    </div>
                </div>
            `;

            document.getElementById("btnImprimirPdf")?.addEventListener("click", () => {
                window.print();
            });
        } catch (erro) {
            console.error("Erro ao gerar relatório:", erro);
            alert(erro.message || "Não foi possível gerar o relatório consolidado.");
        } finally {
            if (downloadReportButton) {
                downloadReportButton.disabled = false;
                downloadReportButton.textContent = "Baixar relatório";
            }
        }
    }

    downloadReportButton?.addEventListener("click", processarRelatorioDaMarca);
});