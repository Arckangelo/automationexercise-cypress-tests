import { useTestUser } from '../../support/testUser'

// BUG-20 (ver BUGS.md)
// O formulário de pagamento só tem "required" nos campos: nem a tela nem o
// servidor conferem o cartão. Qualquer texto confirma o pedido ("Order Placed!"),
// inclusive pela própria tela, sem contornar nada. Os cartões vêm de
// users.json > cards; o site é de prática e não processa pagamentos.
describe('[BUG-20] Pagamento - dados de cartão inválidos confirmam o pedido', { tags: ['@creates-order'] }, () => {
    const user = useTestUser()

    beforeEach(() => {
        cy.login(user.email, user.password)
        cy.clearCart()
        cy.addToCart('1')
        cy.intercept('POST', '/payment').as('pay')
    })

    const shouldNotConfirm = (response) => {
        expect(response.headers.location || '', 'redireciona para a confirmação do pedido').to.not.include(
            'payment_done',
        )
    }

    const cases = [
        // CT-BUGS-PAYMENT-VALIDATION-01
        { scenario: 'número do cartão com letras', card: 'numberWithLetters' },
        // CT-BUGS-PAYMENT-VALIDATION-02
        { scenario: 'cartão vencido (01/2000)', card: 'expired' },
        // CT-BUGS-PAYMENT-VALIDATION-03
        { scenario: 'mês 13 e CVC com letras', card: 'invalidFormat' },
    ]

    cases.forEach(({ scenario, card }) => {
        it(`[BUG-20] ${scenario} não deve confirmar o pedido`, function () {
            cy.visit('/payment')
            cy.pay(this.users.cards[card])

            cy.wait('@pay').then(({ response }) => shouldNotConfirm(response))
        })
    })

    // CT-BUGS-PAYMENT-VALIDATION-04
    // Na tela o "required" impede o envio vazio; o servidor não confere.
    it('[BUG-20] campos do cartão vazios (enviados sem o navegador) não devem confirmar o pedido', function () {
        cy.submitPaymentWithoutBrowser(this.users.cards.empty).then(shouldNotConfirm)
    })
})
