/**
 * ==========================================================================
 * PORTAL RBS — CONTROLADOR DE PESQUISA DE ATIVAÇÃO (LISTA EXPANSÍVEL + PDF)
 * ==========================================================================
 */
document.addEventListener("DOMContentLoaded", async function () {
    const sessao = JSON.parse(localStorage.getItem("rbs_sessao") || "null");
    if (!sessao) return;

    const ehPatrocinador = String(sessao.perfil || "").toLowerCase() === "patrocinador";
    const visaoPatrocinador = document.getElementById("visaoPatrocinadorMaster");
    const visaoAdmin = document.getElementById("visaoAdminPesquisa");

    function formatarData(valor) {
        if (!valor) return "";
        const d = new Date(valor);
        return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("pt-BR");
    }

    // ==================== 1. MODO PATROCINADOR MASTER ====================
    if (ehPatrocinador) {
        if (visaoPatrocinador) visaoPatrocinador.hidden = false;
        const marcaId = sessao.patrocinadorId;
        const nomeTitulo = document.getElementById("nomeMarcaPesquisa");
        const form = document.getElementById("masterQuestionsForm");
        const msgEl = document.getElementById("pesquisaMensagem");
        const listaEl = document.getElementById("listaMinhasPerguntas");
        const btnSalvar = document.getElementById("btnSalvarPerguntas");

        if (sessao.marcaNome && nomeTitulo) {
            nomeTitulo.textContent = `Pesquisa Oficial — ${sessao.marcaNome}`;
        }

        async function carregarPerguntasDoCliente() {
            try {
                const perguntas = (await apiRequest(`/marcas/${marcaId}/pesquisa-perguntas`, "GET")) || [];
                listaEl.replaceChildren();

                for (let n = 1; n <= 3; n++) {
                    const input = document.getElementById(`perguntaInput${n}`);
                    const encontrada = perguntas.find(p => Number(p.numeroPergunta) === n);
                    if (input) input.value = encontrada ? encontrada.textoPergunta : "";
                }

                if (perguntas.length === 0) {
                    const p = document.createElement("p");
                    p.className = "envios-patrocinador-vazio";
                    p.textContent = "Sua marca ainda não cadastrou nenhuma das 3 perguntas personalizadas.";
                    listaEl.appendChild(p);
                    return;
                }

                perguntas.forEach(q => {
                    const card = document.createElement("article");
                    card.className = "envio-patrocinador-item";
                    card.innerHTML = `
                        <p class="envio-patrocinador-texto"><strong>Pergunta ${q.numeroPergunta}:</strong> ${q.textoPergunta}</p>
                        <p class="envio-patrocinador-detalhes">
                            Registrada por: ${q.autorNome || sessao.email} • Última atualização: ${formatarData(q.atualizadoEm)}
                        </p>
                    `;
                    listaEl.appendChild(card);
                });
            } catch (erro) {
                console.error("Erro ao carregar perguntas:", erro);
            }
        }

        form?.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (msgEl) msgEl.textContent = "";
            if (btnSalvar) {
                btnSalvar.disabled = true;
                btnSalvar.textContent = "Salvando no banco...";
            }

            try {
                for (let num = 1; num <= 3; num++) {
                    const input = document.getElementById(`perguntaInput${num}`);
                    const texto = input ? input.value.trim() : "";
                    if (texto) {
                        await apiRequest(`/marcas/${marcaId}/pesquisa-perguntas`, "POST", {
                            numeroPergunta: num,
                            textoPergunta: texto
                        });
                    }
                }
                if (msgEl) {
                    msgEl.classList.remove("is-error");
                    msgEl.textContent = "Suas perguntas foram salvas com sucesso e enviadas à equipe de pesquisa da RBS!";
                }
                await carregarPerguntasDoCliente();
            } catch (erro) {
                if (msgEl) {
                    msgEl.classList.add("is-error");
                    msgEl.textContent = erro.message || "Não foi possível salvar as perguntas.";
                }
            } finally {
                if (btnSalvar) {
                    btnSalvar.disabled = false;
                    btnSalvar.textContent = "Salvar Perguntas na Pesquisa Oficial";
                }
            }
        });

        await carregarPerguntasDoCliente();
        return;
    }

    // ==================== 2. MODO ADMIN / SUPERADMIN RBS ====================
    if (visaoAdmin) visaoAdmin.hidden = false;
    const containerLista = document.getElementById("listaPesquisaAccordion");
    const inputBusca = document.getElementById("buscaMarcaPesquisa");
    const btnImportarPdf = document.getElementById("btnExportarPerguntasPdf");
    let consolidadoMaster = [];

    function renderizarListaMaster(listaFiltrada) {
        if (!containerLista) return;
        containerLista.replaceChildren();

        if (listaFiltrada.length === 0) {
            containerLista.innerHTML = `
                <div class="patrocinadores-vazio" style="border: 0; border-radius: 0;">
                    Nenhum patrocinador da cota <strong>Master</strong> encontrado para os critérios informados.
                </div>
            `;
            return;
        }

        listaFiltrada.forEach(({ marca, perguntas, logoUrl }) => {
            const qtdEnviadas = (perguntas || []).length;
            const faltam = Math.max(0, 3 - qtdEnviadas);

            const textoTag = faltam === 0
                ? "3/3 perguntas concluídas"
                : (faltam === 1 ? "Falta 1 pergunta" : `Faltam ${faltam} perguntas`);
            const bgTag = faltam === 0 ? "#dcfce7" : "#fef3c7";
            const corTag = faltam === 0 ? "#166534" : "#92400e";

            const item = document.createElement("div");
            item.className = "pesquisa-accordion-item";

            const header = document.createElement("div");
            header.className = "pesquisa-accordion-header";

            const iniciais = String(marca.nome || "M").slice(0, 2).toUpperCase();
            const htmlLogo = logoUrl
                ? `<img src="${logoUrl}" alt="${marca.nome}">`
                : iniciais;

            header.innerHTML = `
                <div class="pesquisa-marca-identidade">
                    <div class="pesquisa-marca-logo">${htmlLogo}</div>
                    <div>
                        <strong style="color: var(--text-strong); font-size: 14px; display: block;">${marca.nome}</strong>
                        <small style="color: var(--text-muted); font-size: 12px;">CNPJ: ${marca.cnpj || "Não informado"}</small>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="patrocinador-cota" style="background: ${bgTag}; color: ${corTag}; margin: 0;">${textoTag}</span>
                    <button type="button" class="botao-recolher" aria-expanded="false" title="Expandir perguntas">⌄</button>
                </div>
            `;

            const body = document.createElement("div");
            body.className = "pesquisa-accordion-body";
            body.hidden = true;

            for (let i = 1; i <= 3; i++) {
                const p = (perguntas || []).find(q => Number(q.numeroPergunta) === i);
                const linha = document.createElement("div");
                linha.className = "pesquisa-linha-pergunta";
                linha.innerHTML = p
                    ? `<strong>Pergunta ${i}:</strong> ${p.textoPergunta} <span style="float:right; color:#64748b; font-size:11px;">${formatarData(p.atualizadoEm)}</span>`
                    : `<strong>Pergunta ${i}:</strong> <em style="color:#94a3b8;">Ainda não enviada pelo patrocinador.</em>`;
                body.appendChild(linha);
            }

            const btnToggle = header.querySelector(".botao-recolher");
            header.addEventListener("click", () => {
                const vaiFechar = !body.hidden;
                body.hidden = vaiFechar;
                btnToggle.textContent = vaiFechar ? "⌄" : "⌃";
                btnToggle.setAttribute("aria-expanded", String(!vaiFechar));
            });

            item.append(header, body);
            containerLista.appendChild(item);
        });
    }

    function obterListaFiltrada() {
        const termo = (inputBusca?.value || "").trim().toLowerCase();
        if (!termo) return consolidadoMaster;
        return consolidadoMaster.filter(({ marca }) =>
            String(marca.nome || "").toLowerCase().includes(termo) ||
            String(marca.cnpj || "").toLowerCase().includes(termo)
        );
    }

    async function carregarPainelAdminPesquisa() {
        try {
            const todasMarcas = (await apiRequest("/marcas", "GET")) || [];
            const marcasMaster = todasMarcas.filter(m => String(m.cota).toUpperCase() === "MASTER");
            consolidadoMaster = [];

            for (const marca of marcasMaster) {
                const [perguntas, materiais] = await Promise.all([
                    apiRequest(`/marcas/${marca.id}/pesquisa-perguntas`, "GET").catch(() => []),
                    apiRequest(`/marcas/${marca.id}/materiais`, "GET").catch(() => [])
                ]);
                const fotoMat = (materiais || []).find(mat => mat.tipoMaterial === "FOTO_EMPRESA");
                const logoUrl = fotoMat ? (fotoMat.caminhoStorage || fotoMat.urlExterna) : "";
                consolidadoMaster.push({ marca, perguntas: perguntas || [], logoUrl });
            }

            renderizarListaMaster(obterListaFiltrada());
        } catch (erro) {
            console.error("Erro ao carregar pesquisa admin:", erro);
        }
    }

    inputBusca?.addEventListener("input", () => {
        renderizarListaMaster(obterListaFiltrada());
    });

    // Gera Relatório Oficial em PDF (Impressão Nativa Formatada)
    btnImportarPdf?.addEventListener("click", () => {
        const lista = obterListaFiltrada();
        if (lista.length === 0) {
            alert("Não há patrocinadores Master listados para exportar.");
            return;
        }

        const linhasHtml = lista.map(({ marca, perguntas }) => {
            const q1 = perguntas.find(p => Number(p.numeroPergunta) === 1)?.textoPergunta || "<em>Pendente de envio</em>";
            const q2 = perguntas.find(p => Number(p.numeroPergunta) === 2)?.textoPergunta || "<em>Pendente de envio</em>";
            const q3 = perguntas.find(p => Number(p.numeroPergunta) === 3)?.textoPergunta || "<em>Pendente de envio</em>";
            return `
                <tr>
                    <td><strong>${marca.nome}</strong><br><small>${marca.cnpj || "-"}</small></td>
                    <td>1. ${q1}<br>2. ${q2}<br>3. ${q3}</td>
                    <td>${perguntas.length}/3 enviadas</td>
                </tr>
            `;
        }).join("");

        const janelaPdf = window.open("", "_blank", "width=950,height=750");
        if (!janelaPdf) {
            alert("Permita pop-ups no navegador para gerar o documento PDF.");
            return;
        }

        janelaPdf.document.write(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>Relatório de Pesquisa de Ativação — Planeta Atlântida</title>
                <style>
                    body { font-family: Arial, sans-serif; color: #1e293b; margin: 32px; }
                    .header { border-bottom: 3px solid #f47b20; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
                    .header h1 { margin: 0; color: #101d4d; font-size: 20px; }
                    .meta { font-size: 12px; color: #64748b; }
                    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                    th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 12px; vertical-align: top; line-height: 1.5; }
                    th { background: #101d4d; color: #ffffff; }
                    tr:nth-child(even) { background: #f8fafc; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1>Planeta Atlântida — Pauta da Pesquisa de Ativação (Cota Master)</h1>
                        <div class="meta">Documento Oficial de Auditoria e Pesquisa • Grupo RBS</div>
                    </div>
                    <div class="meta">Emitido em: ${new Date().toLocaleString("pt-BR")}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 24%;">Patrocinador Master</th>
                            <th style="width: 62%;">Perguntas Cadastradas</th>
                            <th style="width: 14%;">Status</th>
                        </tr>
                    </thead>
                    <tbody>${linhasHtml}</tbody>
                </table>
                <script>window.onload = function() { window.print(); };<\/script>
            </body>
            </html>
        `);
        janelaPdf.document.close();
    });

    await carregarPainelAdminPesquisa();
});