// BUG-14 (ver BUGS.md)
// GET /api/brandsList devolve a marca de cada PRODUTO, e não a lista de marcas:
// os "id" são IDs de produto e cada marca aparece uma vez por produto
// (34 itens para 8 marcas), enquanto a documentação promete "All brands list".
describe('[BUG-14] API - lista de marcas repetida', () => {

    it('[BUG-14] GET /api/brandsList não deve repetir marcas', () => {
        cy.apiGetBrandsList().then(({ body }) => {
            expect(body.responseCode).to.eq(200)

            const nomes = body.brands.map((b) => b.brand)
            const repetidas = [...new Set(nomes.filter((n, i) => nomes.indexOf(n) !== i))]
            expect(repetidas, 'marcas repetidas').to.be.empty
        })
    })
})
