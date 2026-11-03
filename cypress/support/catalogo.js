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

    catalogo.categoriaDe = (p) => `${p.category.usertype.usertype} > ${p.category.category}`

    // Partição de equivalência: um produto de cada grupo que pode quebrar de um
    // jeito diferente (cada categoria, cada marca, preços extremos, nome mais
    // longo, último ID, "&" na marca e na categoria). Calculada do catálogo, então
    // continua valendo se ele mudar. Em cada grupo, o de menor ID (determinístico).
    // Devolve [{ id, motivos }].
    catalogo.representantes = () => {
        const porId = Cypress._.sortBy(catalogo.produtos, 'id')
        const escolhidos = new Map()
        const escolher = (produto, motivo) => {
            if (produto) escolhidos.set(produto.id, [...(escolhidos.get(produto.id) || []), motivo])
        }
        // cobre cada valor do campo, reaproveitando produtos já escolhidos
        const cobrir = (campo, rotulo) => porId.forEach((p) => {
            const jaCoberto = [...escolhidos.keys()].some((id) => campo(catalogo.produto(id)) === campo(p))
            if (!jaCoberto) escolher(p, `${rotulo} ${campo(p)}`)
        })
        const preco = (p) => Number(p.price.replace(/\D/g, ''))

        cobrir(catalogo.categoriaDe, 'categoria')
        cobrir((p) => p.brand, 'marca')
        escolher(Cypress._.minBy(porId, preco), 'menor preço')
        escolher(Cypress._.maxBy(porId, preco), 'maior preço')
        escolher(Cypress._.maxBy(porId, (p) => p.name.length), 'nome mais longo')
        escolher(Cypress._.last(porId), 'último ID')
        escolher(porId.find((p) => p.brand.includes('&')), '"&" na marca')
        escolher(porId.find((p) => catalogo.categoriaDe(p).includes('&')), '"&" na categoria')

        return [...escolhidos].map(([id, motivos]) => ({ id, motivos }))
    }

    // produtos ao acaso, fora dos IDs informados: cada execução cobre outros
    catalogo.sortear = (quantidade, excluir = []) =>
        Cypress._.sampleSize(catalogo.produtos.filter((p) => !excluir.includes(p.id)), quantidade)

    return catalogo
}

export const ordenarIds = (ids) => [...ids].sort((a, b) => a - b)
