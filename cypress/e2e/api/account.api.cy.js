import { generateCredentials } from '../../support/testUser'

describe('API - Conta de usuário', () => {
    let newAccount = {}

    before(() => {
        cy.fixture('apiData').then((data) => {
            newAccount = data.newAccount
        })
    })

    // Cada teste usa a própria conta descartável, para que um teste que altera
    // dados (update, delete) não afete outro. Todas são removidas no afterEach,
    // mesmo se o teste falhar; 404 significa que o próprio teste já apagou.
    const createdAccounts = []

    const newAccountData = () =>
        cy.get('@users').then(({ randomAccount }) => {
            const account = { ...newAccount, ...generateCredentials(randomAccount) }
            createdAccounts.push(account)
            return account
        })

    const createAccount = () =>
        newAccountData().then((account) =>
            cy
                .apiCreateAccount(account)
                .its('body.responseCode')
                .should('eq', 201)
                .then(() => account),
        )

    afterEach(() => {
        createdAccounts.splice(0).forEach(({ email, password }) => {
            cy.apiDeleteAccount(email, password).its('body.responseCode').should('be.oneOf', [200, 404])
        })
    })

    // --- verificações de efeito ---

    const loginResponseCode = (email, password) => cy.apiVerifyLogin(email, password).its('body.responseCode')

    describe('criação', () => {
        // CT-API-ACCOUNT-01
        it('criar conta retorna 201 e a senha cadastrada passa a funcionar', { tags: ['@smoke'] }, () => {
            newAccountData().then((account) => {
                cy.apiCreateAccount(account)
                    .its('body')
                    .should('deep.equal', { responseCode: 201, message: 'User created!' })
                loginResponseCode(account.email, account.password).should('eq', 200)
            })
        })

        // CT-API-ACCOUNT-02
        it('sem o campo "name" retorna 400 e não cria a conta', () => {
            newAccountData().then(({ name, ...withoutName }) => {
                cy.apiCreateAccount(withoutName).its('body').should('deep.equal', {
                    responseCode: 400,
                    message: 'Bad request, name parameter is missing in POST request.',
                })
                loginResponseCode(withoutName.email, withoutName.password).should('eq', 404)
            })
        })

        // CT-API-ACCOUNT-03
        // um campo de cada vez; "name" está no teste anterior. title, nascimento,
        // company e address2 são opcionais (também na tela) e ficam de fora.
        // Campo enviado VAZIO é aceito: ver BUG-19.
        it('cada campo obrigatório ausente retorna 400 com o nome do campo', () => {
            const REQUIRED_FIELDS = [
                'email',
                'password',
                'firstname',
                'lastname',
                'address1',
                'country',
                'zipcode',
                'state',
                'city',
                'mobile_number',
            ]

            newAccountData().then((account) => {
                REQUIRED_FIELDS.forEach((field) => {
                    cy.apiCreateAccount(Cypress._.omit(account, field))
                        .its('body')
                        .should('deep.equal', {
                            responseCode: 400,
                            message: `Bad request, ${field} parameter is missing in POST request.`,
                        })
                })
                loginResponseCode(account.email, account.password).should('eq', 404)
            })
        })

        // CT-API-ACCOUNT-04
        // pega: duplicar a conta ou sobrescrever a senha da conta existente
        it('e-mail já cadastrado retorna 400 e mantém a conta original', () => {
            createAccount().then((original) => {
                const otherPassword = `${original.password}-outra`

                cy.apiCreateAccount({ ...original, password: otherPassword })
                    .its('body')
                    .should('deep.equal', { responseCode: 400, message: 'Email already exists!' })

                loginResponseCode(original.email, original.password).should('eq', 200)
                loginResponseCode(original.email, otherPassword).should('eq', 404)
            })
        })
    })

    describe('consulta', () => {
        // CT-API-ACCOUNT-05
        it('consulta por e-mail devolve os dados gravados no cadastro', () => {
            createAccount().then((account) => {
                cy.accountShouldBeSaved(account)
            })
        })
    })

    describe('atualização', () => {
        // CT-API-ACCOUNT-06
        it('atualizar com a senha certa altera os dados', () => {
            createAccount().then((account) => {
                const updated = { ...account, city: 'Campinas', company: 'Empresa Atualizada' }

                cy.apiUpdateAccount(updated)
                    .its('body')
                    .should('deep.equal', { responseCode: 200, message: 'User updated!' })

                cy.accountShouldBeSaved(updated)
            })
        })

        // CT-API-ACCOUNT-07
        // permissão: sem a senha certa, ninguém altera a conta de outra pessoa
        // A resposta "Account not found!" para uma conta que existe é o BUG-17 (ver BUGS.md);
        // aqui ela é checada como o contrato atual da API.
        it('atualizar com senha errada retorna 404 e não altera os dados', function () {
            createAccount().then((account) => {
                const attempt = { ...account, password: this.users.wrongPassword, city: 'Alterada Indevidamente' }

                cy.apiUpdateAccount(attempt)
                    .its('body')
                    .should('deep.equal', { responseCode: 404, message: 'Account not found!' })

                cy.accountShouldBeSaved(account)
            })
        })
    })

    describe('remoção', () => {
        // CT-API-ACCOUNT-08
        it('apagar com a senha certa remove a conta', () => {
            createAccount().then(({ email, password }) => {
                cy.apiDeleteAccount(email, password)
                    .its('body')
                    .should('deep.equal', { responseCode: 200, message: 'Account deleted!' })

                loginResponseCode(email, password).should('eq', 404)
                cy.apiGetUserDetail(email).its('body.responseCode').should('eq', 404)
            })
        })

        // CT-API-ACCOUNT-09
        // permissão: sem a senha certa, ninguém apaga a conta de outra pessoa
        it('apagar com senha errada retorna 404 e mantém a conta', function () {
            createAccount().then(({ email, password }) => {
                cy.apiDeleteAccount(email, this.users.wrongPassword)
                    .its('body')
                    .should('deep.equal', { responseCode: 404, message: 'Account not found!' })

                loginResponseCode(email, password).should('eq', 200)
            })
        })

        // CT-API-ACCOUNT-10
        // e-mail novo a cada execução: um fixo poderia ser cadastrado por alguém no site
        it('apagar conta inexistente retorna 404', function () {
            const nonexistent = generateCredentials(this.users.randomAccount)

            cy.apiDeleteAccount(nonexistent.email, nonexistent.password)
                .its('body')
                .should('deep.equal', { responseCode: 404, message: 'Account not found!' })
        })
    })
})
