// Carrega o catálogo da API para o describe que chamar esta função. É a fonte
// independente do que cada busca, filtro ou carrinho deve mostrar: os testes
// comparam a tela com a API, e não com a própria tela.
//
// Uso:
//   const catalogo = usarCatalogo()
//   it('...', () => {
//     cy.buscarProduto('jeans')
//     cy.idsNaTela().should('deep.equal', catalogo.idsQueContem('jeans'))
//   })
//
// Os dados só existem depois do before(), por isso devem ser lidos dentro dos
// testes/hooks, nunca no corpo do describe.
export const usarCatalogo = () => {
    const catalogo = { produtos: [] }

    before(() => {
        cy.apiGetProductsList().then(({ body }) => { catalogo.produtos = body.products })
    })

    // IDs em ordem crescente, no mesmo formato de cy.idsNaTela()
    catalogo.ids = (filtro) => ordenarIds(catalogo.produtos.filter(filtro).map((p) => p.id))

    // o site procura o termo no nome ou na categoria do produto, sem diferenciar maiúsculas
    const contem = (texto, termo) => texto.toLowerCase().includes(termo.toLowerCase())
    catalogo.idsQueContem = (termo) => catalogo.ids((p) => contem(p.name, termo) || contem(p.category.category, termo))

    catalogo.produto = (id) => catalogo.produtos.find((p) => String(p.id) === String(id))

    return catalogo
}

export const ordenarIds = (ids) => [...ids].sort((a, b) => a - b)
