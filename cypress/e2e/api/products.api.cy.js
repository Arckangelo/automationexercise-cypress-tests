describe('API - Produtos e marcas', () => {
    const assertNotEmpty = (value, field) => expect(value, field).to.be.a('string').and.not.be.empty

    // CT-API-PRODUCTS-01
    // pega: campo faltando num produto (mutante M09)
    it('lista de produtos: todos os itens têm formato válido e IDs únicos', () => {
        cy.apiGetProductsList().then(({ body }) => {
            expect(body.responseCode).to.eq(200)
            expect(body.products, 'produtos').to.be.an('array').that.is.not.empty

            body.products.forEach((product) => {
                const ref = `produto ${product.id}`
                expect(product, ref).to.have.all.keys('id', 'name', 'price', 'brand', 'category')
                expect(product.id, `${ref}: id`).to.be.a('number')
                assertNotEmpty(product.name, `${ref}: name`)
                expect(product.price, `${ref}: price`).to.match(/^Rs\. \d+$/)
                assertNotEmpty(product.brand, `${ref}: brand`)
                assertNotEmpty(product.category?.usertype?.usertype, `${ref}: usertype`)
                assertNotEmpty(product.category?.category, `${ref}: category`)
            })

            const ids = body.products.map((p) => p.id)
            expect(new Set(ids).size, 'IDs únicos').to.eq(ids.length)
        })
    })

    // CT-API-PRODUCTS-02
    it('método POST na lista de produtos é rejeitado com 405 (só aceita GET)', () => {
        cy.apiRequest({ method: 'POST', url: '/api/productsList' })
            .its('body')
            .should('deep.equal', { responseCode: 405, message: 'This request method is not supported.' })
    })

    // CT-API-PRODUCTS-03
    it('lista de marcas: todos os itens têm formato válido', () => {
        cy.apiGetBrandsList().then(({ body }) => {
            expect(body.responseCode).to.eq(200)
            expect(body.brands, 'marcas').to.be.an('array').that.is.not.empty

            body.brands.forEach((brand) => {
                expect(brand, `marca ${brand.id}`).to.have.all.keys('id', 'brand')
                expect(brand.id, `marca ${brand.id}: id`).to.be.a('number')
                assertNotEmpty(brand.brand, `marca ${brand.id}: brand`)
            })
        })
    })

    // CT-API-PRODUCTS-04
    // vale com ou sem o BUG-14 (marcas repetidas): compara só o conjunto de nomes
    it('lista de marcas tem exatamente as marcas dos produtos', () => {
        cy.apiGetProductsList().then(({ body: { products } }) => {
            cy.apiGetBrandsList().then(({ body: { brands } }) => {
                const fromCatalog = [...new Set(products.map((p) => p.brand))].sort()
                const listed = [...new Set(brands.map((b) => b.brand))].sort()
                expect(listed).to.deep.equal(fromCatalog)
            })
        })
    })
})
