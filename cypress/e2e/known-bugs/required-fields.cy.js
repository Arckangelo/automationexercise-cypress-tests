import { generateCredentials } from '../../support/testUser'

// BUG-19 (ver BUGS.md)
// A API só confere se cada campo obrigatório foi ENVIADO: sem ele, responde 400
// "parameter is missing" (coberto na suíte principal, em account.api.cy.js).
// Se o campo vier vazio, a conta é criada, inclusive sem senha. O formulário da
// tela marca os campos como required, mas o servidor também não confere.
describe('[BUG-19] Cadastro - campos obrigatórios aceitam valor vazio', () => {

    const cases = [
        // CT-BUGS-REQUIRED-FIELDS-01
        // a conta sem senha faz login com a senha vazia
        { field: 'password' },
        // CT-BUGS-REQUIRED-FIELDS-02
        { field: 'name' },
        // CT-BUGS-REQUIRED-FIELDS-03
        { field: 'firstname' },
        // CT-BUGS-REQUIRED-FIELDS-04
        { field: 'city' },
    ]

    // enquanto o bug existir a conta é criada de fato: apaga ao final de cada teste
    const createdAccounts = []

    afterEach(() => {
        createdAccounts.splice(0).forEach(({ email, password }) => {
            cy.apiDeleteAccount(email, password)
        })
    })

    cases.forEach(({ field }) => {
        it(`[BUG-19] API: "${field}" vazio deve ser recusado com 400`, function () {
            const credentials = generateCredentials(this.users.randomAccount)

            cy.fixture('apiData').then(({ newAccount }) => {
                const account = { ...newAccount, ...credentials, [field]: '' }
                createdAccounts.push(account)

                cy.apiCreateAccount(account).its('body.responseCode').should('eq', 400)
            })
        })
    })

    // CT-BUGS-REQUIRED-FIELDS-05
    // Só a 1ª etapa do cadastro: nenhuma conta é criada.
    it('[BUG-19] formulário de cadastro enviado sem o navegador deve recusar nome vazio', function () {
        const { email } = generateCredentials(this.users.randomAccount)

        cy.submitSignupWithoutBrowser('', email).then((page) => {
            // a página de espera do site também não teria a 2ª etapa: não pode contar como acerto
            expect(page.includes('class="logo'), 'resposta é uma página do site').to.be.true
            expect(page.includes('Enter Account Information'), 'avançou para a 2ª etapa do cadastro').to.be.false
        })
    })
})
