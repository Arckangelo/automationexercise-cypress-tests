import { usarUsuarioDeTeste } from '../../support/usuarioDeTeste'

describe('Cadastro de usuário', () => {

    describe('novo usuário', () => {

        // e-mail único por execução; a mesma conta é reaproveitada se o teste for repetido (retries)
        const id = `${Date.now()}${Cypress._.random(1000, 9999)}`
        const email = `qa.signup.${id}@teste.com`
        const senha = `Qa@${id}`

        // mesmos dados do cadastro via API; o país muda porque "Brazil" não existe no select
        let dados = {}

        before(() => {
            cy.fixture('apiData').then(({ novaConta }) => {
                dados = { ...novaConta, country: 'Canada', address2: 'Apto 45' }
            })
        })

        // remove a conta mesmo se o teste falhar no meio; 404 = nem chegou a ser criada
        afterEach(() => {
            cy.apiDeleteAccount(email, senha)
                .its('body.responseCode')
                .should('be.oneOf', [200, 404])
        })

        it('cadastro completo cria a conta com os dados informados', () => {
            cy.visit('/login')
            cy.get('[data-qa="signup-name"]').type(dados.name)
            cy.get('[data-qa="signup-email"]').type(email)
            cy.get('[data-qa="signup-button"]').click()

            cy.get('[data-qa="create-account"]').should('be.visible')

            cy.get('#id_gender1').check()
            cy.get('[data-qa="password"]').type(senha, { log: false })
            cy.get('[data-qa="days"]').select(dados.birth_date)
            cy.get('[data-qa="months"]').select(dados.birth_month)
            cy.get('[data-qa="years"]').select(dados.birth_year)
            cy.get('#newsletter').check()
            cy.get('#optin').check()

            cy.get('[data-qa="first_name"]').type(dados.firstname)
            cy.get('[data-qa="last_name"]').type(dados.lastname)
            cy.get('[data-qa="company"]').type(dados.company)
            cy.get('[data-qa="address"]').type(dados.address1)
            cy.get('[data-qa="address2"]').type(dados.address2)
            cy.get('[data-qa="country"]').select(dados.country)
            cy.get('[data-qa="state"]').type(dados.state)
            cy.get('[data-qa="city"]').type(dados.city)
            cy.get('[data-qa="zipcode"]').type(dados.zipcode)
            cy.get('[data-qa="mobile_number"]').type(dados.mobile_number)
            cy.get('[data-qa="create-account"]').click()

            cy.get('[data-qa="account-created"]').should('be.visible')
            cy.get('[data-qa="continue-button"]').click()
            cy.get('.shop-menu a:has(.fa-user) b').invoke('text').invoke('trim').should('eq', dados.name)

            // persistência: a senha cadastrada funciona e os dados foram gravados como digitados
            cy.apiVerifyLogin(email, senha).its('body.responseCode').should('eq', 200)

            cy.apiRequest({ method: 'GET', url: '/api/getUserDetailByEmail', qs: { email } })
                .its('body.user')
                .should('include', {
                    name: dados.name,
                    title: 'Mr',
                    birth_day: dados.birth_date,
                    birth_month: dados.birth_month,
                    birth_year: dados.birth_year,
                    first_name: dados.firstname,
                    last_name: dados.lastname,
                    company: dados.company,
                    address1: dados.address1,
                    address2: dados.address2,
                    country: dados.country,
                    state: dados.state,
                    city: dados.city,
                    zipcode: dados.zipcode,
                })
        })
    })

    describe('e-mail já cadastrado', () => {

        // conta criada via API: o teste não depende do cadastro pela tela
        const existente = usarUsuarioDeTeste()

        it('e-mail já cadastrado mostra erro e não avança para o formulário completo', () => {
            cy.visit('/login')
            cy.get('[data-qa="signup-name"]').type('Outro Nome')
            cy.get('[data-qa="signup-email"]').type(existente.email)
            cy.get('[data-qa="signup-button"]').click()

            cy.get('form[action="/signup"]').contains('p', 'Email Address already exist!').should('be.visible')
            cy.get('[data-qa="create-account"]').should('not.exist')
        })
    })
})
