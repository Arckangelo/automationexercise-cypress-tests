describe('Filtro de produtos', () => {

    // catálogo da API: fonte independente para saber quais produtos cada filtro deve mostrar
    let catalogo = []

    before(() => {
        cy.apiGetProductsList().then(({ body }) => { catalogo = body.products })
    })

    const ordenar = (ids) => [...ids].sort((a, b) => a - b)

    const idsDoCatalogo = (filtro) => ordenar(catalogo.filter(filtro).map((p) => p.id))

    // IDs dos produtos exibidos na lista principal
    const idsNaTela = () =>
        cy.get('.features_items .productinfo a.add-to-cart')
            .then(($botoes) => ordenar($botoes.toArray().map((b) => Number(b.dataset.productId))))

    const tituloDaLista = () => cy.get('.features_items h2.title')

    const categorias = [
        { painel: 'Women', categoria: 'Dress', href: '/category_products/1' },
        { painel: 'Men', categoria: 'Jeans', href: '/category_products/6' },
    ]

    categorias.forEach(({ painel, categoria, href }) => {
        it(`categoria ${painel} > ${categoria} mostra exatamente os produtos dessa categoria`, () => {
            cy.visit('/products')
            cy.get(`a[href="#${painel}"]`).click()
            cy.get(`#${painel} a[href="${href}"]`).click()

            tituloDaLista().should('have.text', `${painel} - ${categoria} Products`)
            idsNaTela().should('deep.equal', idsDoCatalogo((p) =>
                p.category.usertype.usertype === painel && p.category.category === categoria))
        })
    })

    it('marca Polo mostra exatamente os produtos dessa marca', () => {
        cy.visit('/products')
        cy.get('.brands-name a[href="/brand_products/Polo"]').click()

        tituloDaLista().should('have.text', 'Brand - Polo Products')
        idsNaTela().should('deep.equal', idsDoCatalogo((p) => p.brand === 'Polo'))
    })

    // pega: contador da lateral desatualizado ou calculado errado
    it('quantidade de cada marca na lateral bate com o catálogo', () => {
        cy.visit('/products')

        cy.get('.brands-name a[href^="/brand_products/"]').should('have.length.greaterThan', 0).each(($marca) => {
            const nome = decodeURIComponent($marca.attr('href').replace('/brand_products/', ''))
            const naLateral = Number($marca.find('span').text().replace(/\D/g, ''))
            const noCatalogo = catalogo.filter((p) => p.brand === nome).length

            expect(naLateral, `quantidade de ${nome}`).to.eq(noCatalogo)
        })
    })
})
