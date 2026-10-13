# Automation Exercise - Testes E2E com Cypress

[![Cypress Tests](https://github.com/Arckangelo/automationexercise-cypress-tests/actions/workflows/cypress.yml/badge.svg)](https://github.com/Arckangelo/automationexercise-cypress-tests/actions/workflows/cypress.yml)

📋 [Laudo da última execução da suíte (UI + API)](https://claude.ai/code/artifact/d87fec01-ae32-451b-8cee-2b580e8ee72a) — 25/25 testes aprovados

Suíte de testes automatizados end-to-end para o site [AutomationExercise](https://automationexercise.com), um e-commerce fictício criado para prática de automação de testes.

> Veja também meu [projeto em Python + Playwright](https://github.com/Arckangelo/saucedemo-playwright-python), com testes E2E do SauceDemo.

## 🎯 Objetivo

Projeto desenvolvido para praticar e demonstrar habilidades em automação de testes, cobrindo fluxos essenciais de um e-commerce: autenticação, cadastro, navegação, busca, filtros e o fluxo completo de compra (carrinho e checkout).

## 🛠️ Tecnologias

- [Cypress](https://www.cypress.io/) - Framework de testes E2E
- JavaScript
- Mocha/Chai (assertions, nativos do Cypress)
- Testes de API com `cy.request` (nativo do Cypress, sem lib extra)
- GitHub Actions para integração contínua

## ✅ O que é testado

### UI

| Arquivo | Cobertura |
|---|---|
| `login.cy.js` | Login com credenciais válidas, senha incorreta e email não cadastrado |
| `signup.cy.js` | Cadastro completo de novo usuário com todos os campos do formulário |
| `search.cy.js` | Busca de produtos com e sem resultados |
| `filter.cy.js` | Filtro de produtos por categoria (Men > Jeans, Women > Dress) e por marca (Polo) |
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

**Total: 12 testes automatizados**

**Suíte completa: 24 testes (12 de UI + 12 de API)**

## 📁 Estrutura do projeto
```
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
│   └── products/
│       ├── filter.cy.js         # cenários de teste de filtro de produtos
│       └── search.cy.js         # cenários de teste de busca de produtos
├── fixtures/
│   ├── apiData.json             # massa de dados dos testes de API
│   └── users.json               # massa de dados de usuários para os testes
└── support/
    ├── commands.js              # comandos customizados do Cypress
    └── e2e.js                   # configurações globais carregadas antes dos testes
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
```

Na interface, escolha **E2E Testing** → selecione um navegador → clique em qualquer arquivo `.cy.js` para rodar.

## 📝 Observações

- Os testes usam geração de emails aleatórios para evitar conflitos de dados duplicados
- O carrinho é limpo automaticamente antes de cada teste via requisição HTTP direta (`cy.request`), sem passar pela interface — mais rápido e estável que remover item por item na UI
- Os testes de carrinho aguardam a confirmação real do servidor (`cy.intercept`/`cy.wait`) em vez de usar esperas fixas (`cy.wait(ms)`)
- Seletores robustos (baseados em atributos `data-qa` e `href`) foram priorizados para reduzir flakiness

## 👤 Autor

**Angelo Roque** · [GitHub](https://github.com/Arckangelo) · [LinkedIn](https://www.linkedin.com/in/angelo-roque-223b6b259/)