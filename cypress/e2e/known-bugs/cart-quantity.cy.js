// BUG-01 e BUG-02 (ver BUGS.md)
// Testes de regressão: descrevem o comportamento esperado e FALHAM enquanto
// o bug existir. Passarão a passar quando o site validar a quantidade.
describe('[BUG-01/02] Carrinho - quantidade inválida', () => {

    beforeEach(() => {
        cy.intercept('GET', '/add_to_cart/*').as('adicionarAoCarrinho')
    })

    // Cada teste começa com sessão nova (testIsolation), portanto com o
    // carrinho vazio — não é preciso limpar nada antes.
    const adicionarComQuantidade = (quantidade) => {
        cy.visit('/product_details/1')
        cy.get('#quantity').clear().type(quantidade)
        cy.get('button.cart').click()
        cy.wait('@adicionarAoCarrinho')
        cy.visit('/view_cart')
    }

    // Uma correção válida pode tanto recusar o item (carrinho vazio) quanto
    // ajustá-lo para 1, então a checagem não exige que haja linhas na tabela:
    // exige apenas que nenhuma quantidade seja menor ou igual a zero nem total negativo.
    const validarCarrinho = () => {
        cy.get('#cart_items').then(($carrinho) => {
            const quantidades = $carrinho.find('.cart_quantity button').toArray()
                .map((el) => Number(el.textContent.trim()))
            const totais = $carrinho.find('.cart_total_price').toArray()
                .map((el) => el.textContent.trim())

            quantidades.forEach((quantidade) => {
                expect(quantidade, 'quantidade no carrinho').to.be.greaterThan(0)
            })
            totais.forEach((total) => {
                expect(total, 'total do item').to.not.include('-')
            })
        })
    }

    // O input até declara min="1" no HTML, mas nem o front-end nem o
    // servidor aplicam a regra: GET /add_to_cart/1?quantity=-3 é aceito.
    it('[BUG-01] não deve aceitar quantidade negativa (-3)', () => {
        adicionarComQuantidade('-3')
        validarCarrinho()
    })

    it('[BUG-02] não deve aceitar quantidade zero (0)', () => {
        adicionarComQuantidade('0')
        validarCarrinho()
    })
})
