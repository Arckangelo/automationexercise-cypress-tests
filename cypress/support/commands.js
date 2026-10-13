Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login')
  cy.get('[data-qa="login-email"]').type(email)
  cy.get('[data-qa="login-password"]').type(password)
  cy.get('[data-qa="login-button"]').click()
})

Cypress.Commands.add('limparCarrinho', () => {
  cy.request('/view_cart').then(({ body }) => {
    const doc = new DOMParser().parseFromString(body, 'text/html')
    const ids = [...doc.querySelectorAll('.cart_quantity_delete')]
      .map(el => el.dataset.productId)

    ids.forEach(id => {
      cy.request(`/delete_cart/${id}`).its('status').should('eq', 200)
    })
  })
})

// --- Comandos de API ---
// A API do automationexercise.com sempre responde com HTTP 200, mesmo em
// cenários de erro (método não suportado, parâmetro faltando, etc.) — quem
// diz o que realmente aconteceu é o campo "responseCode" no corpo da
// resposta. Por isso os comandos usam failOnStatusCode: false e os testes
// checam response.body.responseCode, nunca response.status.
//
// Outra pegadinha da API: ela manda o corpo como JSON, mas declara o
// header Content-Type como "text/html". O Cypress só faz o parse
// automático do corpo quando o Content-Type é "application/json", então
// sem esse ajuste response.body chegaria como STRING crua nos testes.
// cy.apiRequest() centraliza esse parse pra todos os outros comandos.

Cypress.Commands.add('apiRequest', (options) => {
  return cy.request({ failOnStatusCode: false, ...options }).then((response) => {
    const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body
    return { ...response, body }
  })
})

Cypress.Commands.add('apiGetProductsList', () => {
  return cy.apiRequest({ method: 'GET', url: '/api/productsList' })
})

Cypress.Commands.add('apiGetBrandsList', () => {
  return cy.apiRequest({ method: 'GET', url: '/api/brandsList' })
})

Cypress.Commands.add('apiSearchProduct', (searchTerm) => {
  return cy.apiRequest({
    method: 'POST',
    url: '/api/searchProduct',
    form: true,
    // omite o campo por completo (em vez de mandar string vazia) pra
    // simular de verdade o cenário de "parâmetro ausente"
    body: searchTerm === undefined ? {} : { search_product: searchTerm },
  })
})

Cypress.Commands.add('apiVerifyLogin', (email, password) => {
  const body = {}
  if (email !== undefined) body.email = email
  if (password !== undefined) body.password = password

  return cy.apiRequest({ method: 'POST', url: '/api/verifyLogin', form: true, body })
})

Cypress.Commands.add('apiCreateAccount', (dados) => {
  return cy.apiRequest({ method: 'POST', url: '/api/createAccount', form: true, body: dados })
})

Cypress.Commands.add('apiDeleteAccount', (email, password) => {
  return cy.apiRequest({ method: 'DELETE', url: '/api/deleteAccount', form: true, body: { email, password } })
})