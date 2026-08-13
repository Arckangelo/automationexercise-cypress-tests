describe('Busca de produtos', () => {

    beforeEach(() => {
        cy.visit('/products')
    })

    it('deve buscar um produto existente e mostrar resultados', () => {
        const termoBusca = 'jeans'

        // preenche o campo de busca e clica na lupa
        cy.get('#search_product').type(termoBusca)
        cy.get('#submit_search').click()

        // valida que o título "Searched Products" apareceu
        cy.get('h2.title').contains('Searched Products').should('be.visible')

        // valida que pelo menos um produto foi encontrado
        cy.get('.productinfo').should('have.length.greaterThan', 0)

        // valida que o nome de algum produto retornado contém o termo buscado
        // (case insensitive, já que o site pode retornar "Jeans" com maiúscula)
        cy.get('.productinfo p').first().invoke('text').should('match', new RegExp(termoBusca, 'i'))
    })

    it('deve buscar um produto inexistente e não mostrar resultados', () => {
        const termoBusca = 'xyzproutoquenaoexiste123'

        cy.get('#search_product').type(termoBusca)
        cy.get('#submit_search').click()

        // valida que o título ainda aparece (o site sempre mostra o título)
        cy.get('h2.title').contains('Searched Products').should('be.visible')

        // valida que NENHUM produto foi retornado
        cy.get('.productinfo').should('have.length', 0)
    })
})