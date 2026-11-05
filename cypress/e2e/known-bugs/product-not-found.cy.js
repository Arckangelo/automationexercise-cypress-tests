import { useCatalog } from '../../support/catalog'

// BUG-21 (ver BUGS.md)
// Um ID de produto que não existe abre, com HTTP 200, uma página de produto
// vazia (sem nome, preço nem marca), com "In Stock" e o botão "Add to cart".
// E /add_to_cart/<ID inexistente> responde "Added To Cart", sem adicionar nada.
describe('[BUG-21] Produto inexistente - página vazia e "Added To Cart"', () => {
    const catalog = useCatalog()
    const NONEXISTENT_ID = 9999

    beforeEach(() => {
        expect(catalog.product(NONEXISTENT_ID), `o produto ${NONEXISTENT_ID} não existe no catálogo`).to.be.undefined
    })

    // CT-BUGS-PRODUCT-NOT-FOUND-01
    it(`[BUG-21] /product_details/${NONEXISTENT_ID} deve responder 404`, () => {
        cy.request({ url: `/product_details/${NONEXISTENT_ID}`, failOnStatusCode: false })
            .its('status')
            .should('eq', 404)
    })

    // CT-BUGS-PRODUCT-NOT-FOUND-02
    it(`[BUG-21] /add_to_cart/${NONEXISTENT_ID} não deve responder "Added To Cart"`, () => {
        cy.request({ url: `/add_to_cart/${NONEXISTENT_ID}`, failOnStatusCode: false }).then(({ status, body }) => {
            expect(body, 'resposta').to.not.eq('Added To Cart')
            expect(status, 'status HTTP').to.eq(404)
        })
        cy.cartItems().should('deep.equal', {})
    })
})
