// src/pages/relatorios.js — Controlador de Relatórios Consolidados
document.addEventListener('DOMContentLoaded', async () => {
    const sessao = JSON.parse(localStorage.getItem('rbs_sessao') || 'null');
    if (!sessao) return;

    const ehPatrocinador = String(sessao.perfil).toLowerCase() === 'patrocinador';
    const ehFuncionario = !ehPatrocinador;

    const summary = document.getElementById('reportSummary');
    const sponsorSelect = document.getElementById('sponsorSelect');
    const reportForm = document.getElementById('reportForm');
    const downloadReportButton = document.getElementById('downloadReportButton');

    let marcasCarregadas = [];
    const carregarPatrocinadores = async () => {
        try {
            marcasCarregadas = await apiRequest('/marcas', 'GET') || [];
            sponsorSelect.innerHTML = '';

            if (ehFuncionario && marcasCarregadas.length > 1) {
                const optTodos = document.createElement('option');
                optTodos.value = 'Todos';
                optTodos.textContent = 'Todos';
                sponsorSelect.appendChild(optTodos);
            }

            if (marcasCarregadas.length === 0) {
                const optVazio = document.createElement('option');
                optVazio.value = '';
                optVazio.textContent = 'Nenhuma marca cadastrada';
                sponsorSelect.appendChild(optVazio);
                return;
            }

            marcasCarregadas
                .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                .forEach((marca) => {
                    const option = document.createElement('option');
                    option.value = marca.id;
                    option.textContent = `${marca.nome} (${marca.cota})`;
                    sponsorSelect.appendChild(option);
                });
        } catch (erro) {
            console.error('Erro ao buscar marcas para o relatório:', erro);
        }
    };

    await carregarPatrocinadores();

    reportForm?.addEventListener('submit', (event) => {
        event.preventDefault();
    });

    downloadReportButton?.addEventListener('click', async () => {
        const edicaoAno = document.getElementById('downloadFormat').value;
        const marcaSelecionadaId = sponsorSelect.value;
        const tipoRelatorio = document.getElementById('reportType').value;

        try {
            const alvos = marcaSelecionadaId === 'Todos'
                ? marcasCarregadas
                : marcasCarregadas.filter(m => String(m.id) === String(marcaSelecionadaId));

            if (alvos.length === 0) {
                alert('Nenhum patrocinador disponível para gerar o relatório.');
                return;
            }

            const linhasTexto = [];
            let htmlResumo = '';

            for (const marca of alvos) {
                let relatorio = await apiRequest(`/marcas/${marca.id}/relatorio-consolidado`, 'GET');
                if ((!relatorio.indicadoresConsolidados || relatorio.indicadoresConsolidados.length === 0) && ehFuncionario) {
                    await apiRequest(`/marcas/${marca.id}/indicadores/importar-planilha-padrao`, 'POST').catch(() => { });
                    relatorio = await apiRequest(`/marcas/${marca.id}/relatorio-consolidado`, 'GET');
                }

                linhasTexto.push(`=====================================================`);
                linhasTexto.push(`RELATÓRIO CONSOLIDADO - ${relatorio.marcaNome} (Cota: ${relatorio.cota})`);
                linhasTexto.push(`Evento: ${relatorio.evento} | Edição selecionada: ${edicaoAno}`);
                linhasTexto.push(`Tipo: ${tipoRelatorio} | Gerado em: ${new Date(relatorio.geradoEm).toLocaleString('pt-BR')}`);
                linhasTexto.push(`-----------------------------------------------------`);
                linhasTexto.push(`MATERIAIS ENTREGUES (${relatorio.materiaisEntregues.length}):`);
                relatorio.materiaisEntregues.forEach(m => {
                    const linkNuvem = m.caminhoStorage || m.urlExterna || 'Sem anexo';
                    linhasTexto.push(` - [${m.abaDestino}] ${m.titulo} (${m.status}) - Autor: ${m.autorNome} | Link: ${linkNuvem}`);
                });
                linhasTexto.push(`-----------------------------------------------------`);
                linhasTexto.push(`PERGUNTAS DA PESQUISA OFICIAL (${relatorio.perguntasPesquisa.length}/3):`);
                relatorio.perguntasPesquisa.forEach(p => {
                    linhasTexto.push(` ${p.numeroPergunta}. ${p.textoPergunta}`);
                });
                linhasTexto.push(`-----------------------------------------------------`);
                linhasTexto.push(`INDICADORES CONSOLIDADOS (${relatorio.indicadoresConsolidados.length}):`);
                relatorio.indicadoresConsolidados.forEach(ind => {
                    const val = ind.valorNumerico != null ? ind.valorNumerico : (ind.valorTexto || '');
                    linhasTexto.push(` - [${ind.secao}] ${ind.nomeIndicador}: ${val} (Fonte: ${ind.fonteDados})`);
                });
                linhasTexto.push(`\n`);

                htmlResumo += `
                    <div style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #eee;">
                        <strong>${relatorio.marcaNome} (${relatorio.cota})</strong> — Edição ${edicaoAno}<br>
                        Materiais registrados: <b>${relatorio.materiaisEntregues.length}</b> |
                        Perguntas na pesquisa: <b>${relatorio.perguntasPesquisa.length}/3</b> |
                        Indicadores extraídos: <b>${relatorio.indicadoresConsolidados.length}</b>
                    </div>
                `;
            }

            const nomeArquivo = `relatorio-consolidado-${edicaoAno}.txt`;
            const blob = new Blob([linhasTexto.join('\n')], { type: 'text/plain;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = nomeArquivo;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            summary.innerHTML = `
                <strong>Relatório consolidado gerado direto do banco de dados!</strong><br><br>
                ${htmlResumo}
            `;
        } catch (erro) {
            console.error('Erro ao gerar relatório:', erro);
            alert(erro.message || 'Não foi possível gerar o relatório consolidado.');
        }
    });
});