import { useCatalog } from '../../support/catalog'

describe('Detalhes do produto', () => {
    // catálogo da API: fonte independente do que cada página deve mostrar
    const catalog = useCatalog()

    // o que a página de detalhes mostra, no mesmo formato da API
    const readDetails = (html) => {
        const info = new DOMParser().parseFromString(html, 'text/html').querySelector('.product-information')
        const textOf = (selector) => info.querySelector(selector).textContent.trim()
        const field = (label) =>
            [...info.querySelectorAll('p')]
                .find((p) => p.textContent.trim().startsWith(label))
                .textContent.replace(label, '')
                .trim()

        return {
            name: textOf('h2'),
            price: textOf('span > span'),
            category: field('Category:'),
            brand: field('Brand:'),
        }
    }

    // CT-PRODUCTS-DETAILS-01
    // A página é um template: em vez de todo o catálogo, confere um produto de
    // cada classe de equivalência (catalog.representatives) mais um sorteado, que
    // muda a cada execução. O formato de TODOS os produtos é conferido pela API
    // (CT-API-PRODUCTS-01). Para repetir um sorteio: --expose sampledProduct=<id>
    it('a página mostra nome, preço, categoria e marca iguais aos da API (classes de equivalência + 1 sorteado)', () => {
        expect(catalog.products, 'catálogo carregado').to.not.be.empty

        const representatives = catalog.representatives()
        const sampledId =
            Cypress.expose('sampledProduct') ||
            catalog.pickRandom(
                1,
                representatives.map((r) => r.id),
            )[0].id
        const sample = [...representatives, { id: Number(sampledId), reasons: ['sorteado'] }]
        cy.log(`amostra: ${sample.map((p) => p.id).join(', ')} (sorteado: ${sampledId})`)

        sample.forEach(({ id, reasons }) => {
            const product = catalog.product(id)
            expect(product, `produto ${id} existe no catálogo`).to.exist

            cy.request(`/product_details/${id}`)
                .its('body')
                .then((html) => {
                    expect(readDetails(html), `produto ${id} (${reasons.join(', ')})`).to.deep.equal({
                        name: product.name,
                        price: product.price,
                        category: catalog.categoryOf(product),
                        brand: product.brand,
                    })
                })
        })
    })

    // CT-PRODUCTS-DETAILS-02
    // pega: link "View Product" apontando para o produto do card ao lado
    it('"View Product" na listagem abre a página do produto certo', () => {
        cy.visit('/products')

        cy.get('.features_items .product-image-wrapper').each(($card) => {
            const id = $card.find('.productinfo a.add-to-cart').attr('data-product-id')
            expect($card.find('.choose a').attr('href'), `card do produto ${id}`).to.eq(`/product_details/${id}`)
        })

        cy.get('.choose a[href="/product_details/2"]').click()
        cy.url().should('include', '/product_details/2')
        cy.textOf('.product-information h2').should('eq', catalog.product(2).name)
    })

    // CT-PRODUCTS-DETAILS-03
    it('"Add to cart" com quantidade 3 leva 3 unidades ao carrinho, com o total certo', () => {
        const { name, price } = catalog.product(1)
        const total = `Rs. ${Number(price.replace(/\D/g, '')) * 3}`
        cy.intercept('GET', '/add_to_cart/*').as('addToCart')

        cy.visit('/product_details/1')
        cy.get('#quantity').clear().type('3')
        cy.get('.product-information button.cart').click()
        cy.wait('@addToCart').its('response.statusCode').should('eq', 200)

        cy.get('#cartModal a[href="/view_cart"]').click()
        cy.get('#product-1').within(() => {
            cy.textOf('.cart_description h4 a').should('eq', name)
            cy.textOf('.cart_quantity button').should('eq', '3')
            cy.textOf('.cart_total_price').should('eq', total)
        })
    })

    // CT-PRODUCTS-DETAILS-04
    it('a imagem do produto carrega', () => {
        cy.visit('/product_details/1')

        cy.get('.view-product img')
            .should('have.attr', 'src', '/get_product_picture/1')
            .and(($img) => expect($img[0].naturalWidth, 'largura da imagem carregada').to.be.greaterThan(0))
    })
})
