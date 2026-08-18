describe('API - Busca de produtos', () => {

    beforeEach(() => {
        cy.fixture('apiData').as('apiData')
    })

    it('deve retornar produtos para um termo de busca válido', function () {
        cy.apiSearchProduct(this.apiData.busca.termoValido).then((response) => {
            expect(response.body.responseCode).to.eq(200)
            expect(response.body.products.length).to.be.greaterThan(0)
        })
    })

    // Sem o parâmetro search_product a API não tenta adivinhar nada:
    // responde 400 com uma mensagem explicando o que faltou.
    it('deve retornar erro 400 quando o parâmetro search_product não é enviado', () => {
        cy.apiSearchProduct(undefined).then((response) => {
            expect(response.body.responseCode).to.eq(400)
            expect(response.body.message).to.eq('Bad request, search_product parameter is missing in POST request.')
        })
    })
})
