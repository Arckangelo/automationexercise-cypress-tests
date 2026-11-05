import { generateCredentials, generateEmail, useTestUser } from '../../support/testUser'

describe('Cadastro de usuário', () => {
    describe('novo usuário', () => {
        // e-mail único por execução; a mesma conta é reaproveitada se o teste for repetido (retries)
        let account

        // mesmos dados do cadastro via API; o país muda porque "Brazil" não existe no select
        let data = {}

        before(() => {
            cy.fixture('apiData').then(({ newAccount }) => {
                data = { ...newAccount, country: 'Canada', address2: 'Apto 45' }
            })
        })

        beforeEach(function () {
            if (!account) account = generateCredentials(this.users.randomAccount)
        })

        // remove a conta mesmo se o teste falhar no meio; 404 = nem chegou a ser criada
        afterEach(() => {
            cy.apiDeleteAccount(account.email, account.password).its('body.responseCode').should('be.oneOf', [200, 404])
        })

        // CT-AUTH-SIGNUP-01
        it('cadastro completo cria a conta com os dados informados', { tags: ['@smoke'] }, () => {
            cy.visit('/login')
            cy.get('[data-qa="signup-name"]').type(data.name)
            cy.get('[data-qa="signup-email"]').type(account.email)
            cy.get('[data-qa="signup-button"]').click()

            cy.get('[data-qa="create-account"]').should('be.visible')

            cy.get('#id_gender1').check()
            cy.get('[data-qa="password"]').type(account.password, { log: false })
            cy.get('[data-qa="days"]').select(data.birth_date)
            cy.get('[data-qa="months"]').select(data.birth_month)
            cy.get('[data-qa="years"]').select(data.birth_year)
            cy.get('#newsletter').check()
            cy.get('#optin').check()

            cy.get('[data-qa="first_name"]').type(data.firstname)
            cy.get('[data-qa="last_name"]').type(data.lastname)
            cy.get('[data-qa="company"]').type(data.company)
            cy.get('[data-qa="address"]').type(data.address1)
            cy.get('[data-qa="address2"]').type(data.address2)
            cy.get('[data-qa="country"]').select(data.country)
            cy.get('[data-qa="state"]').type(data.state)
            cy.get('[data-qa="city"]').type(data.city)
            cy.get('[data-qa="zipcode"]').type(data.zipcode)
            cy.get('[data-qa="mobile_number"]').type(data.mobile_number)
            cy.get('[data-qa="create-account"]').click()

            cy.get('[data-qa="account-created"]').should('be.visible')
            cy.get('[data-qa="continue-button"]').click()
            cy.loggedInUser().should('eq', data.name)

            // persistência: a senha cadastrada funciona e os dados foram gravados como digitados
            cy.apiVerifyLogin(account.email, account.password).its('body.responseCode').should('eq', 200)

            cy.accountShouldBeSaved({ ...data, email: account.email })
        })
    })

    describe('e-mail já cadastrado', () => {
        // conta criada via API: o teste não depende do cadastro pela tela
        const existing = useTestUser()

        // CT-AUTH-SIGNUP-02
        it('e-mail já cadastrado mostra erro e não avança para o formulário completo', function () {
            cy.visit('/login')
            cy.get('[data-qa="signup-name"]').type(this.users.alternativeName)
            cy.get('[data-qa="signup-email"]').type(existing.email)
            cy.get('[data-qa="signup-button"]').click()

            cy.get('form[action="/signup"]').contains('p', 'Email Address already exist!').should('be.visible')
            cy.get('[data-qa="create-account"]').should('not.exist')
        })
    })

    describe('e-mail em formato inválido', () => {
        // CT-AUTH-SIGNUP-03
        // O campo é type="email": o navegador recusa o formato antes do envio.
        // O servidor não valida (BUG-18), então esta é a única barreira hoje.
        it('e-mail em formato inválido é bloqueado antes do envio', function () {
            cy.intercept('POST', '/signup').as('signup')
            cy.visit('/login')
            cy.get('[data-qa="signup-name"]').type(this.users.alternativeName)

            // "withSpace" fica de fora: o navegador remove o espaço ao digitar e o
            // e-mail que sobra é válido (o envio é correto)
            Object.values(Cypress._.omit(this.users.invalidEmails, 'withSpace')).forEach((template) => {
                const email = generateEmail(template)
                cy.get('[data-qa="signup-email"]').clear().type(email)
                cy.get('[data-qa="signup-button"]').click()

                cy.get('[data-qa="signup-email"]').then(($field) => {
                    expect($field[0].validity.typeMismatch, `"${email}" recusado pelo navegador`).to.be.true
                })
            })

            cy.url().should('include', '/login')
            cy.get('[data-qa="create-account"]').should('not.exist')
            cy.get('@signup.all').should('have.length', 0)
        })
    })
})
