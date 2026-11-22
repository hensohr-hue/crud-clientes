# Roteiro da videoaula – explicação do código

Duração prevista: **cerca de 25 minutos**, em 13 blocos.

## Preparação antes de gravar

- Fechar o SistemaClientes.exe (ou qualquer programa na porta 3001) e iniciar o projeto pelo iniciar.bat.
- Deixar apenas os clientes de exemplo: apagar backend/data/clientes.json antes de iniciar (ele é recriado com os 3 clientes fictícios). Fazer cópia antes se quiser manter os dados atuais.
- Aumentar a fonte do VS Code (Ctrl + =) e o zoom do navegador para 125% para facilitar a leitura no vídeo.
- Fechar abas e notificações; deixar abertos apenas VS Code, navegador e terminal.
- Abrir com antecedência os arquivos de cada bloco, na ordem do roteiro.
- Testar o microfone e gravar 10 segundos de teste.
- Deixar o terminal pronto na pasta backend para rodar npm test.

## Cronograma

| Nº | Tempo | Bloco | O que mostrar |
|---|---|---|---|
| 1 | 00:00 – 01:30 | Abertura e apresentação do problema | Tela de login aberta no navegador e o README no VS Code. |
| 2 | 01:30 – 03:30 | Demonstração rápida do sistema | Navegador em http://localhost:3001. |
| 3 | 03:30 – 05:00 | Arquitetura e estrutura de pastas | Árvore de pastas no VS Code e a seção "Estrutura" do README. |
| 4 | 05:00 – 06:30 | Tecnologias e design system (skill ui-ux-pro-max) | Tabela de tecnologias do README e o arquivo MASTER.md. |
| 5 | 06:30 – 08:30 | Servidor Express: server.js e app.js | Os dois arquivos lado a lado. |
| 6 | 08:30 – 11:30 | Camadas do back-end seguindo um POST /clientes | Navegar entre os arquivos na ordem em que a requisição passa. |
| 7 | 11:30 – 14:00 | Autenticação: login, senha e token | auth.service.js e middlewares/autenticar.js. |
| 8 | 14:00 – 15:30 | Testando a API | api.http no VS Code (REST Client) e o terminal com npm test. |
| 9 | 15:30 – 18:00 | Front-end: HTML e CSS | index.html, login.html e style.css. |
| 10 | 18:00 – 21:00 | Front-end: JavaScript | api.js, app.js e login.js. |
| 11 | 21:00 – 22:30 | Fluxo completo no DevTools | Navegador com o DevTools aberto na aba Rede (Network). |
| 12 | 22:30 – 23:30 | Tratamento de erros e o problema da porta | Terminal e navegador. |
| 13 | 23:30 – 25:00 | GitHub e encerramento | Repositório no GitHub (README com imagens e aba Actions). |

## Roteiro detalhado

### 1. Abertura e apresentação do problema (00:00 – 01:30)

**Arquivos:** README.md

- Apresentar-se: nome, curso (Sistemas de Informação), disciplina e professor.
- Situação-problema: pequena empresa controlava clientes de forma manual.
- Objetivo: sistema web com front-end em HTML, CSS e JavaScript e back-end em Node.js com Express.
- O que será visto: demonstração, arquitetura, back-end, autenticação, front-end, testes e GitHub.

> **Sugestão de fala:** "Neste vídeo vou mostrar o sistema de cadastro de clientes que desenvolvi para a APO e explicar, passo a passo, como o navegador conversa com a API."

### 2. Demonstração rápida do sistema (01:30 – 03:30)

**Arquivos:** —

- Tentar entrar com senha errada e mostrar a mensagem de erro.
- Entrar com admin / admin123; mostrar o nome do usuário e o botão Sair.
- Cadastrar um cliente, mostrando a máscara de telefone e o aviso de sucesso.
- Enviar o formulário vazio para mostrar os erros nos campos e o resumo.
- Buscar pelo nome, editar o cliente e excluí-lo pela janela de confirmação.
- Reduzir a janela (ou usar o modo celular do DevTools) para mostrar o layout em cartões.

> **Sugestão de fala:** "Antes de abrir o código, vamos ver o sistema funcionando: login, cadastro, edição, busca e exclusão."

### 3. Arquitetura e estrutura de pastas (03:30 – 05:00)

**Arquivos:** backend/, frontend/, design-system/, docs/

- Modelo cliente-servidor: o navegador pede, o servidor responde com status HTTP e JSON.
- backend: servidor, rotas, regras, autenticação, dados e testes.
- frontend: páginas de login e de clientes, CSS e JavaScript.
- O Express também entrega o front-end (express.static): um único endereço para tudo.

> **Sugestão de fala:** "O projeto tem duas partes independentes que se falam por HTTP. O back-end nunca monta HTML: ele só devolve JSON."

### 4. Tecnologias e design system (skill ui-ux-pro-max) (05:00 – 06:30)

**Arquivos:** design-system/cadastro-de-clientes/MASTER.md

- Por que JavaScript nas duas pontas: mesma linguagem e mesmo formato de dados.
- A skill gerou o design system: Flat Design, Poppins + Open Sans, ícones SVG.
- A skill sugeriu azul; foi mantido o verde #047857, com contraste 5,5:1 (WCAG AA).

> **Sugestão de fala:** "As cores, fontes e regras de usabilidade não foram escolhidas no achismo: vieram de um design system gerado pela skill ui-ux-pro-max."

### 5. Servidor Express: server.js e app.js (06:30 – 08:30)

**Arquivos:** backend/src/server.js (linhas 8 e 15); backend/src/app.js (linhas 12 a 45)

- server.js lê o .env (porta 3001), inicia o servidor e cria o usuário admin na primeira execução.
- Tratamento de porta ocupada (EADDRINUSE) com mensagem clara (linha 15).
- app.js: pipeline de middlewares — cors, express.json, log, rotas, express.static, 404 e erros.
- Linha 23: o middleware autenticar protege todas as rotas /clientes.
- Middleware de erro no final: transforma ErroNegocio em status 400, 404 ou 409.

> **Sugestão de fala:** "Cada requisição passa por essa fila de funções, uma de cada vez. Quem chama next() deixa a requisição seguir para a próxima."

### 6. Camadas do back-end seguindo um POST /clientes (08:30 – 11:30)

**Arquivos:** routes/clientes.routes.js (linha 9) → controllers/clientes.controller.js (linha 20) → services/clientes.service.js (linhas 23, 35 e 57) → repositories/clientes.repository.js (linhas 9 e 35)

- Router: associa método + caminho a uma função do controller.
- Controller: recebe req, chama o service e responde 201 com o cabeçalho Location.
- Service: normaliza os dados, valida nome e e-mail e impede e-mail duplicado (409).
- Repository: única camada que lê e grava o clientes.json; gera o id e as datas.
- Primeira execução: se o clientes.json não existir, copia o clientes.exemplo.json.

> **Sugestão de fala:** "Separar em camadas deixa cada arquivo com uma responsabilidade. Se um dia trocarmos o JSON por um banco de dados, só o repository muda."

### 7. Autenticação: login, senha e token (11:30 – 14:00)

**Arquivos:** backend/src/services/auth.service.js (linhas 14, 20, 28 e 47); backend/src/middlewares/autenticar.js (linha 10); backend/data/usuarios.json

- gerarHash: a senha vira "scrypt$salt$hash" — nunca é salva em texto.
- conferirSenha: recalcula o hash e compara com timingSafeEqual.
- login: mesma mensagem para usuário inexistente e senha errada; gera token aleatório de 8 horas.
- autenticar: lê "Authorization: Bearer <token>"; sem token válido responde 401.
- Mostrar o usuarios.json com o hash e o comando npm run criar-usuario.

> **Sugestão de fala:** "Mesmo que alguém abra o arquivo de usuários, não consegue descobrir a senha, porque só o hash fica guardado."

### 8. Testando a API (14:00 – 15:30)

**Arquivos:** backend/api.http; backend/tests/clientes.test.js

- Executar o login no api.http e depois listar, cadastrar e tentar acessar sem token (401).
- Rodar npm test: 21 testes aprovados.
- Os testes usam um arquivo JSON temporário e não alteram os dados reais.
- Comentar que o GitHub Actions roda esses mesmos testes a cada envio.

> **Sugestão de fala:** "Os testes automáticos garantem que cada rota responde com o status certo, inclusive nos casos de erro."

### 9. Front-end: HTML e CSS (15:30 – 18:00)

**Arquivos:** frontend/index.html; frontend/login.html; frontend/css/style.css (linhas 6, 311, 342 e 360)

- HTML semântico: header, main, section e o elemento dialog para cadastro e exclusão.
- Ícones SVG reaproveitados com <use href="#i-...">.
- Acessibilidade: label em todo campo, aria-describedby nos erros, link "Pular para o conteúdo".
- style.css: tokens do design system em :root (linha 6).
- Mobile first: media queries de 768 e 1024 px; a tabela vira cartões no celular.
- prefers-reduced-motion (linha 360): desliga animações para quem prefere.

> **Sugestão de fala:** "O CSS começa pelo celular e vai ganhando colunas conforme a tela aumenta. Todas as cores estão em variáveis, então trocar o verde é mudar uma linha."

### 10. Front-end: JavaScript (18:00 – 21:00)

**Arquivos:** frontend/js/api.js (linhas 17, 46, 81 e 91); frontend/js/app.js (linhas 157, 199, 222, 334 e 394); frontend/js/login.js (linha 42)

- api.js — requisitar: fetch com o token, trata 401 (volta ao login), 204 e erros da API.
- api.js — modo simulado (?simulado) usado na Etapa 1, antes da integração.
- login.js: valida os campos, chama auth.login e guarda o token no sessionStorage.
- app.js — carregarClientes e renderizarLista: monta a tabela com createElement e textContent (evita injeção de HTML).
- app.js — validarCampo e submit do formulário: erro no campo, resumo de erros, POST ou PUT.
- app.js — exclusão: janela de confirmação com foco no Cancelar e DELETE na API.

> **Sugestão de fala:** "Toda a conversa com o servidor passa por uma única função, requisitar. Assim, o tratamento de erro e o token ficam em um lugar só."

### 11. Fluxo completo no DevTools (21:00 – 22:30)

**Arquivos:** —

- Cadastrar um cliente e mostrar a requisição POST /clientes, o cabeçalho Authorization e o corpo JSON.
- Mostrar a resposta 201 com o cliente criado e, em seguida, o GET /clientes que atualiza a lista.
- Excluir e mostrar o DELETE com resposta 204 (sem corpo).
- Recapitular o caminho: navegador → JavaScript → fetch → Express → camadas → JSON → DOM.

> **Sugestão de fala:** "Aqui dá para ver, na prática, o que acontece por trás de cada clique."

### 12. Tratamento de erros e o problema da porta (22:30 – 23:30)

**Arquivos:** backend/src/server.js; iniciar.bat; backend/.env

- Parar o servidor e recarregar a página: mensagem "Não foi possível carregar os clientes" e botão Tentar novamente.
- Contar o problema real: outro programa usava a porta 3000 e a tela de login não abria.
- Solução: porta padrão 3001, mensagem clara no servidor e verificação no iniciar.bat; a porta pode ser trocada no .env.

> **Sugestão de fala:** "Um erro que aconteceu de verdade durante o projeto: a porta estava ocupada. Agora o sistema avisa e explica como resolver."

### 13. GitHub e encerramento (23:30 – 25:00)

**Arquivos:** README.md; .gitignore; LICENSE; .github/workflows/testes.yml

- README com imagens, instruções e rotas; licença MIT.
- .gitignore: node_modules, .env e os dados reais não vão para o GitHub.
- GitHub Actions executando os testes nas versões 20, 22 e 24 do Node.js.
- Encerrar: resumo do que foi aprendido e possíveis melhorias (banco de dados, perfis de usuário).

> **Sugestão de fala:** "O código está no GitHub, com instruções para qualquer pessoa baixar e rodar. Obrigado por assistir."

## Dicas de gravação

- Fale com calma: é melhor um vídeo de 25 minutos claro do que 15 minutos corridos.
- Antes de abrir cada arquivo, diga o que ele faz; depois mostre o trecho.
- Use o cursor ou a seleção do VS Code para destacar a linha que está explicando.
- Se errar, faça uma pausa de 3 segundos e repita a frase: fica fácil cortar na edição.
- Grave em blocos (um por item do cronograma) e junte depois, se preferir.
- Ferramentas gratuitas: OBS Studio (gravação), Clipchamp ou DaVinci Resolve (edição).
