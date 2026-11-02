import { usarCatalogo } from '../../support/catalogo'

describe('Busca de produtos', () => {

    // catálogo da API: fonte independente para saber o que cada busca deve encontrar
    const catalogo = usarCatalogo()

    it('termo existente mostra exatamente os produtos que contêm o termo', () => {
        cy.buscarProduto('jeans')

        cy.idsNaTela().should('deep.equal', catalogo.idsQueContem('jeans')).and('not.be.empty')
    })

    it('busca não diferencia maiúsculas de minúsculas', () => {
        cy.buscarProduto('JEANS')

        cy.idsNaTela().should('deep.equal', catalogo.idsQueContem('jeans')).and('not.be.empty')
    })

    // o navegador remove espaços do fim da URL, então o termo chega limpo ao servidor
    // (espaço duplo e "&" não têm a mesma sorte: ver BUG-15)
    it('espaço no fim do termo é ignorado', () => {
        cy.buscarProduto('jeans ')

        cy.idsNaTela().should('deep.equal', catalogo.idsQueContem('jeans')).and('not.be.empty')
    })

    it('termo sem correspondência mostra a lista vazia', () => {
        cy.buscarProduto('xyzprodutoquenaoexiste123')

        cy.idsNaTela().should('be.empty')
    })
})
