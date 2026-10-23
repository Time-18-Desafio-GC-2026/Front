document.addEventListener('DOMContentLoaded', () => {
    const summary = document.getElementById('reportSummary');
    const sponsorSelect = document.getElementById('sponsorSelect');
    const reportForm = document.getElementById('reportForm');
    const downloadReportButton = document.getElementById('downloadReportButton');
    const actionButtons = document.querySelectorAll('.report-panel .button');

    const aplicarEstadoBotao = (button, ativo) => {
        if (!button) return;

        if (ativo) {
            button.style.background = '#ff8a1d';
            button.style.color = '#ffffff';
            button.style.border = 'none';
            button.style.boxShadow = 'none';
            button.style.transform = 'translateY(-1px)';
            return;
        } 

        button.style.background = '#ffffff';
        button.style.color = '#111111';
        button.style.border = '1px solid #ff8a1d';
        button.style.boxShadow = 'none';
        button.style.transform = 'none';
    };

    actionButtons.forEach((button) => {
        aplicarEstadoBotao(button, false);
        button.addEventListener('mouseenter', () => aplicarEstadoBotao(button, true));
        button.addEventListener('mouseleave', () => aplicarEstadoBotao(button, false));
    });

    const carregarPatrocinadores = () => {
        const patrocinadores = JSON.parse(localStorage.getItem('rbs_patrocinadores') || '[]');
        const nomes = patrocinadores
            .map((patrocinador) => patrocinador.nome)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        sponsorSelect.innerHTML = '<option value="Todos">Todos</option>';

        nomes.forEach((nome) => {
            const option = document.createElement('option');
            option.value = nome;
            option.textContent = nome;
            sponsorSelect.appendChild(option);
        });
    };

    carregarPatrocinadores();

    reportForm?.addEventListener('submit', (event) => {
        event.preventDefault();
    });

    downloadReportButton?.addEventListener('click', () => {
        const format = document.getElementById('downloadFormat').value;
        const sponsor = sponsorSelect.value;
        const type = document.getElementById('reportType').value;
        const rows = [
            ['Patrocinador', 'Formato', 'Status'],
            [sponsor, format.toUpperCase(), 'Disponível para download']
        ];

        const csvContent = rows.map((row) => row.join(',')).join('\n');
        const fileName = `relatorio-${sponsor.toLowerCase().replace(/\s+/g, '-')}.${format}`;
        const blob = new Blob([
            format === 'csv'
                ? csvContent
                : `Relatório para ${sponsor}\nFormato: ${format.toUpperCase()}\nStatus: Disponível para download`
        ], {
            type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;'
        });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        if (typeof registrarHistorico === 'function') {
            registrarHistorico(
                `Baixou o relatório de ${sponsor} (${type}) no ano ${format}.`,
                sessionStorage.getItem('rbs_usuario_email') || undefined
            );
        }

        summary.innerHTML = `
            <strong>Arquivo baixado com sucesso.</strong><br>
            Patrocinador: ${sponsor}<br>
            Formato: ${format.toUpperCase()}
        `;
    });
});