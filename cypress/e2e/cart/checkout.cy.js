describe('Carrinho e Checkout', () => {
 
    beforeEach(() => {
        // intercepts registrados antes de qualquer ação, para os aliases existirem quando o teste esperar por eles
        cy.intercept('GET', '/add_to_cart/*').as('adicionarAoCarrinho')
        cy.intercept('GET', '/delete_cart/*').as('removerDoCarrinho')
 
        cy.fixture('users').then(users => {
            cy.login(users.validUser.email, users.validUser.password)
        })
 
        // setup via HTTP, sem passar pela interface (ver cypress/support/commands.js)
        cy.limparCarrinho()
    })
 
    // adiciona o produto da posição informada e espera o servidor confirmar
    const adicionarProduto = (indice) => {
        cy.get('.product-image-wrapper').eq(indice).within(() => {
            cy.get('.add-to-cart').first().click()
        })
        cy.wait('@adicionarAoCarrinho').its('response.statusCode').should('eq', 200)
    }
 
    it('deve adicionar produtos ao carrinho e visualizar no carrinho', () => {
        cy.visit('/products')
 
        adicionarProduto(0)
        cy.contains('Continue Shopping').click()
 
        adicionarProduto(1)
        cy.contains('View Cart').click()
 
        cy.url().should('include', '/view_cart')
        cy.get('#cart_info_table tbody tr').should('have.length', 2)
    })
 
    it('deve remover um produto do carrinho', () => {
        cy.visit('/products')
 
        adicionarProduto(0)
        cy.contains('View Cart').click()
 
        cy.get('#cart_info_table tbody tr').should('have.length', 1)
 
        cy.get('.cart_quantity_delete').first().click()
        cy.wait('@removerDoCarrinho').its('response.statusCode').should('eq', 200)
 
        // asserções com retry: esperam o DOM refletir a remoção
        cy.get('#empty_cart').should('be.visible')
        cy.contains('Cart is empty!').should('be.visible')
    })
 
    it('deve avançar para o checkout quando logado', () => {
        cy.visit('/products')
 
        adicionarProduto(0)
        cy.contains('View Cart').click()
 
        cy.get('.check_out').click()
 
        cy.url().should('include', '/checkout')
 
        // valida que a página de checkout carregou de fato, não só que a URL mudou
        cy.contains('Address Details').should('be.visible')
        cy.contains('Review Your Order').should('be.visible')
    })
})