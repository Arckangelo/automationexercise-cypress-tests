// Scripts de anúncio de terceiros (Google Ads e afins) às vezes lançam
// exceções que não têm relação com o site sob teste. Só esses erros são
// ignorados: qualquer outra exceção não tratada continua falhando o teste,
// para que erros reais do site não passem despercebidos.
const AD_SCRIPTS =
    /googlesyndication|doubleclick|googletagmanager|googleadservices|adtrafficquality|fundingchoicesmessages/

Cypress.on('uncaught:exception', (err) => {
    if (AD_SCRIPTS.test(`${err.message}\n${err.stack}`)) {
        return false
    }
})

// E-mails e senhas usados nos testes ficam em fixtures/users.json, disponível em
// todo teste e hook como this.users (com function, não arrow) ou cy.get('@users').
beforeEach(() => {
    cy.fixture('users').as('users')
})

import 'cypress-mochawesome-reporter/register'
import './commands.js'
