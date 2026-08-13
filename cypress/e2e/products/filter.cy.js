describe('Filtro de produtos', () => {

    beforeEach(() => {
        cy.visit('/products')
    })

    it('deve filtrar produtos por categoria (Men > Jeans)', () => {
        // expande o painel "Men" antes de clicar na subcategoria
        cy.contains('Men').click()

        // clica na subcategoria Jeans
        cy.get('a[href="/category_products/6"]').click()

        // valida que a URL mudou para a categoria certa
        cy.url().should('include', '/category_products/6')

        // valida que o título da página mostra a categoria filtrada
        cy.get('h2.title').should('be.visible')

        // valida que apareceu pelo menos um produto
        cy.get('.productinfo').should('have.length.greaterThan', 0)
    })

    it('deve filtrar produtos por marca (Polo)', () => {
        cy.get('a[href="/brand_products/Polo"]').click()

        // valida que a URL mudou para a marca certa
        cy.url().should('include', '/brand_products/Polo')

        // valida que apareceu pelo menos um produto
        cy.get('.productinfo').should('have.length.greaterThan', 0)
    })
    
    it('deve filtrar produtos por categoria (Women > Dress)', () => {
        // expande o painel "Women" antes de clicar na subcategoria
        cy.contains('Women').click()

        // clica na subcategoria Dress
        cy.get('a[href="/category_products/1"]').click()

        // valida que a URL mudou para a categoria certa
        cy.url().should('include', '/category_products/1')

        // valida que apareceu pelo menos um produto
        cy.get('.productinfo').should('have.length.greaterThan', 0)
    })
})