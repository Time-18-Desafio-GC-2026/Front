# Portal de Patrocinadores RBS

Portal web para acompanhar patrocinadores, conteúdos, relatórios e atividades da operação. O projeto oferece áreas distintas para administradores e patrocinadores, com interface responsiva e alternância entre tema claro e escuro.

> **Estado do projeto:** protótipo front-end estático. Os dados ficam no armazenamento local do navegador; não há API ou banco de dados.

## Funcionalidades

- Login de demonstração e direcionamento conforme o perfil.
- Dashboard administrativo para cadastrar, buscar e visualizar patrocinadores.
- Área do patrocinador para consultar informações da empresa e seus materiais.
- Páginas de relatórios, auditoria e perfil.
- Histórico de logins, cadastros, publicações, envios e downloads, armazenado no navegador atual.
- Preferência de tema salva no navegador.
- Nome e avatar da conta atualizados nas telas compartilhadas.

## Como executar

Não é necessário instalar dependências ou compilar o projeto. Para que a navegação entre páginas e o armazenamento do navegador funcionem de forma consistente, execute-o por um servidor estático local.

### Com Python

1. Abra um terminal na pasta raiz do projeto.
2. Inicie o servidor:

   ```powershell
   py -m http.server 8000
   ```

3. Acesse <http://localhost:8000/Teladelogin/indexLogin.html>.
4. Para encerrar o servidor, pressione `Ctrl+C` no terminal.

Também é possível abrir a pasta no VS Code e iniciar um servidor local com uma extensão como **Live Server**. Nesse caso, abra `Teladelogin/indexLogin.html`.

## Contas de demonstração

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `adm1@gmail.com` | `adm123` |
| Patrocinador | `patrocinador1@gmail.com` | `patrocinador123` |

O formulário também normaliza o domínio digitado como `@gamil.com` para `@gmail.com` durante o login.

## Estrutura principal

```text
Teladelogin/                  Login e estilos da tela de acesso
Telainicial/
  index.html                  Dashboard administrativo
  Js/                         Autenticação, conta, tema e módulos de gestão
  css/                        Estilos compartilhados e tema visual
  TelaPatrocinador/           Dashboard e módulos da visão do patrocinador
Telarelatorio/                Relatórios
Telahistorico/                Auditoria e histórico
teladeconfig/                 Perfil e configurações
copiass/                      Cópias antigas de páginas (legado)
```

## Tecnologias

- HTML
- CSS
- JavaScript sem framework
- `localStorage` e `sessionStorage` do navegador

## Observações importantes

- As contas, senhas, sessões e demais dados deste protótipo são armazenados no navegador. Não use informações reais ou sensíveis.
- As credenciais de demonstração estão visíveis no código e **não representam autenticação segura**. Um ambiente de produção precisa de autenticação e armazenamento no servidor, senhas protegidas e validação de permissões no back-end.
- Limpar os dados do site no navegador remove as informações locais salvas pelo protótipo.
- A pasta `copiass/` contém versões legadas; para executar a versão atual, use as páginas e pastas listadas em **Estrutura principal**.
