// BUG-01 e BUG-02 (ver BUGS.md)
// Testes de regressão: descrevem o comportamento esperado e FALHAM enquanto
// o bug existir. Passarão a passar quando o site validar a quantidade.
describe('[BUG-01/02] Carrinho - quantidade inválida', () => {

    beforeEach(() => {
        cy.intercept('GET', '/add_to_cart/*').as('addToCart')
    })

    // Cada teste começa com sessão nova (testIsolation), portanto com o
    // carrinho vazio — não é preciso limpar nada antes.
    const addWithQuantity = (quantity) => {
        cy.visit('/product_details/1')
        cy.get('#quantity').clear().type(quantity)
        cy.get('button.cart').click()
        cy.wait('@addToCart')
        cy.visit('/view_cart')
    }

    // Uma correção válida pode tanto recusar o item (carrinho vazio) quanto
    // ajustá-lo para 1, então a checagem não exige que haja linhas na tabela:
    // exige apenas que nenhuma quantidade seja menor ou igual a zero nem total negativo.
    const assertCart = () => {
        cy.get('#cart_items').then(($cart) => {
            const quantities = $cart.find('.cart_quantity button').toArray()
                .map((el) => Number(el.textContent.trim()))
            const totals = $cart.find('.cart_total_price').toArray()
                .map((el) => el.textContent.trim())

            quantities.forEach((quantity) => {
                expect(quantity, 'quantidade no carrinho').to.be.greaterThan(0)
            })
            totals.forEach((total) => {
                expect(total, 'total do item').to.not.include('-')
            })
        })
    }

    // CT-BUGS-CART-QUANTITY-01
    // O input até declara min="1" no HTML, mas nem o front-end nem o
    // servidor aplicam a regra: GET /add_to_cart/1?quantity=-3 é aceito.
    it('[BUG-01] não deve aceitar quantidade negativa (-3)', () => {
        addWithQuantity('-3')
        assertCart()
    })

    // CT-BUGS-CART-QUANTITY-02
    it('[BUG-02] não deve aceitar quantidade zero (0)', () => {
        addWithQuantity('0')
        assertCart()
    })
})

// BUG-09 (ver BUGS.md)
// O campo é type="number" sem step, então o navegador deixa o usuário apagar o
// valor ou digitar decimal e notação científica. O cart.js repassa o texto sem
// validar e o servidor quebra (HTTP 500, página de debug do Django), enquanto
// a tela não mostra nem o aviso "Added" nem um erro.
describe('[BUG-09] Carrinho - quantidade não inteira derruba o servidor', () => {

    beforeEach(() => {
        cy.intercept('GET', '/add_to_cart/*').as('addToCart')
    })

    const inputs = [
        // CT-BUGS-CART-QUANTITY-03
        { scenario: 'campo vazio', value: '' },
        // CT-BUGS-CART-QUANTITY-04
        { scenario: 'decimal (2.5)', value: '2.5' },
        // CT-BUGS-CART-QUANTITY-05
        { scenario: 'notação científica (1e2)', value: '1e2' },
    ]

    inputs.forEach(({ scenario, value }) => {
        it(`[BUG-09] ${scenario} não deve gerar erro 500`, () => {
            cy.visit('/product_details/5')
            cy.get('#quantity').clear()
            if (value) cy.get('#quantity').type(value)
            cy.get('button.cart').click()

            cy.wait('@addToCart').then(({ response }) => {
                expect(response.statusCode, 'status HTTP de /add_to_cart').to.be.lessThan(500)
            })
        })
    })
})
