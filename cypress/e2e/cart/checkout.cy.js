import { usarUsuarioDeTeste } from '../../support/usuarioDeTeste'

describe('Carrinho e Checkout', () => {

    // conta descartável criada via API antes dos testes e removida no final
    const usuario = usarUsuarioDeTeste()

    // nome e preço lidos na listagem, indexados pelo ID do produto
    let dados = {}

    beforeEach(() => {
        dados = {}

        // intercepts registrados antes de qualquer ação, para os aliases existirem quando o teste esperar por eles
        cy.intercept('GET', '/add_to_cart/*').as('adicionarAoCarrinho')
        cy.intercept('GET', '/delete_cart/*').as('removerDoCarrinho')

        cy.login(usuario.email, usuario.password)

        // setup via HTTP, sem passar pela interface (ver cypress/support/commands.js)
        cy.limparCarrinho()
    })

    // adiciona por ID e guarda nome e preço lidos na listagem
    const adicionarProdutoPorId = (id) => {
        cy.get(`a.add-to-cart[data-product-id="${id}"]`).first()
            .closest('.product-image-wrapper').within(() => {
                cy.get('.productinfo p').invoke('text').then(t => { dados[id] = { nome: t.trim() } })
                cy.get('.productinfo h2').invoke('text').then(t => { dados[id].preco = t.trim() })
                cy.get('.add-to-cart').first().click()
            })
        cy.wait('@adicionarAoCarrinho').its('response.statusCode').should('eq', 200)
    }

    // confere no carrinho a identidade, o preço e a quantidade do item
    const validarItem = (id) => {
        cy.then(() => {
            expect(dados[id].nome, 'nome capturado').to.not.be.empty
            expect(dados[id].preco, 'preço capturado').to.not.be.empty
            cy.get(`#product-${id} .cart_description h4 a`).invoke('text').should('contain', dados[id].nome)
            cy.get(`#product-${id} .cart_price p`).invoke('text').should('contain', dados[id].preco)
            cy.get(`#product-${id} .cart_quantity button`).invoke('text').should('contain', '1')
        })
    }

    it('deve adicionar produtos ao carrinho e visualizar no carrinho', () => {
        const produtosIds = ['1', '2']
        cy.visit('/products')

        adicionarProdutoPorId(produtosIds[0])
        cy.contains('Continue Shopping').click()

        adicionarProdutoPorId(produtosIds[1])
        cy.contains('View Cart').click()

        cy.url().should('include', '/view_cart')
        cy.get('#cart_info_table tbody tr').should('have.length', 2)

        validarItem(produtosIds[0])
        validarItem(produtosIds[1])
    })

    it('deve remover um produto do carrinho', () => {
    cy.visit('/products')

    adicionarProdutoPorId('1')
    cy.contains('Continue Shopping').click()
    adicionarProdutoPorId('2')
    cy.contains('View Cart').click()

    cy.get('#cart_info_table tbody tr').should('have.length', 2)
    validarItem('1')
    validarItem('2')

    // remove o primeiro: o que sobrou tem que ser exatamente o outro
    cy.get('#product-1 .cart_quantity_delete').click()
    cy.wait('@removerDoCarrinho').its('response.statusCode').should('eq', 200)

    cy.get('#cart_info_table tbody tr').should('have.length', 1)
    validarItem('2')                       // mata "removeu o item errado"
    cy.get('#product-1').should('not.exist') // mata "removeu só visualmente"

    // remove o último e valida o estado vazio por completo
    cy.get('#product-2 .cart_quantity_delete').click()
    cy.wait('@removerDoCarrinho').its('response.statusCode').should('eq', 200)

    cy.get('#cart_info_table tbody tr').should('have.length', 0)  // mata "escondeu mas não removeu"
    cy.get('#empty_cart').should('be.visible')
    cy.contains('Cart is empty!').should('be.visible')
    })

  it('deve avançar para o checkout quando logado', () => {
    cy.visit('/products')

    adicionarProdutoPorId('1')
    cy.contains('View Cart').click()

    cy.get('.check_out').click()

    cy.url().should('include', '/checkout')

    // valida que a página de checkout carregou de fato, não só que a URL mudou
    cy.contains('Address Details').should('be.visible')
    cy.contains('Review Your Order').should('be.visible')

    // o resumo tem que conter o MESMO produto, não só os headings
    validarItem('1')

    // validação de endereço: o box de entrega tem que conter os dados do usuário logado
    cy.get('#address_delivery').should('contain', usuario.name)

    cy.fixture('apiData').then(({ novaConta }) => {
        cy.get('#address_delivery')
            .should('contain', novaConta.address1)
            .should('contain', novaConta.city)
            .should('contain', novaConta.zipcode)
            .should('contain', novaConta.country)
    })

    // fecha o fluxo: Place Order tem que levar ao pagamento
    cy.contains('Place Order').click()
    cy.url().should('include', '/payment')
    })
})