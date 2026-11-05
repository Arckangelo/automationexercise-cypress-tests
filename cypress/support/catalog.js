// Carrega o catálogo da API para o describe que chamar esta função. É a fonte
// independente do que cada busca, filtro ou carrinho deve mostrar: os testes
// comparam a tela com a API, e não com a própria tela.
//
// Uso:
//   const catalogo = useCatalog()
//   it('...', () => {
//     cy.searchProduct('jeans')
//     cy.idsOnScreen().should('deep.equal', catalogo.idsContaining('jeans'))
//   })
//
// Os dados só existem depois do before(), por isso devem ser lidos dentro dos
// testes/hooks, nunca no corpo do describe.
export const useCatalog = () => {
    const catalog = { products: [] }

    before(() => {
        cy.apiGetProductsList().then(({ body }) => { catalog.products = body.products })
    })

    // IDs em ordem crescente, no mesmo formato de cy.idsOnScreen()
    catalog.ids = (predicate) => sortIds(catalog.products.filter(predicate).map((p) => p.id))

    // o site procura o termo no nome ou na categoria do produto, sem diferenciar maiúsculas
    const matchesTerm = (text, term) => text.toLowerCase().includes(term.toLowerCase())
    catalog.idsContaining = (term) => catalog.ids((p) => matchesTerm(p.name, term) || matchesTerm(p.category.category, term))

    catalog.product = (id) => catalog.products.find((p) => String(p.id) === String(id))

    catalog.categoryOf = (p) => `${p.category.usertype.usertype} > ${p.category.category}`

    // Partição de equivalência: um produto de cada grupo que pode quebrar de um
    // jeito diferente (cada categoria, cada marca, preços extremos, nome mais
    // longo, último ID, "&" na marca e na categoria). Calculada do catálogo, então
    // continua valendo se ele mudar. Em cada grupo, o de menor ID (determinístico).
    // Devolve [{ id, motivos }].
    catalog.representatives = () => {
        const byId = Cypress._.sortBy(catalog.products, 'id')
        const chosen = new Map()
        const choose = (product, reason) => {
            if (product) chosen.set(product.id, [...(chosen.get(product.id) || []), reason])
        }
        // cobre cada valor do campo, reaproveitando produtos já escolhidos
        const cover = (field, label) => byId.forEach((p) => {
            const alreadyCovered = [...chosen.keys()].some((id) => field(catalog.product(id)) === field(p))
            if (!alreadyCovered) choose(p, `${label} ${field(p)}`)
        })
        const price = (p) => Number(p.price.replace(/\D/g, ''))

        cover(catalog.categoryOf, 'categoria')
        cover((p) => p.brand, 'marca')
        choose(Cypress._.minBy(byId, price), 'menor preço')
        choose(Cypress._.maxBy(byId, price), 'maior preço')
        choose(Cypress._.maxBy(byId, (p) => p.name.length), 'nome mais longo')
        choose(Cypress._.last(byId), 'último ID')
        choose(byId.find((p) => p.brand.includes('&')), '"&" na marca')
        choose(byId.find((p) => catalog.categoryOf(p).includes('&')), '"&" na categoria')

        return [...chosen].map(([id, reasons]) => ({ id, reasons }))
    }

    // produtos ao acaso, fora dos IDs informados: cada execução cobre outros
    catalog.pickRandom = (quantity, exclude = []) =>
        Cypress._.sampleSize(catalog.products.filter((p) => !exclude.includes(p.id)), quantity)

    return catalog
}

export const sortIds = (ids) => [...ids].sort((a, b) => a - b)
