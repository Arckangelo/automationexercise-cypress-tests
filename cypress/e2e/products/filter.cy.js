import { useCatalog } from '../../support/catalog'

describe('Filtro de produtos', () => {

    // catálogo da API: fonte independente para saber quais produtos cada filtro deve mostrar
    const catalog = useCatalog()

    const listTitle = () => cy.get('.features_items h2.title')

    const categories = [
        // CT-PRODUCTS-FILTER-01
        { panel: 'Women', category: 'Dress', href: '/category_products/1' },
        // CT-PRODUCTS-FILTER-02
        { panel: 'Men', category: 'Jeans', href: '/category_products/6' },
    ]

    categories.forEach(({ panel, category, href }) => {
        it(`categoria ${panel} > ${category} mostra exatamente os produtos dessa categoria`, () => {
            cy.visit('/products')
            cy.get(`a[href="#${panel}"]`).click()
            cy.get(`#${panel} a[href="${href}"]`).click()

            listTitle().should('have.text', `${panel} - ${category} Products`)
            cy.idsOnScreen().should('deep.equal', catalog.ids((p) =>
                p.category.usertype.usertype === panel && p.category.category === category))
        })
    })

    // CT-PRODUCTS-FILTER-03
    it('marca Polo mostra exatamente os produtos dessa marca', () => {
        cy.visit('/products')
        cy.get('.brands-name a[href="/brand_products/Polo"]').click()

        listTitle().should('have.text', 'Brand - Polo Products')
        cy.idsOnScreen().should('deep.equal', catalog.ids((p) => p.brand === 'Polo'))
    })

    // CT-PRODUCTS-FILTER-04
    // pega: contador da lateral desatualizado ou calculado errado
    it('quantidade de cada marca na lateral bate com o catálogo', () => {
        cy.visit('/products')

        cy.get('.brands-name a[href^="/brand_products/"]').should('have.length.greaterThan', 0).each(($brand) => {
            const name = decodeURIComponent($brand.attr('href').replace('/brand_products/', ''))
            const inSidebar = Number($brand.find('span').text().replace(/\D/g, ''))
            const inCatalog = catalog.ids((p) => p.brand === name).length

            expect(inSidebar, `quantidade de ${name}`).to.eq(inCatalog)
        })
    })
})
