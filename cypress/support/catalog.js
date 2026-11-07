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
        cy.apiGetProductsList().then(({ body }) => {
            catalog.products = body.products
        })
    })

    // IDs em ordem crescente, no mesmo formato de cy.idsOnScreen()
    catalog.ids = (predicate) => sortIds(catalog.products.filter(predicate).map((p) => p.id))

    // o site procura o termo no nome ou na categoria do produto, sem diferenciar maiúsculas
    const matchesTerm = (text, term) => text.toLowerCase().includes(term.toLowerCase())
    catalog.idsContaining = (term) =>
        catalog.ids((p) => matchesTerm(p.name, term) || matchesTerm(p.category.category, term))

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
        const cover = (field, label) =>
            byId.forEach((p) => {
                const alreadyCovered = [...chosen.keys()].some((id) => field(catalog.product(id)) === field(p))
                if (!alreadyCovered) choose(p, `${label} ${field(p)}`)
            })
        const price = (p) => Number(p.price.replace(/\D/g, ''))

        cover(catalog.categoryOf, 'categoria')
        cover((p) => p.brand, 'marca')
        choose(Cypress._.minBy(byId, price), 'menor preço')
        choose(Cypress._.maxBy(byId, price), 'maior preço')
        choose(
            Cypress._.maxBy(byId, (p) => p.name.length),
            'nome mais longo',
        )
        choose(Cypress._.last(byId), 'último ID')
        choose(
            byId.find((p) => p.brand.includes('&')),
            '"&" na marca',
        )
        choose(
            byId.find((p) => catalog.categoryOf(p).includes('&')),
            '"&" na categoria',
        )

        return [...chosen].map(([id, reasons]) => ({ id, reasons }))
    }

    // produtos ao acaso, fora dos IDs informados: cada execução cobre outros
    catalog.pickRandom = (quantity, exclude = []) =>
        Cypress._.sampleSize(
            catalog.products.filter((p) => !exclude.includes(p.id)),
            quantity,
        )

    return catalog
}

export const sortIds = (ids) => [...ids].sort((a, b) => a - b)

// --- Teste de guarda do catálogo (CT-API-CATALOG-01) -------------------------

// Variação de preço acima disso (para mais ou para menos) é marcada como
// SUSPEITO: Rs. 500 → Rs. 50 parece erro de digitação, não reajuste.
export const SUSPICIOUS_CHANGE_PERCENT = 50

const rupees = (price) => (/^Rs\. \d+$/.test(price) ? Number(price.slice(4)) : NaN)

// Variação em porcentagem, com uma casa. Perto do limite, o arredondamento não
// pode esconder que ele foi ultrapassado (50,02% não aparece como "50%").
const formatPercent = (value, suspicious) => {
    let shown = Math.round(value * 10) / 10
    if (suspicious && shown <= SUSPICIOUS_CHANGE_PERCENT) shown = Math.ceil(value * 100) / 100
    return String(shown)
}

// "Rs. 500 → Rs. 50 (-90%, SUSPEITO)"
export const priceChange = (before, now) => {
    const [from, to] = [rupees(before), rupees(now)]
    if (Number.isNaN(from) || Number.isNaN(to) || from === 0) {
        return `${before} → ${now} (formato inesperado, SUSPEITO)`
    }
    const diff = to - from
    // comparação em inteiros, sem arredondamento: |diff| / from > 50%
    const suspicious = Math.abs(diff) * 100 > SUSPICIOUS_CHANGE_PERCENT * from
    const percent = formatPercent((Math.abs(diff) * 100) / from, suspicious)
    return `${before} → ${now} (${diff < 0 ? '-' : '+'}${percent}%${suspicious ? ', SUSPEITO' : ''})`
}

// O que mudou da referência conferida para o catálogo atual da API, uma linha por
// diferença. reference: { "<id>": { name, price } }; products: o body.products da API.
export const catalogChanges = (reference, products) => {
    const current = Object.fromEntries(products.map((p) => [String(p.id), p]))
    const ids = [...new Set([...Object.keys(reference), ...Object.keys(current)])].sort((a, b) => a - b)
    return ids.flatMap((id) => {
        const [before, now] = [reference[id], current[id]]
        if (!now) return [`id ${id} (${before.name}) saiu do catálogo`]
        if (!before) return [`id ${id} (${now.name}, ${now.price}) entrou no catálogo`]
        const changes = []
        if (before.name !== now.name) changes.push(`id ${id}: nome "${before.name}" → "${now.name}"`)
        if (before.price !== now.price) changes.push(`${now.name}: ${priceChange(before.price, now.price)}`)
        return changes
    })
}
