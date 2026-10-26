describe('Busca de produtos', () => {

    // catálogo da API: fonte independente para saber o que cada busca deve encontrar
    let catalogo = []

    before(() => {
        cy.apiGetProductsList().then(({ body }) => { catalogo = body.products })
    })

    const ordenar = (ids) => [...ids].sort((a, b) => a - b)

    // o site procura o termo no nome ou na categoria do produto, sem diferenciar maiúsculas
    const contem = (texto, termo) => texto.toLowerCase().includes(termo.toLowerCase())
    const idsQueContem = (termo) => ordenar(catalogo
        .filter((p) => contem(p.name, termo) || contem(p.category.category, termo))
        .map((p) => p.id))

    const buscar = (termo) => {
        cy.visit('/products')
        cy.get('#search_product').type(termo)
        cy.get('#submit_search').click()
        cy.get('.features_items h2.title').should('have.text', 'Searched Products')
    }

    // IDs dos produtos exibidos na lista principal
    const idsNaTela = () =>
        cy.get('.features_items').then(($lista) => ordenar(
            $lista.find('.productinfo a.add-to-cart').toArray().map((b) => Number(b.dataset.productId))))

    it('termo existente mostra exatamente os produtos que contêm o termo', () => {
        buscar('jeans')

        idsNaTela().should('deep.equal', idsQueContem('jeans')).and('not.be.empty')
    })

    it('busca não diferencia maiúsculas de minúsculas', () => {
        buscar('JEANS')

        idsNaTela().should('deep.equal', idsQueContem('jeans')).and('not.be.empty')
    })

    // o navegador remove espaços do fim da URL, então o termo chega limpo ao servidor
    // (espaço duplo e "&" não têm a mesma sorte: ver BUG-15)
    it('espaço no fim do termo é ignorado', () => {
        buscar('jeans ')

        idsNaTela().should('deep.equal', idsQueContem('jeans')).and('not.be.empty')
    })

    it('termo sem correspondência mostra a lista vazia', () => {
        buscar('xyzprodutoquenaoexiste123')

        idsNaTela().should('be.empty')
    })
})
