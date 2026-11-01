// Carrega os filtros de patrocinador e gera os arquivos de relatório para download.
// INTEGRAÇÃO BACK-END: buscar patrocinadores e dados dos relatórios nos endpoints correspondentes.
document.addEventListener('DOMContentLoaded', () => {
    const summary = document.getElementById('reportSummary');
    const sponsorSelect = document.getElementById('sponsorSelect');
    const reportForm = document.getElementById('reportForm');
    const downloadReportButton = document.getElementById('downloadReportButton');
    const logoutButton = document.getElementById('logoutButton');

    logoutButton?.addEventListener('click', () => {
        if (!window.confirm('Deseja realmente sair da plataforma?')) return;

        registrarHistorico(
            'Encerrou a sessão da equipe RBS.',
            sessionStorage.getItem('rbs_usuario_email') || undefined
        );
        sessionStorage.removeItem('rbs_usuario_email');
        localStorage.removeItem('rbs_sessao');
        window.location.replace('../Teladelogin/indexLogin.html');
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
                `Baixou o relatório de ${sponsor} (${type}) em formato ${format.toUpperCase()}.`,
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
