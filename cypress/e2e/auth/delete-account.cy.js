import { generateCredentials } from '../../support/testUser'

// O link "Delete Account" exclui a conta sem pedir confirmação (BUG-06); aqui
// o que se confere é o efeito: a conta deixa de existir de fato.
describe('Excluir conta', () => {

    let account

    beforeEach(function () {
        account = generateCredentials(this.users.randomAccount)

        cy.fixture('apiData').then(({ newAccount }) => {
            cy.apiCreateAccount({ ...newAccount, ...account }).its('body.responseCode').should('eq', 201)
        })
    })

    // se o teste falhar antes de excluir, remove a conta; 404 = já foi excluída
    afterEach(() => {
        cy.apiDeleteAccount(account.email, account.password).its('body.responseCode').should('be.oneOf', [200, 404])
    })

    // CT-AUTH-DELETE-ACCOUNT-01
    it('excluir a conta pela tela encerra a sessão e o login deixa de funcionar', () => {
        // login por HTTP (é preparação); a exclusão é feita pela tela
        cy.loginByRequest(account.email, account.password)
        cy.visit('/')
        cy.get('.shop-menu a[href="/delete_account"]').click()

        cy.get('[data-qa="account-deleted"]').should('be.visible')
        cy.get('[data-qa="continue-button"]').click()
        cy.get('.shop-menu a[href="/login"]').should('be.visible')
        cy.get('.shop-menu a[href="/logout"]').should('not.exist')

        // o mesmo login, pela tela e pela API, agora é recusado
        cy.loginViaUi(account.email, account.password)
        cy.get('form[action="/login"]').contains('p', 'Your email or password is incorrect!').should('be.visible')
        cy.apiVerifyLogin(account.email, account.password).its('body.responseCode').should('eq', 404)
        cy.apiGetUserDetail(account.email).its('body.responseCode').should('eq', 404)
    })
})
