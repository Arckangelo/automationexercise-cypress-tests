// BUG-15 (ver BUGS.md)
// O script da página /products monta a URL da busca concatenando o texto do
// campo, sem trim e sem encodeURIComponent:
//     window.location = '/products?search=' + search;
// Espaços repetidos fazem a busca não achar nada, e um "&" corta o termo (o
// resto vira outro parâmetro da URL). Espaço no fim não é afetado: o navegador
// o remove da URL (coberto na suíte principal, em search.cy.js).
describe('[BUG-15] Busca - espaço duplo e "&" no termo', () => {

    let catalogo = []

    before(() => {
        cy.apiGetProductsList().then(({ body }) => { catalogo = body.products })
    })

    const ordenar = (ids) => [...ids].sort((a, b) => a - b)

    const contem = (texto, termo) => texto.toLowerCase().includes(termo.toLowerCase())
    const idsQueContem = (termo) => ordenar(catalogo
        .filter((p) => contem(p.name, termo) || contem(p.category.category, termo))
        .map((p) => p.id))

    const buscar = (termo) => {
        cy.visit('/products')
        cy.get('#search_product').type(termo)
        cy.get('#submit_search').click()
        cy.get('.features_items h2.title').should('have.text', 'Searched Products')
    }

    const idsNaTela = () =>
        cy.get('.features_items').then(($lista) => ordenar(
            $lista.find('.productinfo a.add-to-cart').toArray().map((b) => Number(b.dataset.productId))))

    // digitado: o que o usuário escreve; equivalente: o termo que ele quis buscar
    const casos = [
        { cenario: 'espaço duplo entre as palavras', digitado: 'blue  top', equivalente: 'blue top' },
        { cenario: 'termo com "&"', digitado: 'Blue & Pink', equivalente: 'Blue & Pink' },
    ]

    casos.forEach(({ cenario, digitado, equivalente }) => {
        it(`[BUG-15] ${cenario} ("${digitado}") deve encontrar os produtos de "${equivalente}"`, () => {
            const esperados = idsQueContem(equivalente)
            expect(esperados, `o catálogo tem produtos com "${equivalente}"`).to.not.be.empty

            buscar(digitado)
            idsNaTela().should('deep.equal', esperados)
        })
    })
})
