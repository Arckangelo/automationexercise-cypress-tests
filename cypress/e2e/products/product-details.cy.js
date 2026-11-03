import { usarCatalogo } from '../../support/catalogo'

describe('Detalhes do produto', () => {

    // catálogo da API: fonte independente do que cada página deve mostrar
    const catalogo = usarCatalogo()

    // o que a página de detalhes mostra, no mesmo formato da API
    const lerDetalhes = (html) => {
        const info = new DOMParser().parseFromString(html, 'text/html').querySelector('.product-information')
        const textoDe = (seletor) => info.querySelector(seletor).textContent.trim()
        const campo = (rotulo) => [...info.querySelectorAll('p')]
            .find((p) => p.textContent.trim().startsWith(rotulo)).textContent.replace(rotulo, '').trim()

        return {
            name: textoDe('h2'),
            price: textoDe('span > span'),
            category: campo('Category:'),
            brand: campo('Brand:'),
        }
    }

    // CT-PRODUCTS-DETAILS-01
    // por HTTP, para cobrir os 34 produtos sem abrir 34 páginas no navegador
    it('a página de cada produto mostra nome, preço, categoria e marca iguais aos da API', () => {
        expect(catalogo.produtos, 'catálogo carregado').to.not.be.empty

        catalogo.produtos.forEach(({ id, name, price, brand, category }) => {
            cy.request(`/product_details/${id}`).its('body').then((html) => {
                expect(lerDetalhes(html), `produto ${id}`).to.deep.equal({
                    name,
                    price,
                    category: `${category.usertype.usertype} > ${category.category}`,
                    brand,
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
        cy.textoDe('.product-information h2').should('eq', catalogo.produto(2).name)
    })

    // CT-PRODUCTS-DETAILS-03
    it('"Add to cart" com quantidade 3 leva 3 unidades ao carrinho, com o total certo', () => {
        const { name, price } = catalogo.produto(1)
        const total = `Rs. ${Number(price.replace(/\D/g, '')) * 3}`
        cy.intercept('GET', '/add_to_cart/*').as('adicionarAoCarrinho')

        cy.visit('/product_details/1')
        cy.get('#quantity').clear().type('3')
        cy.get('.product-information button.cart').click()
        cy.wait('@adicionarAoCarrinho').its('response.statusCode').should('eq', 200)

        cy.get('#cartModal a[href="/view_cart"]').click()
        cy.get('#product-1').within(() => {
            cy.textoDe('.cart_description h4 a').should('eq', name)
            cy.textoDe('.cart_quantity button').should('eq', '3')
            cy.textoDe('.cart_total_price').should('eq', total)
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
