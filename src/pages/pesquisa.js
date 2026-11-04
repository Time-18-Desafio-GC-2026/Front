/**
 * ==========================================================================
 * PORTAL RBS — CONTROLADOR DE PESQUISA DE ATIVAÇÃO (EXCLUSIVO COTA MASTER)
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
                    msgEl.textContent = "✅ Suas perguntas foram salvas com sucesso e enviadas à equipe de pesquisa da RBS!";
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
    const gridAdmin = document.getElementById("gridPesquisaAdmin");
    const btnExportar = document.getElementById("btnExportarPerguntasTxt");
    let consolidadoMaster = [];

    async function carregarPainelAdminPesquisa() {
        try {
            const todasMarcas = (await apiRequest("/marcas", "GET")) || [];
            const marcasMaster = todasMarcas.filter(m => String(m.cota).toUpperCase() === "MASTER");

            gridAdmin.replaceChildren();
            consolidadoMaster = [];

            if (marcasMaster.length === 0) {
                gridAdmin.innerHTML = `
                    <div class="patrocinadores-vazio">
                        Nenhum patrocinador da cota <strong>Master</strong> cadastrado até o momento.
                    </div>
                `;
                return;
            }

            for (const marca of marcasMaster) {
                const perguntas = await apiRequest(`/marcas/${marca.id}/pesquisa-perguntas`, "GET").catch(() => []);
                consolidadoMaster.push({ marca, perguntas: perguntas || [] });

                const card = document.createElement("article");
                card.className = "patrocinador-card";

                const qtd = (perguntas || []).length;
                const corStatus = qtd === 3 ? "#15803d" : (qtd > 0 ? "#b45309" : "#b42318");
                const textoStatus = qtd === 3 ? "Completa (3/3)" : `${qtd}/3 enviadas`;

                let htmlPerguntas = "";
                for (let i = 1; i <= 3; i++) {
                    const p = (perguntas || []).find(item => Number(item.numeroPergunta) === i);
                    htmlPerguntas += `
                        <div class="envio-item" style="margin-bottom: 8px;">
                            <strong style="font-size: 0.8rem; color: #475569;">PERGUNTA ${i}</strong>
                            <p class="envio-texto" style="margin: 4px 0;">
                                ${p ? p.textoPergunta : "<em style='color:#94a3b8;'>Ainda não enviada pelo patrocinador.</em>"}
                            </p>
                            ${p ? `<small style="color:#64748b; font-size:0.75rem;">Autor: ${p.autorNome} (${formatarData(p.atualizadoEm)})</small>` : ""}
                        </div>
                    `;
                }

                card.innerHTML = `
                    <div class="patrocinador-card-header">
                        <h3>${marca.nome}</h3>
                        <span class="patrocinador-cota" style="background:#fef3c7; color:${corStatus};">${textoStatus}</span>
                    </div>
                    <div class="patrocinador-info">
                        <div class="patrocinador-info-item">
                            <strong>CNPJ</strong>
                            <span>${marca.cnpj || "Não informado"}</span>
                        </div>
                    </div>
                    <div class="patrocinador-envios">
                        <h4>Perguntas para o Instituto de Pesquisa</h4>
                        ${htmlPerguntas}
                    </div>
                `;

                gridAdmin.appendChild(card);
            }
        } catch (erro) {
            console.error("Erro ao carregar pesquisa admin:", erro);
        }
    }

    btnExportar?.addEventListener("click", () => {
        if (consolidadoMaster.length === 0) {
            alert("Não há patrocinadores Master para exportar.");
            return;
        }
        const linhas = [
            "=================================================================",
            "PLANETA ATLÂNTIDA 2026 — PAUTA DE PERGUNTAS (PATROCINADORES MASTER)",
            `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
            "=================================================================\n"
        ];

        consolidadoMaster.forEach(({ marca, perguntas }) => {
            linhas.push(`MARCA: ${marca.nome} (CNPJ: ${marca.cnpj || "-"})`);
            for (let i = 1; i <= 3; i++) {
                const p = perguntas.find(item => Number(item.numeroPergunta) === i);
                linhas.push(`  [${i}] ${p ? p.textoPergunta : "(Pendente de envio)"}`);
            }
            linhas.push("-----------------------------------------------------------------");
        });

        const blob = new Blob([linhas.join("\n")], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "perguntas-pesquisa-patrocinadores-master.txt";
        link.click();
    });

    await carregarPainelAdminPesquisa();
});