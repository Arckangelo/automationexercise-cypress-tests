import { usarUsuarioDeTeste } from '../../support/usuarioDeTeste'

// Só o primeiro teste adiciona produto pela interface. Os demais montam o
// carrinho por HTTP, para que uma falha no botão "Add to cart" não derrube
// testes que verificam outra coisa (remoção, checkout, endereço).
describe('Carrinho e Checkout', () => {

    // conta descartável criada via API antes dos testes e removida no final
    const usuario = usarUsuarioDeTeste()

    // nome e preço de cada produto vêm da API (fonte controlada),
    // não da mesma tela que está sendo testada
    let produtos = {}
    let conta = {}

    before(() => {
        cy.apiGetProductsList().then(({ body }) => {
            produtos = Cypress._.keyBy(body.products, 'id')
        })
        cy.fixture('apiData').then(({ novaConta }) => { conta = novaConta })
    })

    beforeEach(() => {
        cy.intercept('GET', '/add_to_cart/*').as('adicionarAoCarrinho')
        cy.intercept('GET', '/delete_cart/*').as('removerDoCarrinho')
    })

    // --- helpers ---

    const adicionarViaHttp = (id) => {
        cy.request(`/add_to_cart/${id}`).its('status').should('eq', 200)
    }

    const valorEmRupias = (texto) => Number(texto.replace(/\D/g, ''))

    // texto exato da célula, sem espaços nas pontas
    const textoDe = (seletor) => cy.get(seletor).invoke('text').invoke('trim')

    // confere nome, preço, quantidade e total da linha do produto
    const validarItem = (id, quantidade = 1) => {
        const { name, price } = produtos[id]
        const total = `Rs. ${valorEmRupias(price) * quantidade}`

        cy.get(`#product-${id}`).within(() => {
            textoDe('.cart_description h4 a').should('eq', name)
            textoDe('.cart_price p').should('eq', price)
            textoDe('.cart_quantity button').should('eq', String(quantidade))
            textoDe('.cart_total_price').should('eq', total)
        })
    }

    const linhasDoCarrinho = () => cy.get('.cart_quantity_delete')

    describe('Carrinho (logado)', () => {

        beforeEach(() => {
            cy.login(usuario.email, usuario.password)
            cy.limparCarrinho()
        })

        it('adicionar pela listagem mostra o produto no carrinho', () => {
            cy.visit('/products')
            cy.get('.productinfo a.add-to-cart[data-product-id="1"]').click()
            cy.wait('@adicionarAoCarrinho').its('response.statusCode').should('eq', 200)

            cy.get('#cartModal a[href="/view_cart"]').click()

            linhasDoCarrinho().should('have.length', 1)
            validarItem('1')
        })

        // pega: linha duplicada, quantidade sobrescrita em vez de somada, total errado
        it('adicionar o mesmo produto duas vezes soma quantidade e total', () => {
            adicionarViaHttp('1')
            adicionarViaHttp('1')
            cy.visit('/view_cart')

            linhasDoCarrinho().should('have.length', 1)
            validarItem('1', 2)
        })

        // o cart.js apaga a linha da tela com qualquer resposta 200; só o
        // reload prova que o servidor removeu o item de fato
        it('remover um item mantém os demais no servidor', () => {
            adicionarViaHttp('1')
            adicionarViaHttp('2')
            cy.visit('/view_cart')
            linhasDoCarrinho().should('have.length', 2)

            cy.get('#product-1 .cart_quantity_delete').click()
            cy.wait('@removerDoCarrinho').its('response.statusCode').should('eq', 200)

            cy.reload()
            cy.get('#product-1').should('not.exist')
            linhasDoCarrinho().should('have.length', 1)
            validarItem('2')
        })

        it('remover o último item deixa o carrinho vazio no servidor', () => {
            adicionarViaHttp('1')
            cy.visit('/view_cart')

            cy.get('#product-1 .cart_quantity_delete').click()
            cy.wait('@removerDoCarrinho').its('response.statusCode').should('eq', 200)

            cy.reload()
            linhasDoCarrinho().should('not.exist')
            cy.get('#empty_cart').should('be.visible')
        })

        it('carrinho vazio não oferece o botão de checkout', () => {
            cy.visit('/view_cart')

            cy.get('#empty_cart').should('be.visible')
            cy.get('.check_out').should('not.exist')
        })
    })

    describe('Checkout (logado)', () => {

        beforeEach(() => {
            cy.login(usuario.email, usuario.password)
            cy.limparCarrinho()
        })

        it('Proceed To Checkout leva à página de checkout', () => {
            adicionarViaHttp('1')
            cy.visit('/view_cart')

            cy.get('.check_out').click()

            cy.url().should('include', '/checkout')
            cy.get('#address_delivery').should('be.visible')
        })

        it('checkout mostra os itens e o total do pedido', () => {
            adicionarViaHttp('1')
            adicionarViaHttp('2')
            cy.visit('/checkout')

            validarItem('1')
            validarItem('2')

            const totalEsperado = valorEmRupias(produtos['1'].price) + valorEmRupias(produtos['2'].price)
            cy.contains('tr', 'Total Amount').find('.cart_total_price')
                .invoke('text').invoke('trim')
                .should('eq', `Rs. ${totalEsperado}`)
        })

        // compara cada linha do endereço com o campo certo do cadastro
        // (antes comparava com "name", que só batia por coincidência)
        it('checkout mostra o endereço cadastrado do usuário', () => {
            adicionarViaHttp('1')
            cy.visit('/checkout')

            ;['#address_delivery', '#address_invoice'].forEach((caixa) => {
                cy.get(caixa).within(() => {
                    textoDe('.address_firstname').should('eq', `${conta.title}. ${conta.firstname} ${conta.lastname}`)
                    cy.get('.address_address1').should('contain', conta.address1)
                    cy.get('.address_city')
                        .should('contain', conta.city)
                        .and('contain', conta.state)
                        .and('contain', conta.zipcode)
                    textoDe('.address_country_name').should('eq', conta.country)
                    textoDe('.address_phone').should('eq', conta.mobile_number)
                })
            })
        })

        it('Place Order leva ao formulário de pagamento', () => {
            adicionarViaHttp('1')
            cy.visit('/checkout')

            cy.get('a[href="/payment"]').click()

            cy.url().should('include', '/payment')
            cy.get('[data-qa="pay-button"]').should('be.visible')
        })
    })

    describe('Checkout (sem login)', () => {

        // sem cy.login: cada teste começa com sessão nova (testIsolation)
        it('Proceed To Checkout pede login em vez de avançar', () => {
            adicionarViaHttp('1')
            cy.visit('/view_cart')

            cy.get('.check_out').click()

            cy.get('#checkoutModal').should('be.visible')
                .find('a[href="/login"]').should('be.visible')
            cy.url().should('include', '/view_cart')
        })
    })
})
