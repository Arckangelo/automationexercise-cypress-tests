import { useCatalog } from '../../support/catalog'

// BUG-15 (ver BUGS.md)
// O script da página /products monta a URL da busca concatenando o texto do
// campo, sem trim e sem encodeURIComponent:
//     window.location = '/products?search=' + search;
// Espaços repetidos fazem a busca não achar nada, e um "&" corta o termo (o
// resto vira outro parâmetro da URL). Espaço no fim não é afetado: o navegador
// o remove da URL (coberto na suíte principal, em search.cy.js).
describe('[BUG-15] Busca - espaço duplo e "&" no termo', () => {
    const catalog = useCatalog()

    // digitado: o que o usuário escreve; equivalente: o termo que ele quis buscar
    const cases = [
        // CT-BUGS-SEARCH-INPUT-01
        { scenario: 'espaço duplo entre as palavras', typed: 'blue  top', equivalent: 'blue top' },
        // CT-BUGS-SEARCH-INPUT-02
        { scenario: 'termo com "&"', typed: 'Blue & Pink', equivalent: 'Blue & Pink' },
    ]

    cases.forEach(({ scenario, typed, equivalent }) => {
        it(`[BUG-15] ${scenario} ("${typed}") deve encontrar os produtos de "${equivalent}"`, () => {
            const expectedIds = catalog.idsContaining(equivalent)
            expect(expectedIds, `o catálogo tem produtos com "${equivalent}"`).to.not.be.empty

            cy.searchProduct(typed)
            cy.idsOnScreen().should('deep.equal', expectedIds)
        })
    })
})
