import { useCatalog } from '../../support/catalog'
import { useTestUser } from '../../support/testUser'

// Só o primeiro teste adiciona produto pela interface. Os demais montam o
// carrinho por HTTP, para que uma falha no botão "Add to cart" não derrube
// testes que verificam outra coisa (remoção, checkout, endereço).
describe('Carrinho e Checkout', () => {
    // conta descartável criada via API antes dos testes e removida no final
    const user = useTestUser()

    // nome e preço de cada produto vêm da API (fonte controlada),
    // não da mesma tela que está sendo testada
    const catalog = useCatalog()
    let account = {}

    before(() => {
        cy.fixture('apiData').then(({ newAccount }) => {
            account = newAccount
        })
    })

    beforeEach(() => {
        cy.intercept('GET', '/add_to_cart/*').as('addToCart')
        cy.intercept('GET', '/delete_cart/*').as('removeFromCart')
    })

    // --- helpers ---

    const rupeesToNumber = (text) => Number(text.replace(/\D/g, ''))

    // confere nome, preço, quantidade e total da linha do produto
    const assertCartItem = (id, quantity = 1) => {
        const { name, price } = catalog.product(id)
        const total = `Rs. ${rupeesToNumber(price) * quantity}`

        cy.get(`#product-${id}`).within(() => {
            cy.textOf('.cart_description h4 a').should('eq', name)
            cy.textOf('.cart_price p').should('eq', price)
            cy.textOf('.cart_quantity button').should('eq', String(quantity))
            cy.textOf('.cart_total_price').should('eq', total)
        })
    }

    const cartRows = () => cy.get('.cart_quantity_delete')

    describe('Carrinho (logado)', () => {
        beforeEach(() => {
            cy.login(user.email, user.password)
            cy.clearCart()
        })

        // CT-CART-CHECKOUT-01
        // pega: preço do item diferente do catálogo (mutante M01)
        it('adicionar pela listagem mostra o produto no carrinho', () => {
            cy.visit('/products')
            cy.get('.productinfo a.add-to-cart[data-product-id="1"]').click()
            cy.wait('@addToCart').its('response.statusCode').should('eq', 200)

            cy.get('#cartModal a[href="/view_cart"]').click()

            cartRows().should('have.length', 1)
            assertCartItem('1')
        })

        // CT-CART-CHECKOUT-02
        // pega: linha duplicada, quantidade sobrescrita em vez de somada, total errado (mutante M02)
        it('adicionar o mesmo produto duas vezes soma quantidade e total', () => {
            cy.addToCart('1')
            cy.addToCart('1')
            cy.visit('/view_cart')

            cartRows().should('have.length', 1)
            assertCartItem('1', 2)
        })

        // CT-CART-CHECKOUT-03
        // o cart.js apaga a linha da tela com qualquer resposta 200; só o
        // reload prova que o servidor removeu o item de fato
        it('remover um item mantém os demais no servidor', () => {
            cy.addToCart('1')
            cy.addToCart('2')
            cy.visit('/view_cart')
            cartRows().should('have.length', 2)

            cy.get('#product-1 .cart_quantity_delete').click()
            cy.wait('@removeFromCart').its('response.statusCode').should('eq', 200)

            cy.reload()
            cy.get('#product-1').should('not.exist')
            cartRows().should('have.length', 1)
            assertCartItem('2')
        })

        // CT-CART-CHECKOUT-04
        it('remover o último item deixa o carrinho vazio no servidor', () => {
            cy.addToCart('1')
            cy.visit('/view_cart')

            cy.get('#product-1 .cart_quantity_delete').click()
            cy.wait('@removeFromCart').its('response.statusCode').should('eq', 200)

            cy.reload()
            cartRows().should('not.exist')
            cy.get('#empty_cart').should('be.visible')
        })

        // CT-CART-CHECKOUT-05
        it('carrinho vazio não oferece o botão de checkout', () => {
            cy.visit('/view_cart')

            cy.get('#empty_cart').should('be.visible')
            cy.get('.check_out').should('not.exist')
        })
    })

    describe('Checkout (logado)', () => {
        beforeEach(() => {
            cy.login(user.email, user.password)
            cy.clearCart()
        })

        // CT-CART-CHECKOUT-06
        it('Proceed To Checkout leva à página de checkout', () => {
            cy.addToCart('1')
            cy.visit('/view_cart')

            cy.get('.check_out').click()

            cy.url().should('include', '/checkout')
            cy.get('#address_delivery').should('be.visible')
        })

        // CT-CART-CHECKOUT-07
        it('checkout mostra os itens e o total do pedido', () => {
            cy.addToCart('1')
            cy.addToCart('2')
            cy.visit('/checkout')

            assertCartItem('1')
            assertCartItem('2')

            const expectedTotal = rupeesToNumber(catalog.product(1).price) + rupeesToNumber(catalog.product(2).price)
            cy.contains('tr', 'Total Amount').within(() => {
                cy.textOf('.cart_total_price').should('eq', `Rs. ${expectedTotal}`)
            })
        })

        // CT-CART-CHECKOUT-08
        // compara cada linha do endereço com o campo certo do cadastro
        // (antes comparava com "name", que só batia por coincidência)
        // pega: endereço de entrega diferente do cadastro (mutante M06)
        it('checkout mostra o endereço cadastrado do usuário', () => {
            cy.addToCart('1')
            cy.visit('/checkout')

            ;['#address_delivery', '#address_invoice'].forEach((box) => {
                cy.get(box).within(() => {
                    cy.textOf('.address_firstname').should(
                        'eq',
                        `${account.title}. ${account.firstname} ${account.lastname}`,
                    )
                    cy.get('.address_address1').should('contain', account.address1)
                    cy.get('.address_city')
                        .should('contain', account.city)
                        .and('contain', account.state)
                        .and('contain', account.zipcode)
                    cy.textOf('.address_country_name').should('eq', account.country)
                    cy.textOf('.address_phone').should('eq', account.mobile_number)
                })
            })
        })

        // CT-CART-CHECKOUT-09
        // cartão fictício: o site é de prática e não processa pagamentos
        // pega: fatura com valor diferente do pedido (mutante M07)
        it(
            'compra completa: o pagamento confirma o pedido, a fatura traz o total e o carrinho esvazia',
            { tags: ['@smoke', '@creates-order'] },
            function () {
                cy.addToCart('1')
                cy.addToCart('2')
                cy.visit('/checkout')

                cy.get('a[href="/payment"]').click()
                cy.url().should('include', '/payment')
                cy.pay(this.users.cards.valid)

                const total = rupeesToNumber(catalog.product(1).price) + rupeesToNumber(catalog.product(2).price)
                cy.get('[data-qa="order-placed"]').should('be.visible')
                cy.url().should('include', `/payment_done/${total}`)

                // a fatura é do pedido (valor) e da conta (nome), não do nome digitado no cartão
                cy.get(`a[href="/download_invoice/${total}"]`).should('be.visible')
                cy.request(`/download_invoice/${total}`)
                    .its('body')
                    .should(
                        'eq',
                        `Hi ${account.firstname} ${account.lastname}, Your total purchase amount is ${total}. Thank you`,
                    )

                // o pedido consome o carrinho, também no servidor
                cy.visit('/view_cart')
                cartRows().should('not.exist')
                cy.get('#empty_cart').should('be.visible')
            },
        )
    })

    describe('Checkout (sem login)', () => {
        // CT-CART-CHECKOUT-10
        // sem cy.login: cada teste começa com sessão nova (testIsolation)
        it('Proceed To Checkout pede login em vez de avançar', () => {
            cy.addToCart('1')
            cy.visit('/view_cart')

            cy.get('.check_out').click()

            cy.get('#checkoutModal').should('be.visible').find('a[href="/login"]').should('be.visible')
            cy.url().should('include', '/view_cart')
        })
    })
})
