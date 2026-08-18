# Automation Exercise - Testes E2E com Cypress

[![Cypress Tests](https://github.com/Arckangelo/automationexercise-cypress-tests/actions/workflows/cypress.yml/badge.svg)](https://github.com/Arckangelo/automationexercise-cypress-tests/actions/workflows/cypress.yml)

📋 [Laudo da última execução da suíte (UI + API)](https://claude.ai/code/artifact/d87fec01-ae32-451b-8cee-2b580e8ee72a) — 25/25 testes aprovados

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
    ├── commands.js               # comandos customizados do Cypress
    └── e2e.js                    # configurações globais carregadas antes dos testes
```

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