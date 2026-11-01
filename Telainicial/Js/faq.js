// Controla publicação, respostas, exclusão e sincronização das perguntas do FAQ.
// INTEGRAÇÃO BACK-END: substituir a persistência local por endpoints de perguntas e respostas.
(function () {
    const STORAGE_KEY = "rbs_faq_questions";
    let session;
    try {
        session = JSON.parse(localStorage.getItem("rbs_sessao") || "null");
    } catch (error) {
        console.error("Não foi possível ler a sessão do FAQ:", error);
        window.location.replace("../Teladelogin/indexLogin.html");
        return;
    }

    const isAdmin = session?.perfil === "funcionario";
    const form = document.getElementById("questionForm");
    const input = document.getElementById("questionInput");
    const counter = document.getElementById("questionCounter");
    const list = document.getElementById("faqList");
    const message = document.getElementById("faqMessage");
    const questionCount = document.getElementById("questionCount");

    document.querySelectorAll('[data-role="funcionario"]').forEach((link) => {
        link.hidden = !isAdmin;
    });
    document.querySelectorAll('[data-role="patrocinador"]').forEach((link) => {
        link.hidden = isAdmin;
    });

    document.getElementById("workspaceTitle").textContent = isAdmin
        ? "Administração RBS"
        : "Patrocinador RBS";
    document.getElementById("workspaceDescription").textContent = isAdmin
        ? "Atendimento aos patrocinadores"
        : "Perguntas frequentes";
    document.getElementById("breadcrumbArea").textContent = isAdmin
        ? "Administração RBS"
        : "Patrocinador RBS";
    document.getElementById("accountRole").textContent = isAdmin
        ? "Equipe RBS"
        : "Patrocinador";

    if (isAdmin) {
        document.getElementById("questionSection").hidden = true;
        document.getElementById("faqIntro").textContent =
            "Consulte todas as perguntas enviadas pelos patrocinadores e publique respostas.";
        document.getElementById("questionsHeading").textContent =
            "Perguntas recebidas";
    }

    function showMessage(text, isError) {
        message.textContent = text;
        message.classList.toggle("is-error", Boolean(isError));
    }

    function readQuestions() {
        let stored;
        try {
            stored = localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            console.error("Não foi possível acessar as perguntas do FAQ:", error);
            showMessage("Não foi possível acessar as perguntas salvas neste navegador.", true);
            return [];
        }

        if (!stored) return [];

        try {
            const questions = JSON.parse(stored);
            if (!Array.isArray(questions)) {
                throw new TypeError("O formato das perguntas salvas é inválido.");
            }
            return questions.filter((item) =>
                item &&
                typeof item.id === "string" &&
                typeof item.question === "string" &&
                typeof item.author === "string"
            );
        } catch (error) {
            console.error("Não foi possível interpretar as perguntas do FAQ:", error);
            showMessage("Os dados salvos do FAQ estão inválidos. Não foi possível carregar as perguntas.", true);
            return [];
        }
    }

    function saveQuestions(questions) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
            return true;
        } catch (error) {
            console.error("Não foi possível salvar as perguntas do FAQ:", error);
            showMessage("Não foi possível salvar. Verifique o espaço disponível no navegador.", true);
            return false;
        }
    }

    function formatDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "Data indisponível";
        return new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short"
        }).format(date);
    }

    function createQuestionCard(item) {
        const card = document.createElement("article");
        card.className = "faq-card";
        const actorEmail = String(session.email || "").trim().toLowerCase();
        const canDelete = isAdmin || (
            item.authorEmail &&
            String(item.authorEmail).trim().toLowerCase() === actorEmail
        );

        const cardHeader = document.createElement("div");
        cardHeader.className = "faq-card-header";
        const author = document.createElement("strong");
        author.textContent = item.author;
        const createdAt = document.createElement("time");
        createdAt.dateTime = item.createdAt || "";
        createdAt.textContent = formatDate(item.createdAt);
        cardHeader.append(author, createdAt);

        const question = document.createElement("p");
        question.className = "faq-question";
        question.textContent = item.question;
        card.append(cardHeader, question);

        if (canDelete) {
            const actions = document.createElement("div");
            actions.className = "faq-question-actions";

            const deleteButton = document.createElement("button");
            deleteButton.className = "faq-delete-button";
            deleteButton.type = "button";
            deleteButton.textContent = "Excluir pergunta";
            deleteButton.addEventListener("click", () => {
                if (!window.confirm(`Deseja excluir a pergunta de "${item.author}"?`)) {
                    return;
                }

                const questions = readQuestions();
                const target = questions.find((questionItem) => questionItem.id === item.id);
                if (!target) {
                    showMessage("A pergunta não foi encontrada. Atualize a página e tente novamente.", true);
                    render();
                    return;
                }

                const updatedQuestions = questions.filter(
                    (questionItem) => questionItem.id !== item.id
                );
                if (saveQuestions(updatedQuestions)) {
                    registrarHistorico(
                        `${isAdmin ? "Equipe RBS" : "Patrocinador"} excluiu uma pergunta de "${target.author}" na FAQ.`,
                        session.email
                    );
                    showMessage("Pergunta excluída.", false);
                    render();
                }
            });

            actions.append(deleteButton);
            card.append(actions);
        }

        if (item.answer) {
            const answer = document.createElement("div");
            answer.className = "faq-answer";
            const answerHeader = document.createElement("div");
            answerHeader.className = "faq-answer-header";
            const answerTitle = document.createElement("strong");
            answerTitle.textContent = "Resposta da equipe RBS";
            const answeredAt = document.createElement("time");
            answeredAt.dateTime = item.answeredAt || "";
            answeredAt.textContent = formatDate(item.answeredAt);
            answerHeader.append(answerTitle, answeredAt);
            const answerText = document.createElement("p");
            answerText.textContent = item.answer;
            answer.append(answerHeader, answerText);
            card.append(answer);
        } else if (isAdmin) {
            const answerForm = document.createElement("form");
            answerForm.className = "faq-answer-form";
            const answerLabel = document.createElement("label");
            const answerId = `answer-${item.id}`;
            answerLabel.htmlFor = answerId;
            answerLabel.textContent = "Sua resposta";
            const answerInput = document.createElement("textarea");
            answerInput.id = answerId;
            answerInput.maxLength = 1000;
            answerInput.required = true;
            answerInput.placeholder = "Escreva uma resposta (até 1.000 caracteres)";
            const answerButton = document.createElement("button");
            answerButton.className = "button button-primary";
            answerButton.type = "submit";
            answerButton.textContent = "Responder";
            answerForm.append(answerLabel, answerInput, answerButton);
            answerForm.addEventListener("submit", (event) => {
                event.preventDefault();
                const answerText = answerInput.value.trim();
                if (!answerText) {
                    showMessage("Escreva uma resposta antes de enviar.", true);
                    return;
                }

                const questions = readQuestions();
                const target = questions.find((questionItem) => questionItem.id === item.id);
                if (!target) {
                    showMessage("A pergunta não foi encontrada. Atualize a página e tente novamente.", true);
                    render();
                    return;
                }
                target.answer = answerText;
                target.answeredBy = session.nome || "Equipe RBS";
                target.answeredAt = new Date().toISOString();
                if (saveQuestions(questions)) {
                    registrarHistorico(
                        `Equipe RBS respondeu à pergunta de "${target.author}" na FAQ.`,
                        session.email
                    );
                    showMessage("Resposta publicada.", false);
                    render();
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

    function render() {
        const questions = readQuestions().sort((first, second) =>
            new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
        );
        list.replaceChildren();
        questionCount.textContent = `${questions.length} ${questions.length === 1 ? "pergunta" : "perguntas"}`;

        if (!questions.length) {
            const empty = document.createElement("p");
            empty.className = "faq-empty";
            empty.textContent = "Ainda não há perguntas. Seja a primeira pessoa a enviar uma dúvida.";
            list.append(empty);
            return;
        }

        questions.forEach((item) => list.append(createQuestionCard(item)));
    }

    input.addEventListener("input", () => {
        counter.textContent = `${input.value.length}/500`;
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const question = input.value.trim();
        if (!question) {
            showMessage("Escreva uma pergunta antes de publicar.", true);
            return;
        }

        const questions = readQuestions();
        questions.push({
            id: window.crypto?.randomUUID
                ? window.crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                question,
                author: session.nome || "Patrocinador",
                authorEmail: session.email || "",
                createdAt: new Date().toISOString(),
            answer: "",
            answeredBy: "",
            answeredAt: ""
        });

        if (saveQuestions(questions)) {
            registrarHistorico(
                `${session.nome || "Patrocinador"} publicou uma pergunta na FAQ.`,
                session.email
            );
            form.reset();
            counter.textContent = "0/500";
            showMessage("Pergunta publicada para a comunidade.", false);
            render();
        }
    });

    const logoutButton = document.getElementById("logoutButton");
    logoutButton.addEventListener("click", () => {
        if (!window.confirm("Deseja realmente sair da plataforma?")) return;
        registrarHistorico(
            isAdmin
                ? "Encerrou a sessão da equipe RBS."
                : "Encerrou a sessão de patrocinador.",
            session.email
        );
        sessionStorage.removeItem("rbs_usuario_email");
        localStorage.removeItem("rbs_sessao");
        window.location.replace("../Teladelogin/indexLogin.html");
    });

    window.addEventListener("storage", (event) => {
        if (event.key === STORAGE_KEY) {
            showMessage("As perguntas foram atualizadas.", false);
            render();
        }
    });

    render();
})();
