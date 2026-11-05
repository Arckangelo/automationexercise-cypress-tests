// Login e sessão: por HTTP quando o login é só preparação (loginByRequest e
// login, com cy.session) e pela tela quando o próprio login faz parte do teste.

// Login por HTTP (mesmo formulário da tela, sem renderizar a página): para
// testes em que o login é só preparação. O login pela tela é coberto em login.cy.js.
Cypress.Commands.add('loginByRequest', (email, password) => {
    cy.request('/login').then(({ body }) => {
        const token = Cypress.$(body).find('form[action="/login"] [name="csrfmiddlewaretoken"]').val()
        expect(token, 'formulário de login carregado').to.be.a('string').and.not.be.empty

        cy.request({
            method: 'POST',
            url: '/login',
            form: true,
            headers: { referer: `${Cypress.config('baseUrl')}/login` },
            body: { csrfmiddlewaretoken: token, email, password },
            log: false,
        })
    })
    cy.request('/').its('body').should('include', 'Logged in as')
})

Cypress.Commands.add('login', (email, password) => {
    cy.session(
        [email, password],
        () => {
            // por HTTP: o login é preparação; loginByRequest já confere que funcionou
            cy.loginByRequest(email, password)
        },
        {
            // a cada teste, confere se a sessão salva ainda é válida
            validate() {
                cy.request('/').its('body').should('include', 'Logged in as')
            },
            cacheAcrossSpecs: true,
        },
    )
})

// Login pelo formulário, sem cy.session: para quando o próprio login pela tela
// faz parte do teste (ex.: a tentativa recusada depois de excluir a conta).
Cypress.Commands.add('loginViaUi', (email, password) => {
    cy.visit('/login')
    cy.get('[data-qa="login-email"]').type(email)
    cy.get('[data-qa="login-password"]').type(password, { log: false })
    cy.get('[data-qa="login-button"]').click()
})
