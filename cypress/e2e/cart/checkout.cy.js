describe('Carrinho e Checkout', () => {

    beforeEach(() => {
        cy.fixture('users').as('users')
    })

    // função auxiliar pra esvaziar o carrinho antes de cada teste
    // usa recursão: remove um item, espera o DOM atualizar, checa de novo, repete até esvaziar
    const limparCarrinho = () => {
        cy.visit('/view_cart')

        const removerProximo = () => {
            cy.get('body').then($body => {
                if ($body.find('.cart_quantity_delete').length > 0) {
                    cy.get('.cart_quantity_delete').first().click()
                    cy.wait(300) // pequena espera pro DOM atualizar antes de checar de novo
                    removerProximo()
                }
            })
        }

        removerProximo()
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