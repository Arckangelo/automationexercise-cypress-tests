import { usarUsuarioDeTeste } from '../../support/usuarioDeTeste'

describe('Login', () => {

    // conta descartável criada via API antes dos testes e removida no final
    const usuario = usarUsuarioDeTeste()

    // Hook que roda antes de CADA teste (it) deste describe
    // Garante que cada teste começa do zero, na página de login
    beforeEach('Login', () => {
        cy.fixture('users').as('users')  // carrega o arquivo users.json e disponibiliza como "this.users"
        cy.visit('/login')                // visita a página de login antes de cada teste
    })

    // Teste 1: login com email e senha corretos (caminho feliz)
    it('deve logar com credenciais válidas', function () {
        cy.get('[data-qa="login-email"]').type(usuario.email)
        cy.get('[data-qa="login-password"]').type(usuario.password, { log: false })
        cy.get('[data-qa="login-button"]').click()

        // valida que o login foi bem-sucedido checando o link de logout
        // (funciona independente do idioma do navegador, ao contrário de checar texto)
        cy.get('a[href="/logout"]').should('be.visible')
    })

    // Teste 2: login com senha errada pra um email que existe
    it('não deve logar com credenciais inválidas', function () {
        cy.get('[data-qa="login-email"]').type(usuario.email)
        cy.get('[data-qa="login-password"]').type(this.users.senhaIncorreta)
        cy.get('[data-qa="login-button"]').click()

        // valida que a mensagem de erro apareceu
        cy.contains('Your email or password is incorrect!').should('be.visible')
    })

    // Teste 3: login com email que nunca foi cadastrado no sistema
    it('não deve logar com email não cadastrado', function () {
        cy.get('[data-qa="login-email"]').type(this.users.notRegisteredUser.email)
        cy.get('[data-qa="login-password"]').type(usuario.password, { log: false })
        cy.get('[data-qa="login-button"]').click()

        // mesma mensagem de erro, já que o site não diferencia "email não existe" de "senha errada"
        // (isso é uma boa prática de segurança do próprio site, evita enumeração de usuários)
        cy.contains('Your email or password is incorrect!').should('be.visible') 
    })
})