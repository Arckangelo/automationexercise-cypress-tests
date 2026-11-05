describe('API - Busca de produtos', () => {

    beforeEach(() => {
        cy.fixture('apiData').as('apiData')
    })

    // CT-API-SEARCH-01
    // A API procura o termo no nome e na categoria do produto (ex.: "Tops & Shirts").
    // Conferir cada item pega uma busca que ignora o termo e devolve o catálogo inteiro.
    it('termo válido retorna só produtos que contêm o termo no nome ou na categoria', function () {
        const term = this.apiData.search.validTerm

        cy.apiGetProductsList().its('body.products.length').then((catalogTotal) => {
            cy.apiSearchProduct(term).then(({ body }) => {
                expect(body.responseCode).to.eq(200)
                expect(body.products, 'resultados').to.not.be.empty
                expect(body.products.length, 'menos itens que o catálogo').to.be.lessThan(catalogTotal)

                body.products.forEach(({ id, name, category }) => {
                    const searchIn = `${name} ${category.category}`.toLowerCase()
                    expect(searchIn, `produto ${id}`).to.include(term.toLowerCase())
                })
            })
        })
    })

    // CT-API-SEARCH-02
    it('termo sem correspondência retorna lista vazia', () => {
        cy.apiSearchProduct('xyzprodutoquenaoexiste123')
            .its('body').should('deep.equal', { responseCode: 200, products: [] })
    })

    // CT-API-SEARCH-03
    it('sem o parâmetro search_product retorna 400', () => {
        cy.apiSearchProduct(undefined)
            .its('body').should('deep.equal', {
                responseCode: 400,
                message: 'Bad request, search_product parameter is missing in POST request.',
            })
    })
})
