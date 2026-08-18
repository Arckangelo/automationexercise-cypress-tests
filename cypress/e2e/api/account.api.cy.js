describe('API - Conta de usuário', () => {

    beforeEach(() => {
        cy.fixture('apiData').as('apiData')
    })

    // Fluxo completo com uma conta descartável: cria, confirma que existe e
    // remove no mesmo teste — o e-mail leva o timestamp pra nunca colidir
    // com uma execução anterior, e a conta sempre é apagada no final, sem
    // deixar lixo cadastrado no site.
    it('deve criar, consultar e remover uma conta', function () {
        const email = `qa.automatizado.${Date.now()}@teste.com`
        const password = 'Teste@123'
        const dadosConta = { ...this.apiData.novaConta, email, password }

        cy.apiCreateAccount(dadosConta).then((response) => {
            expect(response.body.responseCode).to.eq(201)
            expect(response.body.message).to.eq('User created!')
        })

        cy.request({
            method: 'GET',
            url: '/api/getUserDetailByEmail',
            qs: { email },
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.body.responseCode).to.eq(200)
            expect(response.body.user.email).to.eq(email)
            expect(response.body.user.name).to.eq(dadosConta.name)
        })

        cy.apiDeleteAccount(email, password).then((response) => {
            expect(response.body.responseCode).to.eq(200)
            expect(response.body.message).to.eq('Account deleted!')
        })
    })

    it('deve retornar 400 ao criar conta sem o campo obrigatório "name"', function () {
        const { name, ...dadosSemNome } = this.apiData.novaConta
        const dados = { ...dadosSemNome, email: `qa.invalido.${Date.now()}@teste.com`, password: 'Teste@123' }

        cy.apiCreateAccount(dados).then((response) => {
            expect(response.body.responseCode).to.eq(400)
            expect(response.body.message).to.eq('Bad request, name parameter is missing in POST request.')
        })
    })

    it('deve retornar 404 ao tentar remover uma conta que não existe', () => {
        cy.apiDeleteAccount('conta_que_nao_existe_999@teste.com', 'qualquercoisa').then((response) => {
            expect(response.body.responseCode).to.eq(404)
            expect(response.body.message).to.eq('Account not found!')
        })
    })
})
