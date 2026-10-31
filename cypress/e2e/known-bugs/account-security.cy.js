// BUG-06, BUG-07 e BUG-17 (ver BUGS.md)
// Cada teste cria a própria conta descartável via API. A remoção fica num
// afterEach que não exige sucesso: enquanto o BUG-06 existir, a conta já terá
// sido apagada pelo próprio teste.
describe('[BUG-06/07/17] Conta - exclusão por GET, dados pessoais expostos e erro de senha', () => {

    const conta = {}

    beforeEach(() => {
        const id = `${Date.now()}${Cypress._.random(1000, 9999)}`
        conta.email = `qa.bugs.${id}@teste.com`
        conta.password = `Qa@${id}`

        cy.fixture('apiData').then(({ novaConta }) => {
            cy.apiCreateAccount({ ...novaConta, email: conta.email, password: conta.password })
                .its('body.responseCode')
                .should('eq', 201)
        })
    })

    afterEach(() => {
        cy.apiDeleteAccount(conta.email, conta.password)
    })

    // Uma ação destrutiva por GET, sem confirmação nem token CSRF, pode ser
    // disparada por um simples link: quem estiver logado perde a conta.
    it('[BUG-06] GET /delete_account não deve excluir a conta sem confirmação', () => {
        cy.login(conta.email, conta.password)

        cy.request('/delete_account')

        cy.apiVerifyLogin(conta.email, conta.password).then((response) => {
            expect(response.body.responseCode, 'a conta deve continuar existindo').to.eq(200)
        })
    })

    // O endpoint é documentado na lista de APIs do site, e account.api.cy.js
    // o usa como contrato. Se o site passar a exigir autenticação, aquele
    // teste da suíte principal precisará ser ajustado junto com este.
    it('[BUG-07] GET /api/getUserDetailByEmail não deve expor dados pessoais sem autenticação', () => {
        cy.apiRequest({ method: 'GET', url: '/api/getUserDetailByEmail', qs: { email: conta.email } })
            .then((response) => {
                expect(response.body, 'dados pessoais na resposta sem autenticação').to.not.have.property('user')
            })
    })

    // A conta existe; o erro é de credencial, não de recurso inexistente.
    it('[BUG-17] PUT /api/updateAccount com senha errada deve retornar 401, não "Account not found!"', () => {
        cy.fixture('apiData').then(({ novaConta }) => {
            const tentativa = { ...novaConta, email: conta.email, password: 'senhaErrada', city: 'Alterada Indevidamente' }

            cy.apiRequest({ method: 'PUT', url: '/api/updateAccount', form: true, body: tentativa })
                .its('body')
                .then((body) => {
                    expect(body.message, 'mensagem de erro').to.not.eq('Account not found!')
                    expect(body.responseCode, 'responseCode').to.eq(401)
                })

            // a correção não pode passar a aceitar a alteração
            cy.apiRequest({ method: 'GET', url: '/api/getUserDetailByEmail', qs: { email: conta.email } })
                .its('body.user.city')
                .should('eq', novaConta.city)
        })
    })
})
