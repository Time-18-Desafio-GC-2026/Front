// Portal RBS — módulo: contas.

// INTEGRAÇÃO BACK-END: mover validação e criação de contas vinculadas para endpoints administrativos.
const USUARIOS_KEY = "rbs_usuarios";



// Separa, normaliza e remove e-mails repetidos.

function normalizarEmailsPatrocinador(valor) {

    return [...new Set(

        String(valor || "")

            .split(/[;,]/)

            .map(email => email.trim().toLowerCase())

            .filter(Boolean)

    )];

}



// Valida os e-mails antes de cadastrar a empresa.

function validarEmailsPatrocinador(valor) {

    const emails = normalizarEmailsPatrocinador(valor);



    if (emails.length === 0) {

        throw new Error("Informe pelo menos um e-mail.");

    }



    const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



    const invalido = emails.find(

        email => !formatoEmail.test(email)

    );



    if (invalido) {

        throw new Error(`E-mail inválido: ${invalido}`);

    }



    const usuarios = JSON.parse(

        localStorage.getItem(USUARIOS_KEY) || "[]"

    );



    const existente = emails.find(email =>

        usuarios.some(usuario =>

            String(usuario.email || "").trim().toLowerCase() === email

        )

    );



    if (existente) {

        throw new Error(

            `O e-mail ${existente} já possui uma conta cadastrada.`

        );

    }



    return emails;

}



// Gera uma senha temporária para cada conta.

function gerarSenhaTemporaria() {

    const caracteres =

        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";



    const valores = crypto.getRandomValues(new Uint8Array(16));



    return Array.from(valores, valor =>

        caracteres[valor % caracteres.length]

    ).join("");

}



// Cria uma conta vinculada à empresa para cada e-mail.

function criarContasPatrocinador(patrocinador, emails) {

    const usuarios = JSON.parse(

        localStorage.getItem(USUARIOS_KEY) || "[]"

    );



    const contasCriadas = emails.map(email => ({

        id: crypto.randomUUID(),

        nome: patrocinador.nome,

        email,

        senha: gerarSenhaTemporaria(),

        perfil: "patrocinador",

        patrocinadorId: patrocinador.id

    }));



    localStorage.setItem(

        USUARIOS_KEY,

        JSON.stringify([...usuarios, ...contasCriadas])

    );



    return contasCriadas.map(({ email, senha }) => ({

        email,

        senha

    }));

}





// ============================================================

// 3. CADASTRO, EDIÇÃO E EXCLUSÃO DE PATROCINADORES

// ============================================================
