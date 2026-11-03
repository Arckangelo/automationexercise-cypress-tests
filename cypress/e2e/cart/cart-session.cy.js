import { usarUsuarioDeTeste } from '../../support/usuarioDeTeste'

// O carrinho fica gravado na conta: passa do visitante para a conta no login,
// some da tela no logout e volta ao entrar de novo, inclusive em outro navegador.
describe('Carrinho entre sessões', () => {

    // conta descartável criada via API antes dos testes e removida no final
    const usuario = usarUsuarioDeTeste()

    const entrar = () => {
        cy.entrarPelaTela(usuario.email, usuario.password)
        cy.usuarioLogado().should('eq', usuario.name)
    }

    const sair = () => {
        cy.visit('/')
        cy.get('.shop-menu a[href="/logout"]').click()
        cy.url().should('include', '/login')
    }

    // cada teste começa deslogado e com o carrinho da conta vazio
    beforeEach(() => {
        cy.login(usuario.email, usuario.password)
        cy.limparCarrinho()
        cy.clearCookies()
    })

    // CT-CART-SESSION-01
    it('itens adicionados sem login continuam no carrinho depois do login', () => {
        cy.adicionarAoCarrinho('1')
        cy.itensDoCarrinho().should('deep.equal', { 1: 1 })

        entrar()

        cy.itensDoCarrinho().should('deep.equal', { 1: 1 })
    })

    // CT-CART-SESSION-02
    it('o logout esvazia o carrinho da tela e os itens voltam ao entrar de novo', () => {
        entrar()
        cy.adicionarAoCarrinho('1')
        cy.adicionarAoCarrinho('2')

        sair()
        cy.itensDoCarrinho().should('deep.equal', {})

        entrar()
        cy.itensDoCarrinho().should('deep.equal', { 1: 1, 2: 1 })
    })

    // CT-CART-SESSION-03
    // sem cookies = outro navegador: o carrinho está na conta, não na sessão
    it('o carrinho da conta aparece ao entrar em outro navegador', () => {
        entrar()
        cy.adicionarAoCarrinho('3')

        cy.clearCookies()
        cy.itensDoCarrinho().should('deep.equal', {})

        entrar()
        cy.itensDoCarrinho().should('deep.equal', { 3: 1 })
    })

    // CT-CART-SESSION-04
    // pega: carrinho do visitante descartado, ou sobrescrevendo o da conta
    it('itens do visitante são somados ao carrinho que a conta já tinha', () => {
        entrar()
        cy.adicionarAoCarrinho('2')
        sair()

        cy.adicionarAoCarrinho('2')
        cy.adicionarAoCarrinho('4')

        entrar()
        cy.itensDoCarrinho().should('deep.equal', { 2: 2, 4: 1 })
    })
})
