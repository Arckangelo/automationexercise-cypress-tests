import { usarCatalogo } from '../../support/catalogo'

// BUG-21 (ver BUGS.md)
// Um ID de produto que não existe abre, com HTTP 200, uma página de produto
// vazia (sem nome, preço nem marca), com "In Stock" e o botão "Add to cart".
// E /add_to_cart/<ID inexistente> responde "Added To Cart", sem adicionar nada.
describe('[BUG-21] Produto inexistente - página vazia e "Added To Cart"', () => {

    const catalogo = usarCatalogo()
    const INEXISTENTE = 9999

    beforeEach(() => {
        expect(catalogo.produto(INEXISTENTE), `o produto ${INEXISTENTE} não existe no catálogo`).to.be.undefined
    })

    // CT-BUGS-PRODUCT-NOT-FOUND-01
    it(`[BUG-21] /product_details/${INEXISTENTE} deve responder 404`, () => {
        cy.request({ url: `/product_details/${INEXISTENTE}`, failOnStatusCode: false })
            .its('status').should('eq', 404)
    })

    // CT-BUGS-PRODUCT-NOT-FOUND-02
    it(`[BUG-21] /add_to_cart/${INEXISTENTE} não deve responder "Added To Cart"`, () => {
        cy.request({ url: `/add_to_cart/${INEXISTENTE}`, failOnStatusCode: false }).then(({ status, body }) => {
            expect(body, 'resposta').to.not.eq('Added To Cart')
            expect(status, 'status HTTP').to.eq(404)
        })
        cy.itensDoCarrinho().should('deep.equal', {})
    })
})
