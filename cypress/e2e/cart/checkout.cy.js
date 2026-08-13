describe('Carrinho e Checkout', () => {

    beforeEach(() => {
        cy.fixture('users').as('users')
    })

    // função auxiliar pra esvaziar o carrinho antes de cada teste
    const limparCarrinho = () => {
        cy.visit('/view_cart')
        cy.get('body').then($body => {
            // só tenta remover se houver itens no carrinho
            if ($body.find('.cart_quantity_delete').length > 0) {
                cy.get('.cart_quantity_delete').each(() => {
                    cy.get('.cart_quantity_delete').first().click()
                })
            }
        })
    }

    it('deve adicionar produtos ao carrinho e visualizar no carrinho', function () {
        cy.login(this.users.validUser.email, this.users.validUser.password)
        limparCarrinho()

        cy.visit('/products')

        cy.get('.product-image-wrapper').eq(0).within(() => {
            cy.get('.add-to-cart').first().click()
        })
        cy.contains('Continue Shopping').click()

        cy.get('.product-image-wrapper').eq(1).within(() => {
            cy.get('.add-to-cart').first().click()
        })
        cy.contains('View Cart').click()

        cy.url().should('include', '/view_cart')
        cy.get('#cart_info_table tbody tr').should('have.length', 2)
    })

    it('deve remover um produto do carrinho', function () {
        cy.login(this.users.validUser.email, this.users.validUser.password)
        limparCarrinho()

        cy.visit('/products')

        cy.get('.product-image-wrapper').eq(0).within(() => {
            cy.get('.add-to-cart').first().click()
        })
        cy.contains('View Cart').click()

        cy.get('#cart_info_table tbody tr').should('have.length', 1)

        cy.get('.cart_quantity_delete').first().click()

        cy.get('#empty_cart').should('be.visible')
        cy.contains('Cart is empty!').should('be.visible')
    })

    it('deve avançar para o checkout quando logado', function () {
        cy.login(this.users.validUser.email, this.users.validUser.password)
        limparCarrinho()

        cy.visit('/products')

        cy.get('.product-image-wrapper').eq(0).within(() => {
            cy.get('.add-to-cart').first().click()
        })
        cy.contains('View Cart').click()

        cy.get('.check_out').click()

        cy.url().should('include', '/checkout')
    })
})