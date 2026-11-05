// Registra os pedidos que cada teste de fato criou no site: um POST /payment
// confirmado, isto é, redirecionado para /payment_done/<valor>. O site não tem
// como apagar pedidos, então quem cria pedido leva a tag @creates-order (o
// filtro dos PRs pula esses testes no job de bugs conhecidos). Ao fim da
// execução, scripts/check-order-tags.js compara este registro com as tags do
// código: pedido sem a tag falha o CI; tag sem pedido gera aviso.
//
// Dois pontos de detecção, porque o cy.intercept não enxerga o cy.request:
// - pagamento pela tela: cy.intercept abaixo;
// - pagamento por HTTP: a sobrescrita do cy.request (commands/protection.js).

let ordersInTest = 0

const isConfirmedOrder = (status, location) => status >= 300 && status < 400 && /\/payment_done\//.test(location || '')

// resposta do cy.request: sem seguir o redirecionamento (status 302 + location)
// ou seguindo (a lista redirects mostra a passagem por /payment_done)
export const recordPaymentResponse = (response) => {
    const followedToConfirmation = (response.redirects || []).some((r) => /\/payment_done\//.test(String(r)))
    if (followedToConfirmation || isConfirmedOrder(response.status, response.headers?.location)) ordersInTest += 1
}

beforeEach(() => {
    ordersInTest = 0
    cy.intercept('POST', '/payment', (req) => {
        req.continue((res) => {
            if (isConfirmedOrder(res.statusCode, res.headers.location)) ordersInTest += 1
        })
    })
})

afterEach(() => {
    if (!ordersInTest) return
    cy.task(
        'recordOrders',
        { file: Cypress.spec.relative, titlePath: Cypress.currentTest.titlePath, count: ordersInTest },
        { log: false },
    )
})
