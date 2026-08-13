# Automation Exercise - Testes E2E com Cypress

[![Cypress Tests](https://github.com/Arckangelo/automationexercise-cypress-tests/actions/workflows/cypress.yml/badge.svg)](https://github.com/Arckangelo/automationexercise-cypress-tests/actions/workflows/cypress.yml)

Suíte de testes automatizados end-to-end para o site [AutomationExercise](https://automationexercise.com), um e-commerce fictício criado para prática de automação de testes.

## 🎯 Objetivo

Projeto desenvolvido para praticar e demonstrar habilidades em automação de testes, cobrindo fluxos essenciais de um e-commerce: autenticação, cadastro, navegação, busca, filtros e o fluxo completo de compra (carrinho e checkout).

## 🛠️ Tecnologias

- [Cypress](https://www.cypress.io/) - Framework de testes E2E
- JavaScript
- Mocha/Chai (assertions, nativos do Cypress)

## ✅ O que é testado

| Arquivo | Cobertura |
|---|---|
| `login.cy.js` | Login com credenciais válidas, senha incorreta e email não cadastrado |
| `signup.cy.js` | Cadastro completo de novo usuário com todos os campos do formulário |
| `search.cy.js` | Busca de produtos com e sem resultados |
| `filter.cy.js` | Filtro de produtos por categoria e por marca |
| `checkout.cy.js` | Adicionar/remover produtos do carrinho e fluxo de checkout autenticado |

**Total: 11 testes automatizados**

## 📁 Estrutura do projeto
cypress/
├── e2e/
│ ├── auth/
│ │ ├── login.cy.js
│ │ └── signup.cy.js
│ ├── cart/
│ │ └── checkout.cy.js
│ └── products/
│ ├── filter.cy.js
│ └── search.cy.js
├── fixtures/
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