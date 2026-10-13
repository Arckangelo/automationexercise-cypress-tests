describe('API - Produtos e marcas', () => {

    it('deve listar todos os produtos', () => {
        cy.apiGetProductsList().then((response) => {
            expect(response.body.responseCode).to.eq(200)
            expect(response.body.products.length).to.be.greaterThan(0)

            const primeiroProduto = response.body.products[0]
            expect(primeiroProduto).to.have.all.keys('id', 'name', 'price', 'brand', 'category')
        })
    })

    // A API só aceita GET nesse endpoint; POST deve ser rejeitado.
    it('deve rejeitar POST na listagem de produtos (só aceita GET)', () => {
        cy.apiRequest({ method: 'POST', url: '/api/productsList' }).then((response) => {
            expect(response.body.responseCode).to.eq(405)
            expect(response.body.message).to.eq('This request method is not supported.')
        })
    })

    it('deve listar todas as marcas', () => {
        cy.apiGetBrandsList().then((response) => {
            expect(response.body.responseCode).to.eq(200)
            expect(response.body.brands.length).to.be.greaterThan(0)
            expect(response.body.brands[0]).to.have.all.keys('id', 'brand')
        })
    })
it('deve listar todas as marcas', () => {
        cy.apiGetBrandsList().then((response) => {
            expect(response.body.responseCode).to.eq(200)
            expect(response.body.brands.length).to.be.greaterThan(0)
            expect(response.body.brands[0]).to.have.all.keys('id', 'brand')
        })
    })
})
