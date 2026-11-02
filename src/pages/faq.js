/**
 * ==========================================================================
 * PORTAL RBS — CONTROLADOR DE FAQ E ALERTAS (INTEGRADO À API JAVA / SUPABASE)
 * ==========================================================================
 */
document.addEventListener("DOMContentLoaded", async function () {
    const sessao = JSON.parse(localStorage.getItem("rbs_sessao") || "null");
    if (!sessao) return;

    const perfil = String(sessao.perfil || "").toLowerCase();
    const isAdmin = perfil === "funcionario" || perfil === "admin" || perfil === "superadmin";

    const questionSection = document.getElementById("questionSection");
    const faqIntro = document.getElementById("faqIntro");
    const questionsHeading = document.getElementById("questionsHeading");
    const form = document.getElementById("questionForm");
    const categorySelect = document.getElementById("questionCategory");
    const input = document.getElementById("questionInput");
    const counter = document.getElementById("questionCounter");
    const list = document.getElementById("faqList");
    const message = document.getElementById("faqMessage");
    const questionCount = document.getElementById("questionCount");

    if (isAdmin) {
        if (questionSection) questionSection.hidden = true;
        if (faqIntro) {
            faqIntro.textContent = "Consulte todas as dúvidas enviadas pelos patrocinadores e publique respostas oficiais.";
        }
        if (questionsHeading) {
            questionsHeading.textContent = "Perguntas recebidas e publicadas";
        }
    }

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
        const nomeMarcaOuAutor = item.marcaNome || item.autorMarcaNome || item.categoria || "Patrocinador";
        const visualizacoes = item.visualizacoes ?? 0;
        author.textContent = `${nomeMarcaOuAutor} • [${item.categoria || "GERAL"}] • 👁️ ${visualizacoes} acessos`;

        const createdAt = document.createElement("time");
        createdAt.dateTime = item.criadoEm || "";
        createdAt.textContent = formatDate(item.criadoEm);

        cardHeader.append(author, createdAt);

        const question = document.createElement("p");
        question.className = "faq-question";
        question.textContent = item.pergunta;
        question.style.cursor = "pointer";
        question.title = "Clique para registrar leitura deste artigo";

        // Registra visualização no ranking do Back-end (GET /faq/{id})
        question.addEventListener("click", async () => {
            try {
                const atualizado = await apiRequest(`/faq/${item.id}`, "GET");
                if (atualizado && typeof atualizado.visualizacoes === "number") {
                    author.textContent = `${nomeMarcaOuAutor} • [${item.categoria || "GERAL"}] • 👁️ ${atualizado.visualizacoes} acessos`;
                }
            } catch {
                // Silencioso caso falhe
            }
        });

        card.append(cardHeader, question);

        // Botão de exclusão (Admin ou autor da pergunta)
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
                    showMessage("Pergunta excluída do banco de dados.", false);
                    await carregarFaq();
                } catch (erro) {
                    showMessage(erro.message || "Não foi possível excluir a pergunta.", true);
                }
            });

            actions.append(deleteButton);
            card.append(actions);
        }

        // Exibe a resposta se já estiver respondida, ou o formulário para o Admin RBS responder
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

            const answerLabel = document.createElement("label");
            const answerId = `answer-${item.id}`;
            answerLabel.htmlFor = answerId;
            answerLabel.textContent = "Sua resposta oficial (será publicada no FAQ para os patrocinadores)";

            const answerInput = document.createElement("textarea");
            answerInput.id = answerId;
            answerInput.maxLength = 1000;
            answerInput.required = true;
            answerInput.placeholder = "Escreva uma resposta oficial (até 1.000 caracteres)";

            const answerButton = document.createElement("button");
            answerButton.className = "button button-primary";
            answerButton.type = "submit";
            answerButton.textContent = "Responder e Publicar";

            answerForm.append(answerLabel, answerInput, answerButton);

            answerForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                const answerText = answerInput.value.trim();
                if (!answerText) {
                    showMessage("Escreva uma resposta antes de enviar.", true);
                    return;
                }

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

    async function carregarFaq() {
        try {
            const [publicadas, pendentes] = await Promise.all([
                apiRequest("/faq", "GET").catch(() => []),
                isAdmin ? apiRequest("/faq/pendentes", "GET").catch(() => []) : Promise.resolve([])
            ]);

            // Junta pendentes (no topo para o Admin) + publicadas sem duplicar IDs
            const mapa = new Map();
            (pendentes || []).forEach(item => mapa.set(item.id, item));
            (publicadas || []).forEach(item => {
                if (!mapa.has(item.id)) mapa.set(item.id, item);
            });

            const listaFinal = Array.from(mapa.values());

            list.replaceChildren();
            questionCount.textContent = `${listaFinal.length} ${listaFinal.length === 1 ? "pergunta" : "perguntas"}`;

            if (listaFinal.length === 0) {
                const empty = document.createElement("p");
                empty.className = "faq-empty";
                empty.textContent = "Ainda não há perguntas publicadas no FAQ.";
                list.appendChild(empty);
                return;
            }

            listaFinal.forEach((item) => list.append(criarCardPergunta(item)));
        } catch (erro) {
            console.error("Erro ao carregar FAQ:", erro);
            showMessage("Não foi possível carregar as perguntas do servidor.", true);
        }
    }

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
            showMessage("Pergunta enviada para a equipe RBS! Assim que respondida, ficará visível no mural.", false);
            await carregarFaq();
        } catch (erro) {
            showMessage(erro.message || "Não foi possível enviar sua pergunta.", true);
        }
    });

    await carregarFaq();
});