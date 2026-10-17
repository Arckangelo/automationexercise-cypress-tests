// BUG-06 e BUG-07 (ver BUGS.md)
// Cada teste cria a própria conta descartável via API. A remoção fica num
// afterEach que não exige sucesso: enquanto o BUG-06 existir, a conta já terá
// sido apagada pelo próprio teste.
describe('[BUG-06/07] Conta - exclusão por GET e dados pessoais expostos', () => {

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
})
