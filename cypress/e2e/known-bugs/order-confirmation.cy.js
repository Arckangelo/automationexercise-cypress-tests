// BUG-16 (ver BUGS.md)
// A confirmação do pedido e a fatura são montadas a partir do valor na URL,
// sem sessão e sem pedido registrado: qualquer pessoa gera um "comprovante"
// de qualquer valor. Os testes só fazem GET; nenhum pedido é enviado.
describe('[BUG-16] Pedido - confirmação e fatura geradas pela URL', () => {

    // valor que nenhum pedido de teste teria
    const VALOR_FORJADO = 999999

    it('[BUG-16] /download_invoice/<valor> não deve emitir fatura sem pedido nem sessão', () => {
        cy.request({ url: `/download_invoice/${VALOR_FORJADO}`, failOnStatusCode: false }).then((response) => {
            expect(response.body, 'fatura emitida com o valor da URL')
                .to.not.include(`Your total purchase amount is ${VALOR_FORJADO}`)
        })
    })

    it('[BUG-16] /payment_done/<valor> não deve confirmar pedido sem pagamento nem sessão', () => {
        cy.visit(`/payment_done/${VALOR_FORJADO}`, { failOnStatusCode: false })
        cy.get('[data-qa="order-placed"]').should('not.exist')
    })
})
