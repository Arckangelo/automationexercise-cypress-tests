import { useTestUser } from '../../support/testUser'

// BUG-12 e BUG-13 (ver BUGS.md)
// O site só impede o checkout pelo modal do botão "Proceed To Checkout".
// Acessando a URL direto, as páginas abrem normalmente.
describe('[BUG-12/13] Checkout - acesso direto pela URL', () => {
    // CT-BUGS-CHECKOUT-ACCESS-01
    // Sem login, /checkout abre com endereço vazio e "Place Order", e /payment
    // mostra o formulário completo de cartão.
    it('[BUG-12] sem login, /payment não deve mostrar o formulário de pagamento', () => {
        cy.visit('/payment')
        cy.get('[data-qa="pay-button"]').should('not.exist')
    })

    // CT-BUGS-CHECKOUT-ACCESS-02
    it('[BUG-12] sem login, /checkout não deve oferecer "Place Order"', () => {
        cy.visit('/checkout')
        cy.get('a[href="/payment"]').should('not.exist')
    })
})

// Com o carrinho vazio a tela do carrinho esconde o botão de checkout,
// mas /checkout aberto direto mostra Total "Rs. 0" e "Place Order".
describe('[BUG-13] Checkout - pedido com carrinho vazio', () => {
    const user = useTestUser()

    // CT-BUGS-CHECKOUT-ACCESS-03
    it('[BUG-13] logado e com carrinho vazio, /checkout não deve oferecer "Place Order"', () => {
        cy.login(user.email, user.password)
        cy.clearCart()

        cy.visit('/checkout')
        cy.get('a[href="/payment"]').should('not.exist')
    })

    // CT-BUGS-CHECKOUT-ACCESS-04
    // Pagando por /payment com o carrinho vazio, o pedido é confirmado com valor 0.
    it(
        '[BUG-13] logado e com carrinho vazio, o pagamento não deve confirmar um pedido',
        { tags: ['@creates-order'] },
        function () {
            cy.login(user.email, user.password)
            cy.clearCart()
            cy.intercept('POST', '/payment').as('pay')

            cy.visit('/payment')
            cy.pay(this.users.cards.valid)

            cy.wait('@pay').then(({ response }) => {
                expect(response.headers.location || '', 'redireciona para a confirmação do pedido').to.not.include(
                    'payment_done',
                )
            })
        },
    )
})
