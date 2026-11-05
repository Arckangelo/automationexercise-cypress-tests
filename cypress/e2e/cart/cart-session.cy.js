import { useTestUser } from '../../support/testUser'

// O carrinho fica gravado na conta: passa do visitante para a conta no login,
// some da tela no logout e volta ao entrar de novo, inclusive em outro navegador.
describe('Carrinho entre sessões', () => {
    // conta descartável criada via API antes dos testes e removida no final
    const user = useTestUser()

    // login e logout por HTTP: o assunto aqui é o carrinho, não as telas de
    // login e logout (cobertas em login.cy.js)
    const logIn = () => cy.loginByRequest(user.email, user.password)

    const logOut = () => {
        cy.request('/logout')
        cy.request('/').its('body').should('not.include', 'Logged in as')
    }

    // cada teste começa deslogado e com o carrinho da conta vazio
    beforeEach(() => {
        cy.login(user.email, user.password)
        cy.clearCart()
        cy.clearCookies()
    })

    // CT-CART-SESSION-01
    it('itens adicionados sem login continuam no carrinho depois do login', () => {
        cy.addToCart('1')
        cy.cartItems().should('deep.equal', { 1: 1 })

        logIn()

        cy.cartItems().should('deep.equal', { 1: 1 })
    })

    // CT-CART-SESSION-02
    it('o logout esvazia o carrinho da tela e os itens voltam ao entrar de novo', () => {
        logIn()
        cy.addToCart('1')
        cy.addToCart('2')

        logOut()
        cy.cartItems().should('deep.equal', {})

        logIn()
        cy.cartItems().should('deep.equal', { 1: 1, 2: 1 })
    })

    // CT-CART-SESSION-03
    // sem cookies = outro navegador: o carrinho está na conta, não na sessão
    it('o carrinho da conta aparece ao entrar em outro navegador', () => {
        logIn()
        cy.addToCart('3')

        cy.clearCookies()
        cy.cartItems().should('deep.equal', {})

        logIn()
        cy.cartItems().should('deep.equal', { 3: 1 })
    })

    // CT-CART-SESSION-04
    // pega: carrinho do visitante descartado, ou sobrescrevendo o da conta
    it('itens do visitante são somados ao carrinho que a conta já tinha', () => {
        logIn()
        cy.addToCart('2')
        logOut()

        cy.addToCart('2')
        cy.addToCart('4')

        logIn()
        cy.cartItems().should('deep.equal', { 2: 2, 4: 1 })
    })
})
