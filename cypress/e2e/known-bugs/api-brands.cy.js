// BUG-14 (ver BUGS.md)
// GET /api/brandsList devolve a marca de cada PRODUTO, e não a lista de marcas:
// os "id" são IDs de produto e cada marca aparece uma vez por produto
// (34 itens para 8 marcas), enquanto a documentação promete "All brands list".
describe('[BUG-14] API - lista de marcas repetida', () => {

    // CT-BUGS-API-BRANDS-01
    it('[BUG-14] GET /api/brandsList não deve repetir marcas', () => {
        cy.apiGetBrandsList().then(({ body }) => {
            expect(body.responseCode).to.eq(200)

            const names = body.brands.map((b) => b.brand)
            const duplicates = [...new Set(names.filter((n, i) => names.indexOf(n) !== i))]
            expect(duplicates, 'marcas repetidas').to.be.empty
        })
    })
})
