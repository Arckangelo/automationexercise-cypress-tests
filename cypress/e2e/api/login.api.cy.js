import { generateCredentials, useTestUser } from '../../support/testUser'

describe('API - Verificação de login', () => {
    // conta descartável criada via API antes dos testes e removida no final
    const user = useTestUser()

    const MISSING_PARAMETER = 'Bad request, email or password parameter is missing in POST request.'

    // CT-API-LOGIN-01
    it('credenciais válidas retornam 200 "User exists!"', () => {
        cy.apiVerifyLogin(user.email, user.password)
            .its('body')
            .should('deep.equal', { responseCode: 200, message: 'User exists!' })
    })

    // CT-API-LOGIN-02
    it('senha incorreta retorna 404', function () {
        cy.apiVerifyLogin(user.email, this.users.wrongPassword)
            .its('body')
            .should('deep.equal', { responseCode: 404, message: 'User not found!' })
    })

    // CT-API-LOGIN-03
    // mesma resposta da senha incorreta: a API não revela se o e-mail existe
    it('usuário não cadastrado retorna a mesma resposta 404', function () {
        const unregistered = generateCredentials(this.users.randomAccount)

        cy.apiVerifyLogin(unregistered.email, unregistered.password)
            .its('body')
            .should('deep.equal', { responseCode: 404, message: 'User not found!' })
    })

    // CT-API-LOGIN-04
    it('sem o e-mail retorna 400', () => {
        cy.apiVerifyLogin(undefined, user.password)
            .its('body')
            .should('deep.equal', { responseCode: 400, message: MISSING_PARAMETER })
    })

    // CT-API-LOGIN-05
    it('sem a senha retorna 400', () => {
        cy.apiVerifyLogin(user.email, undefined)
            .its('body')
            .should('deep.equal', { responseCode: 400, message: MISSING_PARAMETER })
    })

    // CT-API-LOGIN-06
    // GET, PUT e DELETE trazem o 405 só no corpo (BUG-04); o PATCH recebe um 405
    // de verdade, mas em outro formato, sem responseCode (também BUG-04).
    // Aqui só importa que todos sejam recusados.
    it('GET, PUT, DELETE e PATCH são rejeitados com 405 (só aceita POST)', () => {
        ;['GET', 'PUT', 'DELETE', 'PATCH'].forEach((method) => {
            cy.request({ method, url: '/api/verifyLogin', failOnStatusCode: false }).then(({ status, body }) => {
                const parsedBody = typeof body === 'string' ? JSON.parse(body) : body
                expect(status === 405 || parsedBody.responseCode === 405, `${method} recusado com 405`).to.be.true
            })
        })
    })
})
