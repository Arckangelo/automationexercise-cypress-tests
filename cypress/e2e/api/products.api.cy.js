describe('API - Produtos e marcas', () => {

    const naoVazio = (valor, campo) => expect(valor, campo).to.be.a('string').and.not.be.empty

    it('lista de produtos: todos os itens têm formato válido e IDs únicos', () => {
        cy.apiGetProductsList().then(({ body }) => {
            expect(body.responseCode).to.eq(200)
            expect(body.products, 'produtos').to.be.an('array').that.is.not.empty

            body.products.forEach((produto) => {
                const ref = `produto ${produto.id}`
                expect(produto, ref).to.have.all.keys('id', 'name', 'price', 'brand', 'category')
                expect(produto.id, `${ref}: id`).to.be.a('number')
                naoVazio(produto.name, `${ref}: name`)
                expect(produto.price, `${ref}: price`).to.match(/^Rs\. \d+$/)
                naoVazio(produto.brand, `${ref}: brand`)
                naoVazio(produto.category?.usertype?.usertype, `${ref}: usertype`)
                naoVazio(produto.category?.category, `${ref}: category`)
            })

            const ids = body.products.map((p) => p.id)
            expect(new Set(ids).size, 'IDs únicos').to.eq(ids.length)
        })
    })

    it('método POST na lista de produtos é rejeitado com 405 (só aceita GET)', () => {
        cy.apiRequest({ method: 'POST', url: '/api/productsList' })
            .its('body').should('deep.equal', { responseCode: 405, message: 'This request method is not supported.' })
    })

    it('lista de marcas: todos os itens têm formato válido', () => {
        cy.apiGetBrandsList().then(({ body }) => {
            expect(body.responseCode).to.eq(200)
            expect(body.brands, 'marcas').to.be.an('array').that.is.not.empty

            body.brands.forEach((marca) => {
                expect(marca, `marca ${marca.id}`).to.have.all.keys('id', 'brand')
                expect(marca.id, `marca ${marca.id}: id`).to.be.a('number')
                naoVazio(marca.brand, `marca ${marca.id}: brand`)
            })
        })
    })

    // vale com ou sem o BUG-14 (marcas repetidas): compara só o conjunto de nomes
    it('lista de marcas tem exatamente as marcas dos produtos', () => {
        cy.apiGetProductsList().then(({ body: { products } }) => {
            cy.apiGetBrandsList().then(({ body: { brands } }) => {
                const doCatalogo = [...new Set(products.map((p) => p.brand))].sort()
                const listadas = [...new Set(brands.map((b) => b.brand))].sort()
                expect(listadas).to.deep.equal(doCatalogo)
            })
        })
    })
})
