import { gerarCredenciais } from '../../support/usuarioDeTeste'

describe('API - Conta de usuário', () => {

    let novaConta = {}

    before(() => {
        cy.fixture('apiData').then((dados) => { novaConta = dados.novaConta })
    })

    // Cada teste usa a própria conta descartável, para que um teste que altera
    // dados (update, delete) não afete outro. Todas são removidas no afterEach,
    // mesmo se o teste falhar; 404 significa que o próprio teste já apagou.
    const contasCriadas = []

    const novosDados = () =>
        cy.get('@users').then(({ contaAleatoria }) => {
            const conta = { ...novaConta, ...gerarCredenciais(contaAleatoria) }
            contasCriadas.push(conta)
            return conta
        })

    const criarConta = () =>
        novosDados().then((conta) =>
            cy.apiCreateAccount(conta).its('body.responseCode').should('eq', 201).then(() => conta))

    afterEach(() => {
        contasCriadas.splice(0).forEach(({ email, password }) => {
            cy.apiDeleteAccount(email, password).its('body.responseCode').should('be.oneOf', [200, 404])
        })
    })

    // --- verificações de efeito ---

    const credenciaisValidas = (email, password) => cy.apiVerifyLogin(email, password).its('body.responseCode')

    describe('criação', () => {

        it('criar conta retorna 201 e a senha cadastrada passa a funcionar', () => {
            novosDados().then((conta) => {
                cy.apiCreateAccount(conta).its('body').should('deep.equal', { responseCode: 201, message: 'User created!' })
                credenciaisValidas(conta.email, conta.password).should('eq', 200)
            })
        })

        it('sem o campo "name" retorna 400 e não cria a conta', () => {
            novosDados().then(({ name, ...semNome }) => {
                cy.apiCreateAccount(semNome).its('body').should('deep.equal', {
                    responseCode: 400,
                    message: 'Bad request, name parameter is missing in POST request.',
                })
                credenciaisValidas(semNome.email, semNome.password).should('eq', 404)
            })
        })

        // pega: duplicar a conta ou sobrescrever a senha da conta existente
        it('e-mail já cadastrado retorna 400 e mantém a conta original', () => {
            criarConta().then((original) => {
                const outraSenha = `${original.password}-outra`

                cy.apiCreateAccount({ ...original, password: outraSenha })
                    .its('body').should('deep.equal', { responseCode: 400, message: 'Email already exists!' })

                credenciaisValidas(original.email, original.password).should('eq', 200)
                credenciaisValidas(original.email, outraSenha).should('eq', 404)
            })
        })
    })

    describe('consulta', () => {

        it('consulta por e-mail devolve os dados gravados no cadastro', () => {
            criarConta().then((conta) => {
                cy.contaDeveEstarGravada(conta)
            })
        })
    })

    describe('atualização', () => {

        it('atualizar com a senha certa altera os dados', () => {
            criarConta().then((conta) => {
                const atualizada = { ...conta, city: 'Campinas', company: 'Empresa Atualizada' }

                cy.apiUpdateAccount(atualizada)
                    .its('body').should('deep.equal', { responseCode: 200, message: 'User updated!' })

                cy.contaDeveEstarGravada(atualizada)
            })
        })

        // permissão: sem a senha certa, ninguém altera a conta de outra pessoa
        // A resposta "Account not found!" para uma conta que existe é o BUG-17 (ver BUGS.md);
        // aqui ela é checada como o contrato atual da API.
        it('atualizar com senha errada retorna 404 e não altera os dados', function () {
            criarConta().then((conta) => {
                const tentativa = { ...conta, password: this.users.senhaIncorreta, city: 'Alterada Indevidamente' }

                cy.apiUpdateAccount(tentativa)
                    .its('body').should('deep.equal', { responseCode: 404, message: 'Account not found!' })

                cy.contaDeveEstarGravada(conta)
            })
        })
    })

    describe('remoção', () => {

        it('apagar com a senha certa remove a conta', () => {
            criarConta().then(({ email, password }) => {
                cy.apiDeleteAccount(email, password)
                    .its('body').should('deep.equal', { responseCode: 200, message: 'Account deleted!' })

                credenciaisValidas(email, password).should('eq', 404)
                cy.apiGetUserDetail(email).its('body.responseCode').should('eq', 404)
            })
        })

        // permissão: sem a senha certa, ninguém apaga a conta de outra pessoa
        it('apagar com senha errada retorna 404 e mantém a conta', function () {
            criarConta().then(({ email, password }) => {
                cy.apiDeleteAccount(email, this.users.senhaIncorreta)
                    .its('body').should('deep.equal', { responseCode: 404, message: 'Account not found!' })

                credenciaisValidas(email, password).should('eq', 200)
            })
        })

        // e-mail novo a cada execução: um fixo poderia ser cadastrado por alguém no site
        it('apagar conta inexistente retorna 404', function () {
            const inexistente = gerarCredenciais(this.users.contaAleatoria)

            cy.apiDeleteAccount(inexistente.email, inexistente.password)
                .its('body').should('deep.equal', { responseCode: 404, message: 'Account not found!' })
        })
    })
})
