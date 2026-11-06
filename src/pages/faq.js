/**
 * ==========================================================================
 * PORTAL RBS — CONTROLADOR DE FAQ (SEÇÕES RECOLHÍVEIS + FILTRO DE CATEGORIA)
 * ==========================================================================
 */
document.addEventListener("DOMContentLoaded", async function () {
    const sessao = JSON.parse(localStorage.getItem("rbs_sessao") || "null");
    if (!sessao) return;

    const perfil = String(sessao.perfil || "").toLowerCase();
    const isAdmin = perfil === "funcionario" || perfil === "admin" || perfil === "superadmin";

    const questionSection = document.getElementById("questionSection");
    const faqIntro = document.getElementById("faqIntro");
    const form = document.getElementById("questionForm");
    const categorySelect = document.getElementById("questionCategory");
    const filterCategorySelect = document.getElementById("faqFilterCategory");
    const input = document.getElementById("questionInput");
    const counter = document.getElementById("questionCounter");
    const message = document.getElementById("faqMessage");

    const secaoRecebidas = document.getElementById("secaoRecebidasFaq");
    const headerRecebidas = document.getElementById("headerRecebidasFaq");
    const bodyRecebidas = document.getElementById("bodyRecebidasFaq");
    const btnToggleRecebidas = document.getElementById("btnToggleRecebidas");
    const countRecebidas = document.getElementById("countRecebidasFaq");
    const listRecebidas = document.getElementById("faqListRecebidas");

    const headerPublicadas = document.getElementById("headerPublicadasFaq");
    const bodyPublicadas = document.getElementById("bodyPublicadasFaq");
    const btnTogglePublicadas = document.getElementById("btnTogglePublicadas");
    const countPublicadas = document.getElementById("countPublicadasFaq");
    const listPublicadas = document.getElementById("faqListPublicadas");

    let cacheRecebidas = [];
    let cachePublicadas = [];

    if (isAdmin) {
        if (questionSection) questionSection.hidden = true;
        if (faqIntro) {
            faqIntro.textContent = "Consulte as perguntas recebidas dos patrocinadores e gerencie as respostas publicadas.";
        }
    } else {
        // Para patrocinadores, a seção de pendentes só aparece se houver perguntas pendentes visíveis
        if (secaoRecebidas) secaoRecebidas.hidden = true;
    }

    // Comportamento de recolher/expandir as duas seções (Dropdowns)
    headerRecebidas?.addEventListener("click", () => {
        const vaiFechar = !bodyRecebidas.hidden;
        bodyRecebidas.hidden = vaiFechar;
        btnToggleRecebidas?.setAttribute("aria-expanded", String(!vaiFechar));
    });

    headerPublicadas?.addEventListener("click", () => {
        const vaiFechar = !bodyPublicadas.hidden;
        bodyPublicadas.hidden = vaiFechar;
        btnTogglePublicadas?.setAttribute("aria-expanded", String(!vaiFechar));
    });

    function showMessage(text, isError = false) {
        if (!message) return;
        message.textContent = text;
        message.classList.toggle("is-error", Boolean(isError));
    }

    function formatDate(value) {
        if (!value) return "Data indisponível";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "Data indisponível";
        return new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short"
        }).format(date);
    }

    function criarCardPergunta(item) {
        const card = document.createElement("article");
        card.className = "faq-card";

        const cardHeader = document.createElement("div");
        cardHeader.className = "faq-card-header";

        const author = document.createElement("strong");
        const nomeMarcaOuAutor = item.marcaNome || item.autorMarcaNome || "Patrocinador";
        const visualizacoes = item.visualizacoes ?? 0;
        const categoriaLabel = item.categoria || "GERAL";
        author.textContent = `${nomeMarcaOuAutor} • Categoria: ${categoriaLabel} • ${visualizacoes} acessos`;

        const createdAt = document.createElement("time");
        createdAt.dateTime = item.criadoEm || "";
        createdAt.textContent = formatDate(item.criadoEm);
        cardHeader.append(author, createdAt);

        const question = document.createElement("p");
        question.className = "faq-question";
        question.textContent = item.pergunta;
        question.style.cursor = "pointer";
        question.title = "Clique para registrar leitura desta pergunta";

        question.addEventListener("click", async () => {
            try {
                const atualizado = await apiRequest(`/faq/${item.id}`, "GET");
                if (atualizado && typeof atualizado.visualizacoes === "number") {
                    author.textContent = `${nomeMarcaOuAutor} • Categoria: ${categoriaLabel} • ${atualizado.visualizacoes} acessos`;
                }
            } catch {
                // Silencioso
            }
        });

        card.append(cardHeader, question);

        if (isAdmin) {
            const actions = document.createElement("div");
            actions.className = "faq-question-actions";
            const deleteButton = document.createElement("button");
            deleteButton.className = "faq-delete-button";
            deleteButton.type = "button";
            deleteButton.textContent = "Excluir pergunta";
            deleteButton.addEventListener("click", async () => {
                if (!window.confirm("Deseja realmente excluir esta pergunta do FAQ?")) return;
                try {
                    await apiRequest(`/faq/${item.id}`, "DELETE");
                    showMessage("Pergunta excluída com sucesso.", false);
                    await carregarFaq();
                } catch (erro) {
                    showMessage(erro.message || "Não foi possível excluir a pergunta.", true);
                }
            });
            actions.append(deleteButton);
            card.append(actions);
        }

        if (item.resposta) {
            const answer = document.createElement("div");
            answer.className = "faq-answer";
            const answerHeader = document.createElement("div");
            answerHeader.className = "faq-answer-header";
            const answerTitle = document.createElement("strong");
            answerTitle.textContent = `Resposta da equipe RBS (${item.respondidoPor || "Admin RBS"})`;
            const answeredAt = document.createElement("time");
            answeredAt.dateTime = item.respondidoEm || "";
            answeredAt.textContent = formatDate(item.respondidoEm);
            answerHeader.append(answerTitle, answeredAt);

            const answerText = document.createElement("p");
            answerText.textContent = item.resposta;
            answer.append(answerHeader, answerText);
            card.append(answer);
        } else if (isAdmin) {
            const answerForm = document.createElement("form");
            answerForm.className = "faq-answer-form";
            answerForm.style.marginTop = "12px";

            const answerLabel = document.createElement("label");
            const answerId = `answer-${item.id}`;
            answerLabel.htmlFor = answerId;
            answerLabel.textContent = "Sua resposta oficial (será movida para Perguntas Publicadas)";

            const answerInput = document.createElement("textarea");
            answerInput.id = answerId;
            answerInput.maxLength = 1000;
            answerInput.required = true;
            answerInput.placeholder = "Escreva uma resposta oficial (até 1.000 caracteres)";

            const answerButton = document.createElement("button");
            answerButton.className = "button button-primary";
            answerButton.style.alignSelf = "flex-end";
            answerButton.type = "submit";
            answerButton.textContent = "Responder e Publicar";

            answerForm.append(answerLabel, answerInput, answerButton);
            answerForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                const answerText = answerInput.value.trim();
                if (!answerText) return;
                answerButton.disabled = true;
                try {
                    await apiRequest(`/faq/${item.id}/responder`, "PUT", {
                        resposta: answerText,
                        publicarParaTodos: true
                    });
                    showMessage("Resposta publicada com sucesso no FAQ!", false);
                    await carregarFaq();
                } catch (erro) {
                    showMessage(erro.message || "Erro ao publicar resposta.", true);
                } finally {
                    answerButton.disabled = false;
                }
            });
            card.append(answerForm);
        } else {
            const pending = document.createElement("p");
            pending.className = "faq-pending";
            pending.textContent = "Aguardando resposta da equipe RBS";
            card.append(pending);
        }

        return card;
    }

    function renderizarListasFaq() {
        const catFiltro = filterCategorySelect ? filterCategorySelect.value : "";

        const recebidasFiltradas = cacheRecebidas.filter(
            item => !catFiltro || String(item.categoria || "GERAL").toUpperCase() === catFiltro
        );
        const publicadasFiltradas = cachePublicadas.filter(
            item => !catFiltro || String(item.categoria || "GERAL").toUpperCase() === catFiltro
        );

        if (countRecebidas) countRecebidas.textContent = String(recebidasFiltradas.length);
        if (countPublicadas) countPublicadas.textContent = String(publicadasFiltradas.length);

        if (listRecebidas) {
            listRecebidas.replaceChildren();
            if (recebidasFiltradas.length === 0) {
                const empty = document.createElement("p");
                empty.className = "faq-empty";
                empty.textContent = "Nenhuma pergunta aguardando resposta.";
                listRecebidas.appendChild(empty);
            } else {
                recebidasFiltradas.forEach(item => listRecebidas.appendChild(criarCardPergunta(item)));
            }
        }

        if (listPublicadas) {
            listPublicadas.replaceChildren();
            if (publicadasFiltradas.length === 0) {
                const empty = document.createElement("p");
                empty.className = "faq-empty";
                empty.textContent = "Ainda não há perguntas publicadas para esta categoria.";
                listPublicadas.appendChild(empty);
            } else {
                publicadasFiltradas.forEach(item => listPublicadas.appendChild(criarCardPergunta(item)));
            }
        }
    }

    async function carregarFaq() {
        try {
            const [publicadas, pendentes] = await Promise.all([
                apiRequest("/faq", "GET").catch(() => []),
                isAdmin ? apiRequest("/faq/pendentes", "GET").catch(() => []) : Promise.resolve([])
            ]);

            cacheRecebidas = (pendentes || []).filter(item => !item.resposta);
            cachePublicadas = (publicadas || []).filter(item => Boolean(item.resposta));

            renderizarListasFaq();
        } catch (erro) {
            console.error("Erro ao carregar FAQ:", erro);
            showMessage("Não foi possível carregar as perguntas do servidor.", true);
        }
    }

    filterCategorySelect?.addEventListener("change", renderizarListasFaq);

    input?.addEventListener("input", () => {
        if (counter) counter.textContent = `${input.value.length}/500`;
    });

    form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const perguntaTexto = input.value.trim();
        const categoriaEscolhida = categorySelect ? categorySelect.value : "GERAL";
        if (!perguntaTexto) {
            showMessage("Escreva uma pergunta antes de publicar.", true);
            return;
        }
        try {
            await apiRequest("/faq/perguntas", "POST", {
                pergunta: perguntaTexto,
                categoria: categoriaEscolhida
            });
            form.reset();
            if (counter) counter.textContent = "0/500";
            showMessage("Pergunta enviada para a equipe RBS! Assim que respondida, aparecerá nas perguntas publicadas.", false);
            await carregarFaq();
        } catch (erro) {
            showMessage(erro.message || "Não foi possível enviar sua pergunta.", true);
        }
    });

    await carregarFaq();
});