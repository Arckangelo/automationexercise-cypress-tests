import { usarUsuarioDeTeste } from '../../support/usuarioDeTeste'

// BUG-20 (ver BUGS.md)
// O formulário de pagamento só tem "required" nos campos: nem a tela nem o
// servidor conferem o cartão. Qualquer texto confirma o pedido ("Order Placed!"),
// inclusive pela própria tela, sem contornar nada. Os cartões vêm de
// users.json > cartoes; o site é de prática e não processa pagamentos.
describe('[BUG-20] Pagamento - dados de cartão inválidos confirmam o pedido', () => {

    const usuario = usarUsuarioDeTeste()

    beforeEach(() => {
        cy.login(usuario.email, usuario.password)
        cy.limparCarrinho()
        cy.adicionarAoCarrinho('1')
        cy.intercept('POST', '/payment').as('pagar')
    })

    const naoDeveConfirmar = (response) => {
        expect(response.headers.location || '', 'redireciona para a confirmação do pedido').to.not.include('payment_done')
    }

    const casos = [
        // CT-BUGS-PAYMENT-VALIDATION-01
        { cenario: 'número do cartão com letras', cartao: 'numeroComLetras' },
        // CT-BUGS-PAYMENT-VALIDATION-02
        { cenario: 'cartão vencido (01/2000)', cartao: 'vencido' },
        // CT-BUGS-PAYMENT-VALIDATION-03
        { cenario: 'mês 13 e CVC com letras', cartao: 'formatoInvalido' },
    ]

    casos.forEach(({ cenario, cartao }) => {
        it(`[BUG-20] ${cenario} não deve confirmar o pedido`, function () {
            cy.visit('/payment')
            cy.pagar(this.users.cartoes[cartao])

            cy.wait('@pagar').then(({ response }) => naoDeveConfirmar(response))
        })
    })

    // CT-BUGS-PAYMENT-VALIDATION-04
    // Na tela o "required" impede o envio vazio; o servidor não confere.
    it('[BUG-20] campos do cartão vazios (enviados sem o navegador) não devem confirmar o pedido', function () {
        cy.enviarPagamentoSemNavegador(this.users.cartoes.vazio).then(naoDeveConfirmar)
    })
})
