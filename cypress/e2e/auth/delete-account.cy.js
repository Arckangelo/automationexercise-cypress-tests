import { gerarCredenciais } from '../../support/usuarioDeTeste'

// O link "Delete Account" exclui a conta sem pedir confirmação (BUG-06); aqui
// o que se confere é o efeito: a conta deixa de existir de fato.
describe('Excluir conta', () => {

    let conta

    beforeEach(function () {
        conta = gerarCredenciais(this.users.contaAleatoria)

        cy.fixture('apiData').then(({ novaConta }) => {
            cy.apiCreateAccount({ ...novaConta, ...conta }).its('body.responseCode').should('eq', 201)
        })
    })

    // se o teste falhar antes de excluir, remove a conta; 404 = já foi excluída
    afterEach(() => {
        cy.apiDeleteAccount(conta.email, conta.password).its('body.responseCode').should('be.oneOf', [200, 404])
    })

    // CT-AUTH-DELETE-ACCOUNT-01
    it('excluir a conta pela tela encerra a sessão e o login deixa de funcionar', () => {
        // login por HTTP (é preparação); a exclusão é feita pela tela
        cy.entrarPorRequisicao(conta.email, conta.password)
        cy.visit('/')
        cy.get('.shop-menu a[href="/delete_account"]').click()

        cy.get('[data-qa="account-deleted"]').should('be.visible')
        cy.get('[data-qa="continue-button"]').click()
        cy.get('.shop-menu a[href="/login"]').should('be.visible')
        cy.get('.shop-menu a[href="/logout"]').should('not.exist')

        // o mesmo login, pela tela e pela API, agora é recusado
        cy.entrarPelaTela(conta.email, conta.password)
        cy.get('form[action="/login"]').contains('p', 'Your email or password is incorrect!').should('be.visible')
        cy.apiVerifyLogin(conta.email, conta.password).its('body.responseCode').should('eq', 404)
        cy.apiGetUserDetail(conta.email).its('body.responseCode').should('eq', 404)
    })
})
