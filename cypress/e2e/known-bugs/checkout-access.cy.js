import { usarUsuarioDeTeste } from '../../support/usuarioDeTeste'

// BUG-12 e BUG-13 (ver BUGS.md)
// O site só impede o checkout pelo modal do botão "Proceed To Checkout".
// Acessando a URL direto, as páginas abrem normalmente.
describe('[BUG-12/13] Checkout - acesso direto pela URL', () => {

    // Sem login, /checkout abre com endereço vazio e "Place Order", e /payment
    // mostra o formulário completo de cartão.
    it('[BUG-12] sem login, /payment não deve mostrar o formulário de pagamento', () => {
        cy.visit('/payment')
        cy.get('[data-qa="pay-button"]').should('not.exist')
    })

    it('[BUG-12] sem login, /checkout não deve oferecer "Place Order"', () => {
        cy.visit('/checkout')
        cy.get('a[href="/payment"]').should('not.exist')
    })

})

// Com o carrinho vazio a tela do carrinho esconde o botão de checkout,
// mas /checkout aberto direto mostra Total "Rs. 0" e "Place Order".
describe('[BUG-13] Checkout - pedido com carrinho vazio', () => {

    const usuario = usarUsuarioDeTeste()

    it('[BUG-13] logado e com carrinho vazio, /checkout não deve oferecer "Place Order"', () => {
        cy.login(usuario.email, usuario.password)
        cy.limparCarrinho()

        cy.visit('/checkout')
        cy.get('a[href="/payment"]').should('not.exist')
    })
})
