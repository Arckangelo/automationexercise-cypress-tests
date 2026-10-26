describe('API - Busca de produtos', () => {

    beforeEach(() => {
        cy.fixture('apiData').as('apiData')
    })

    // A API procura o termo no nome e na categoria do produto (ex.: "Tops & Shirts").
    // Conferir cada item pega uma busca que ignora o termo e devolve o catálogo inteiro.
    it('termo válido retorna só produtos que contêm o termo no nome ou na categoria', function () {
        const termo = this.apiData.busca.termoValido

        cy.apiGetProductsList().its('body.products.length').then((totalDoCatalogo) => {
            cy.apiSearchProduct(termo).then(({ body }) => {
                expect(body.responseCode).to.eq(200)
                expect(body.products, 'resultados').to.not.be.empty
                expect(body.products.length, 'menos itens que o catálogo').to.be.lessThan(totalDoCatalogo)

                body.products.forEach(({ id, name, category }) => {
                    const ondeProcurar = `${name} ${category.category}`.toLowerCase()
                    expect(ondeProcurar, `produto ${id}`).to.include(termo.toLowerCase())
                })
            })
        })
    })

    it('termo sem correspondência retorna lista vazia', () => {
        cy.apiSearchProduct('xyzprodutoquenaoexiste123')
            .its('body').should('deep.equal', { responseCode: 200, products: [] })
    })

    it('sem o parâmetro search_product retorna 400', () => {
        cy.apiSearchProduct(undefined)
            .its('body').should('deep.equal', {
                responseCode: 400,
                message: 'Bad request, search_product parameter is missing in POST request.',
            })
    })
})
