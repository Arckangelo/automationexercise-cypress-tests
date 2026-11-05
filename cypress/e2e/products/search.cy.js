import { useCatalog } from '../../support/catalog'

describe('Busca de produtos', () => {
    // catálogo da API: fonte independente para saber o que cada busca deve encontrar
    const catalog = useCatalog()

    // CT-PRODUCTS-SEARCH-01
    it('termo existente mostra exatamente os produtos que contêm o termo', () => {
        cy.searchProduct('jeans')

        cy.idsOnScreen().should('deep.equal', catalog.idsContaining('jeans')).and('not.be.empty')
    })

    // CT-PRODUCTS-SEARCH-02
    it('busca não diferencia maiúsculas de minúsculas', () => {
        cy.searchProduct('JEANS')

        cy.idsOnScreen().should('deep.equal', catalog.idsContaining('jeans')).and('not.be.empty')
    })

    // CT-PRODUCTS-SEARCH-03
    // o navegador remove espaços do fim da URL, então o termo chega limpo ao servidor
    // (espaço duplo e "&" não têm a mesma sorte: ver BUG-15)
    it('espaço no fim do termo é ignorado', () => {
        cy.searchProduct('jeans ')

        cy.idsOnScreen().should('deep.equal', catalog.idsContaining('jeans')).and('not.be.empty')
    })

    // CT-PRODUCTS-SEARCH-04
    it('termo sem correspondência mostra a lista vazia', () => {
        cy.searchProduct('xyzprodutoquenaoexiste123')

        cy.idsOnScreen().should('be.empty')
    })
})
