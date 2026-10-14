import { usarUsuarioDeTeste } from '../../support/usuarioDeTeste'

describe('API - Verificação de login', () => {

    // conta descartável criada via API antes dos testes e removida no final
    const usuario = usarUsuarioDeTeste()

    beforeEach(() => {
        cy.fixture('users').as('users')
    })

    it('deve confirmar que o usuário existe com credenciais válidas', () => {
        cy.apiVerifyLogin(usuario.email, usuario.password).then((response) => {
            expect(response.body.responseCode).to.eq(200)
            expect(response.body.message).to.eq('User exists!')
        })
    })

    it('deve retornar 404 para senha incorreta', function () {
        cy.apiVerifyLogin(usuario.email, this.users.senhaIncorreta).then((response) => {
            expect(response.body.responseCode).to.eq(404)
            expect(response.body.message).to.eq('User not found!')
        })
    })

    it('deve retornar 404 para usuário não cadastrado', function () {
        cy.apiVerifyLogin(this.users.notRegisteredUser.email, this.users.notRegisteredUser.password).then((response) => {
            expect(response.body.responseCode).to.eq(404)
            expect(response.body.message).to.eq('User not found!')
        })
    })

    it('deve retornar 400 quando o email não é informado', () => {
        cy.apiVerifyLogin(undefined, usuario.password).then((response) => {
            expect(response.body.responseCode).to.eq(400)
            expect(response.body.message).to.eq('Bad request, email or password parameter is missing in POST request.')
        })
    })

    // O endpoint só aceita POST; DELETE deve ser rejeitado.
    it('deve rejeitar DELETE na verificação de login (só aceita POST)', () => {
        cy.apiRequest({ method: 'DELETE', url: '/api/verifyLogin' }).then((response) => {
            expect(response.body.responseCode).to.eq(405)
            expect(response.body.message).to.eq('This request method is not supported.')
        })
    })
})
