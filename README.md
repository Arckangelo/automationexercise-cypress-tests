# Automation Exercise - Testes E2E com Cypress

[![Cypress Tests](https://github.com/Arckangelo/automationexercise-cypress-tests/actions/workflows/cypress.yml/badge.svg)](https://github.com/Arckangelo/automationexercise-cypress-tests/actions/workflows/cypress.yml)

Suíte de testes automatizados end-to-end para o site [AutomationExercise](https://automationexercise.com), um e-commerce fictício criado para prática de automação de testes.

## 🎯 Objetivo

Projeto desenvolvido para praticar e demonstrar habilidades em automação de testes, cobrindo fluxos essenciais de um e-commerce: autenticação, cadastro, navegação, busca, filtros e o fluxo completo de compra (carrinho e checkout).

## 🛠️ Tecnologias

- [Cypress](https://www.cypress.io/) - Framework de testes E2E
- JavaScript
- Mocha/Chai (assertions, nativos do Cypress)
- Testes de API com `cy.request` (nativo do Cypress, sem lib extra)

## ✅ O que é testado

### UI

| Arquivo | Cobertura |
|---|---|
| `login.cy.js` | Login com credenciais válidas, senha incorreta e email não cadastrado |
| `signup.cy.js` | Cadastro completo de novo usuário com todos os campos do formulário |
| `search.cy.js` | Busca de produtos com e sem resultados |
| `filter.cy.js` | Filtro de produtos por categoria e por marca |
| `checkout.cy.js` | Adicionar/remover produtos do carrinho e fluxo de checkout autenticado |

**Total: 11 testes automatizados**

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

## 📁 Estrutura do projeto
cypress/
├── e2e/
│ ├── api/
│ │ ├── account.api.cy.js
│ │ ├── login.api.cy.js
│ │ ├── products.api.cy.js
│ │ └── search.api.cy.js
│ ├── auth/
│ │ ├── login.cy.js
│ │ └── signup.cy.js
│ ├── cart/
│ │ └── checkout.cy.js
│ └── products/
│ ├── filter.cy.js
│ └── search.cy.js
├── fixtures/
│ ├── apiData.json
│ └── users.json
└── support/
├── commands.js
└── e2e.js

## 🚀 Como rodar o projeto

**Pré-requisitos:** Node.js instalado

1. Clone o repositório
```bash
git clone <url-do-seu-repositorio>
cd automationexercise-tests
```

2. Instale as dependências
```bash
npm install
```

3. Abra o Cypress
```bash
npx cypress open
```

4. Escolha **E2E Testing** → selecione um navegador → clique em qualquer arquivo `.cy.js` para rodar

## 📝 Observações

- Os testes usam geração de emails aleatórios para evitar conflitos de dados duplicados
- O carrinho é limpo automaticamente antes de cada teste para garantir independência entre execuções
- Seletores robustos (baseados em atributos `data-qa` e `href`) foram priorizados para reduzir flakiness

## 👤 Autor

Angelo Roque https://github.com/Arckangelo 