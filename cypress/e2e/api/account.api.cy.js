describe('API - Conta de usuário', () => {

    let novaConta = {}

    before(() => {
        cy.fixture('apiData').then((dados) => { novaConta = dados.novaConta })
    })

    // Cada teste usa a própria conta descartável, para que um teste que altera
    // dados (update, delete) não afete outro. Todas são removidas no afterEach,
    // mesmo se o teste falhar; 404 significa que o próprio teste já apagou.
    const contasCriadas = []

    const novosDados = () => {
        const id = `${Date.now()}${Cypress._.random(1000, 9999)}`
        const conta = { ...novaConta, email: `qa.api.${id}@teste.com`, password: `Qa@${id}` }
        contasCriadas.push(conta)
        return conta
    }

    const criarConta = () => {
        const conta = novosDados()
        return cy.apiCreateAccount(conta).its('body.responseCode').should('eq', 201).then(() => conta)
    }

    afterEach(() => {
        contasCriadas.splice(0).forEach(({ email, password }) => {
            cy.apiDeleteAccount(email, password).its('body.responseCode').should('be.oneOf', [200, 404])
        })
    })

    // --- verificações de efeito ---

    const credenciaisValidas = (email, password) => cy.apiVerifyLogin(email, password).its('body.responseCode')

    const dadosGravados = (email) =>
        cy.apiRequest({ method: 'GET', url: '/api/getUserDetailByEmail', qs: { email } })

    // nomes dos campos na resposta da consulta (diferentes dos do cadastro)
    const comoGravado = (conta) => ({
        name: conta.name,
        email: conta.email,
        title: conta.title,
        birth_day: conta.birth_date,
        birth_month: conta.birth_month,
        birth_year: conta.birth_year,
        first_name: conta.firstname,
        last_name: conta.lastname,
        company: conta.company,
        address1: conta.address1,
        address2: conta.address2,
        country: conta.country,
        state: conta.state,
        city: conta.city,
        zipcode: conta.zipcode,
    })

    describe('criação', () => {

        it('criar conta retorna 201 e a senha cadastrada passa a funcionar', () => {
            const conta = novosDados()

            cy.apiCreateAccount(conta).its('body').should('deep.equal', { responseCode: 201, message: 'User created!' })
            credenciaisValidas(conta.email, conta.password).should('eq', 200)
        })

        it('sem o campo "name" retorna 400 e não cria a conta', () => {
            const { name, ...semNome } = novosDados()

            cy.apiCreateAccount(semNome).its('body').should('deep.equal', {
                responseCode: 400,
                message: 'Bad request, name parameter is missing in POST request.',
            })
            credenciaisValidas(semNome.email, semNome.password).should('eq', 404)
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
                dadosGravados(conta.email).then(({ body }) => {
                    expect(body.responseCode).to.eq(200)
                    expect(body.user).to.include(comoGravado(conta))
                })
            })
        })
    })

    describe('atualização', () => {

        it('atualizar com a senha certa altera os dados', () => {
            criarConta().then((conta) => {
                const atualizada = { ...conta, city: 'Campinas', company: 'Empresa Atualizada' }

                cy.apiRequest({ method: 'PUT', url: '/api/updateAccount', form: true, body: atualizada })
                    .its('body').should('deep.equal', { responseCode: 200, message: 'User updated!' })

                dadosGravados(conta.email).its('body.user').should('include', comoGravado(atualizada))
            })
        })

        // permissão: sem a senha certa, ninguém altera a conta de outra pessoa
        it('atualizar com senha errada retorna 404 e não altera os dados', () => {
            criarConta().then((conta) => {
                const tentativa = { ...conta, password: 'senhaErrada', city: 'Alterada Indevidamente' }

                cy.apiRequest({ method: 'PUT', url: '/api/updateAccount', form: true, body: tentativa })
                    .its('body').should('deep.equal', { responseCode: 404, message: 'Account not found!' })

                dadosGravados(conta.email).its('body.user').should('include', comoGravado(conta))
            })
        })
    })

    describe('remoção', () => {

        it('apagar com a senha certa remove a conta', () => {
            criarConta().then(({ email, password }) => {
                cy.apiDeleteAccount(email, password)
                    .its('body').should('deep.equal', { responseCode: 200, message: 'Account deleted!' })

                credenciaisValidas(email, password).should('eq', 404)
                dadosGravados(email).its('body.responseCode').should('eq', 404)
            })
        })

        // permissão: sem a senha certa, ninguém apaga a conta de outra pessoa
        it('apagar com senha errada retorna 404 e mantém a conta', () => {
            criarConta().then(({ email, password }) => {
                cy.apiDeleteAccount(email, 'senhaErrada')
                    .its('body').should('deep.equal', { responseCode: 404, message: 'Account not found!' })

                credenciaisValidas(email, password).should('eq', 200)
            })
        })

        it('apagar conta inexistente retorna 404', () => {
            cy.apiDeleteAccount('conta_que_nao_existe_999@teste.com', 'qualquercoisa')
                .its('body').should('deep.equal', { responseCode: 404, message: 'Account not found!' })
        })
    })
})
