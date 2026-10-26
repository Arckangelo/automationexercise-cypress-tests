import { usarUsuarioDeTeste } from '../../support/usuarioDeTeste'

describe('API - Verificação de login', () => {

    // conta descartável criada via API antes dos testes e removida no final
    const usuario = usarUsuarioDeTeste()

    const PARAMETRO_FALTANDO = 'Bad request, email or password parameter is missing in POST request.'

    beforeEach(() => {
        cy.fixture('users').as('users')
    })

    it('credenciais válidas retornam 200 "User exists!"', () => {
        cy.apiVerifyLogin(usuario.email, usuario.password)
            .its('body').should('deep.equal', { responseCode: 200, message: 'User exists!' })
    })

    it('senha incorreta retorna 404', function () {
        cy.apiVerifyLogin(usuario.email, this.users.senhaIncorreta)
            .its('body').should('deep.equal', { responseCode: 404, message: 'User not found!' })
    })

    // mesma resposta da senha incorreta: a API não revela se o e-mail existe
    it('usuário não cadastrado retorna a mesma resposta 404', function () {
        cy.apiVerifyLogin(this.users.notRegisteredUser.email, this.users.notRegisteredUser.password)
            .its('body').should('deep.equal', { responseCode: 404, message: 'User not found!' })
    })

    it('sem o e-mail retorna 400', () => {
        cy.apiVerifyLogin(undefined, usuario.password)
            .its('body').should('deep.equal', { responseCode: 400, message: PARAMETRO_FALTANDO })
    })

    it('sem a senha retorna 400', () => {
        cy.apiVerifyLogin(usuario.email, undefined)
            .its('body').should('deep.equal', { responseCode: 400, message: PARAMETRO_FALTANDO })
    })

    it('método DELETE é rejeitado com 405 (só aceita POST)', () => {
        cy.apiRequest({ method: 'DELETE', url: '/api/verifyLogin' })
            .its('body').should('deep.equal', { responseCode: 405, message: 'This request method is not supported.' })
    })
})
