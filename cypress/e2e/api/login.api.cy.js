import { gerarCredenciais, usarUsuarioDeTeste } from '../../support/usuarioDeTeste'

describe('API - Verificação de login', () => {

    // conta descartável criada via API antes dos testes e removida no final
    const usuario = usarUsuarioDeTeste()

    const PARAMETRO_FALTANDO = 'Bad request, email or password parameter is missing in POST request.'

    // CT-API-LOGIN-01
    it('credenciais válidas retornam 200 "User exists!"', () => {
        cy.apiVerifyLogin(usuario.email, usuario.password)
            .its('body').should('deep.equal', { responseCode: 200, message: 'User exists!' })
    })

    // CT-API-LOGIN-02
    it('senha incorreta retorna 404', function () {
        cy.apiVerifyLogin(usuario.email, this.users.senhaIncorreta)
            .its('body').should('deep.equal', { responseCode: 404, message: 'User not found!' })
    })

    // CT-API-LOGIN-03
    // mesma resposta da senha incorreta: a API não revela se o e-mail existe
    it('usuário não cadastrado retorna a mesma resposta 404', function () {
        const naoCadastrado = gerarCredenciais(this.users.contaAleatoria)

        cy.apiVerifyLogin(naoCadastrado.email, naoCadastrado.password)
            .its('body').should('deep.equal', { responseCode: 404, message: 'User not found!' })
    })

    // CT-API-LOGIN-04
    it('sem o e-mail retorna 400', () => {
        cy.apiVerifyLogin(undefined, usuario.password)
            .its('body').should('deep.equal', { responseCode: 400, message: PARAMETRO_FALTANDO })
    })

    // CT-API-LOGIN-05
    it('sem a senha retorna 400', () => {
        cy.apiVerifyLogin(usuario.email, undefined)
            .its('body').should('deep.equal', { responseCode: 400, message: PARAMETRO_FALTANDO })
    })

    // CT-API-LOGIN-06
    // GET, PUT e DELETE trazem o 405 só no corpo (BUG-04); o PATCH recebe um 405
    // de verdade, mas em outro formato, sem responseCode (também BUG-04).
    // Aqui só importa que todos sejam recusados.
    it('GET, PUT, DELETE e PATCH são rejeitados com 405 (só aceita POST)', () => {
        ;['GET', 'PUT', 'DELETE', 'PATCH'].forEach((method) => {
            cy.request({ method, url: '/api/verifyLogin', failOnStatusCode: false }).then(({ status, body }) => {
                const corpo = typeof body === 'string' ? JSON.parse(body) : body
                expect(status === 405 || corpo.responseCode === 405, `${method} recusado com 405`).to.be.true
            })
        })
    })
})
