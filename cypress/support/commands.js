Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login')
  cy.get('[data-qa="login-email"]').type(email)
  cy.get('[data-qa="login-password"]').type(password)
  cy.get('[data-qa="login-button"]').click()
})

// --- Comandos de API ---
// A API do automationexercise.com sempre responde com HTTP 200, mesmo em
// cenários de erro (método não suportado, parâmetro faltando, etc.) — quem
// diz o que realmente aconteceu é o campo "responseCode" no corpo da
// resposta. Por isso os comandos usam failOnStatusCode: false e os testes
// checam response.body.responseCode, nunca response.status.

Cypress.Commands.add('apiGetProductsList', () => {
  return cy.request({
    method: 'GET',
    url: '/api/productsList',
    failOnStatusCode: false,
  })
})

Cypress.Commands.add('apiGetBrandsList', () => {
  return cy.request({
    method: 'GET',
    url: '/api/brandsList',
    failOnStatusCode: false,
  })
})

Cypress.Commands.add('apiSearchProduct', (searchTerm) => {
  return cy.request({
    method: 'POST',
    url: '/api/searchProduct',
    form: true,
    // omite o campo por completo (em vez de mandar string vazia) pra
    // simular de verdade o cenário de "parâmetro ausente"
    body: searchTerm === undefined ? {} : { search_product: searchTerm },
    failOnStatusCode: false,
  })
})

Cypress.Commands.add('apiVerifyLogin', (email, password) => {
  const body = {}
  if (email !== undefined) body.email = email
  if (password !== undefined) body.password = password

  return cy.request({
    method: 'POST',
    url: '/api/verifyLogin',
    form: true,
    body,
    failOnStatusCode: false,
  })
})

Cypress.Commands.add('apiCreateAccount', (dados) => {
  return cy.request({
    method: 'POST',
    url: '/api/createAccount',
    form: true,
    body: dados,
    failOnStatusCode: false,
  })
})

Cypress.Commands.add('apiDeleteAccount', (email, password) => {
  return cy.request({
    method: 'DELETE',
    url: '/api/deleteAccount',
    form: true,
    body: { email, password },
    failOnStatusCode: false,
  })
})