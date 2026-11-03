import { usarCatalogo } from '../../support/catalogo'

// BUG-15 (ver BUGS.md)
// O script da página /products monta a URL da busca concatenando o texto do
// campo, sem trim e sem encodeURIComponent:
//     window.location = '/products?search=' + search;
// Espaços repetidos fazem a busca não achar nada, e um "&" corta o termo (o
// resto vira outro parâmetro da URL). Espaço no fim não é afetado: o navegador
// o remove da URL (coberto na suíte principal, em search.cy.js).
describe('[BUG-15] Busca - espaço duplo e "&" no termo', () => {

    const catalogo = usarCatalogo()

    // digitado: o que o usuário escreve; equivalente: o termo que ele quis buscar
    const casos = [
        // CT-BUGS-SEARCH-INPUT-01
        { cenario: 'espaço duplo entre as palavras', digitado: 'blue  top', equivalente: 'blue top' },
        // CT-BUGS-SEARCH-INPUT-02
        { cenario: 'termo com "&"', digitado: 'Blue & Pink', equivalente: 'Blue & Pink' },
    ]

    casos.forEach(({ cenario, digitado, equivalente }) => {
        it(`[BUG-15] ${cenario} ("${digitado}") deve encontrar os produtos de "${equivalente}"`, () => {
            const esperados = catalogo.idsQueContem(equivalente)
            expect(esperados, `o catálogo tem produtos com "${equivalente}"`).to.not.be.empty

            cy.buscarProduto(digitado)
            cy.idsNaTela().should('deep.equal', esperados)
        })
    })
})
