# Automation Exercise - Testes E2E com Cypress

[![Cypress Tests](https://github.com/Arckangelo/automationexercise-cypress-tests/actions/workflows/cypress.yml/badge.svg)](https://github.com/Arckangelo/automationexercise-cypress-tests/actions/workflows/cypress.yml)

📊 [Relatório HTML da última execução](https://arckangelo.github.io/automationexercise-cypress-tests/) (gerado e publicado pelo CI) · 🐞 [Relatório de bugs (PDF)](docs/Relatorio_de_Bugs.pdf) · [BUGS.md](BUGS.md)

Suíte de testes automatizados end-to-end para o site [AutomationExercise](https://automationexercise.com), um e-commerce fictício criado para prática de automação de testes.

> Veja também meu [projeto em Python + Playwright](https://github.com/Arckangelo/saucedemo-playwright-python), com testes E2E do SauceDemo.

## 🎯 Objetivo

Projeto desenvolvido para praticar e demonstrar habilidades em automação de testes, cobrindo fluxos essenciais de um e-commerce: autenticação, cadastro, navegação, busca, filtros e o fluxo completo de compra (carrinho e checkout).

## 🛠️ Tecnologias

- [Cypress](https://www.cypress.io/) 15 - Framework de testes E2E
- JavaScript
- Mocha/Chai (assertions, nativos do Cypress)
- Testes de API com `cy.request` (nativo do Cypress, sem lib extra)
- [cypress-mochawesome-reporter](https://github.com/LironEr/cypress-mochawesome-reporter) - Relatório HTML com screenshots das falhas
- GitHub Actions para integração contínua e GitHub Pages para publicar o relatório

## ✅ O que é testado

### UI

| Arquivo | Cobertura |
|---|---|
| `login.cy.js` | Login com credenciais válidas, senha incorreta e email não cadastrado |
| `signup.cy.js` | Cadastro completo de novo usuário com todos os campos do formulário (a conta é removida via API ao final) |
| `search.cy.js` | Busca de produtos com e sem resultados |
| `filter.cy.js` | Filtro de produtos por categoria (Men > Jeans, Women > Dress) e por marca (Polo), validando o título da listagem |
| `checkout.cy.js` | Adicionar/remover produtos do carrinho e fluxo de checkout autenticado |

**Total: 12 testes automatizados**

### API

A [API pública do AutomationExercise](https://automationexercise.com/api_list) responde sempre com HTTP 200,
mesmo em erro — quem indica sucesso ou falha é o campo `responseCode` do corpo da resposta. Os testes abaixo
validam isso explicitamente, em vez de confiar no status HTTP.

| Arquivo | Cobertura |
|---|---|
| `products.api.cy.js` | Listagem de produtos e marcas, e rejeição de método HTTP não suportado |
| `search.api.cy.js` | Busca de produto por termo, e erro 400 quando o parâmetro não é enviado |
| `login.api.cy.js` | Verificação de login: credenciais válidas, senha incorreta, usuário inexistente, campo faltando e método não suportado |
| `account.api.cy.js` | Criar, consultar e remover uma conta descartável (fluxo completo e autolimpo), além de cenários de erro (dados incompletos, conta inexistente) |

**Total: 13 testes automatizados**

**Suíte completa: 25 testes (12 de UI + 13 de API)**

### 🐞 Bugs conhecidos

Durante a exploração foram encontrados **5 bugs** no site e na API, documentados com passos de
reprodução, resultado esperado e obtido, causa raiz e proposta de correção:

- **[BUGS.md](BUGS.md)**: versão resumida, para leitura rápida no GitHub
- **[Relatório de Bugs (PDF)](docs/Relatorio_de_Bugs.pdf)**: relatório completo, com análise de causa raiz, soluções propostas e plano de correção

| ID | Severidade | Resumo |
|---|---|---|
| BUG-01 | Alta | Carrinho aceita quantidade negativa (total negativo) |
| BUG-02 | Média | Carrinho aceita quantidade zero |
| BUG-03 | Baixa | Fontes bloqueadas por Mixed Content (`@import http://` no CSS) |
| BUG-04 | Média | API retorna HTTP 200 em respostas de erro |
| BUG-05 | Baixa | API serve JSON com `Content-Type: text/html` |

Cada bug tem um **teste de regressão** em `cypress/e2e/known-bugs/` (9 testes). Esses testes descrevem
o comportamento correto e, por isso, **falham enquanto o bug existir**. Eles ficam fora da suíte
principal (`npm test`) e rodam num job separado do CI, que não quebra o pipeline e roda também
**diariamente**, para acompanhar se algum bug foi corrigido. Localmente: `npm run test:bugs`.

## 📁 Estrutura do projeto
```
.github/workflows/cypress.yml    # CI: suíte principal, bugs conhecidos e publicação do relatório
docs/Relatorio_de_Bugs.pdf       # relatório completo de bugs
BUGS.md                          # resumo dos bugs encontrados
cypress/
├── e2e/
│   ├── api/
│   │   ├── account.api.cy.js    # cenários de teste da API de conta
│   │   ├── login.api.cy.js      # cenários de login via API
│   │   ├── products.api.cy.js   # cenários de produtos via API
│   │   └── search.api.cy.js     # cenários de busca via API
│   ├── auth/
│   │   ├── login.cy.js          # cenários de teste de login via UI
│   │   └── signup.cy.js         # cenários de teste de cadastro via UI
│   ├── cart/
│   │   └── checkout.cy.js       # cenários de teste do checkout
│   ├── known-bugs/              # testes de regressão de bugs conhecidos (fora da suíte padrão)
│   │   ├── api-http-status.cy.js  # BUG-04/05: status HTTP e Content-Type da API
│   │   ├── cart-quantity.cy.js    # BUG-01/02: quantidade negativa/zero no carrinho
│   │   └── mixed-content.cy.js    # BUG-03: @import http:// nas folhas de estilo
│   └── products/
│       ├── filter.cy.js         # cenários de teste de filtro de produtos
│       └── search.cy.js         # cenários de teste de busca de produtos
├── fixtures/
│   ├── apiData.json             # massa de dados dos testes de API
│   └── users.json               # dados de cenários negativos (senha incorreta, usuário inexistente)
└── support/
    ├── commands.js              # comandos customizados do Cypress
    ├── e2e.js                   # configurações globais carregadas antes dos testes
    └── usuarioDeTeste.js        # cria e remove a conta descartável usada nos testes com login
```

## 🚀 Como rodar o projeto

**Pré-requisitos:** Node.js instalado

1. Clone o repositório
```bash
git clone https://github.com/Arckangelo/automationexercise-cypress-tests.git
cd automationexercise-cypress-tests
```

2. Instale as dependências
```bash
npm install
```

3. Rode os testes

```bash
npm test             # roda toda a suíte sem abrir o navegador (como no CI)
npx cypress open     # abre a interface do Cypress
npm run test:bugs    # roda só os testes de bugs conhecidos (falham enquanto os bugs existirem)
```

Na interface, escolha **E2E Testing** → selecione um navegador → clique em qualquer arquivo `.cy.js` para rodar.

Cada execução headless gera um relatório HTML em `cypress/reports/` (`suite/` ou `known-bugs/`).

## ⚙️ Integração contínua

O workflow [`cypress.yml`](.github/workflows/cypress.yml) roda a cada push e pull request na `main`, e diariamente às 06:00 UTC:

| Job | O que faz |
|---|---|
| Suíte principal | Roda os 25 testes; salva as screenshots das falhas e o relatório HTML como artefatos |
| Bugs conhecidos | Roda os 9 testes de regressão sem quebrar o pipeline e indica no resumo se algum bug foi corrigido |
| Publicar relatório | Publica os dois relatórios HTML no [GitHub Pages](https://arckangelo.github.io/automationexercise-cypress-tests/) (só a partir da `main`) |

## 📝 Observações

- Os testes usam geração de emails aleatórios para evitar conflitos de dados duplicados
- O carrinho é limpo automaticamente antes de cada teste via requisição HTTP direta (`cy.request`), sem passar pela interface — mais rápido e estável que remover item por item na UI
- Os testes de carrinho aguardam a confirmação real do servidor (`cy.intercept`/`cy.wait`) em vez de usar esperas fixas (`cy.wait(ms)`)
- Seletores robustos (baseados em atributos `data-qa` e `href`) foram priorizados para reduzir flakiness
- Só exceções de scripts de anúncio de terceiros são ignoradas (`cypress/support/e2e.js`); qualquer outro erro JavaScript do site falha o teste
- O site é público e às vezes responde *"heavy load (queue full)"*; por isso, no modo headless cada teste tem até 2 novas tentativas (`retries`) — exceto os de bugs conhecidos, em que a falha é o resultado esperado
- **Os testes provisionam os próprios dados:** os specs que precisam de login criam uma conta descartável via API num `before()` e a removem num `after()` (`cypress/support/usuarioDeTeste.js`). Nenhuma credencial fica no repositório e a suíte não depende de uma conta fixa

## 👤 Autor

**Angelo Roque** · [GitHub](https://github.com/Arckangelo) · [LinkedIn](https://www.linkedin.com/in/angelo-roque-223b6b259/)