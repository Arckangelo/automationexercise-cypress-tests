import { generateCredentials, useTestUser } from '../../support/testUser'

describe('Login', () => {
    // conta descartável criada via API antes dos testes e removida no final
    const user = useTestUser()

    const ERROR_MESSAGE = 'Your email or password is incorrect!'

    const submitLogin = (email, password) => {
        cy.get('[data-qa="login-email"]').type(email)
        cy.get('[data-qa="login-password"]').type(password, { log: false })
        cy.get('[data-qa="login-button"]').click()
    }

    const shouldBeLoggedOut = () => {
        cy.get('.shop-menu a[href="/logout"]').should('not.exist')
        cy.get('.shop-menu a[href="/login"]').should('be.visible')
    }

    describe('pelo formulário', () => {
        beforeEach(() => {
            cy.visit('/login')
        })

        // CT-AUTH-LOGIN-01
        it('credenciais válidas logam o usuário certo', () => {
            submitLogin(user.email, user.password)

            cy.loggedInUser().should('eq', user.name)
        })

        // CT-AUTH-LOGIN-02
        // o erro sozinho não basta: um bug pode mostrar a mensagem e logar mesmo assim
        it('senha incorreta mostra erro e não loga', function () {
            submitLogin(user.email, this.users.wrongPassword)

            cy.get('form[action="/login"]').contains('p', ERROR_MESSAGE).should('be.visible')
            shouldBeLoggedOut()
        })

        // CT-AUTH-LOGIN-03
        // mesma mensagem da senha incorreta: o site não revela se o e-mail existe
        it('e-mail não cadastrado mostra o mesmo erro e não loga', function () {
            const unregistered = generateCredentials(this.users.randomAccount)

            submitLogin(unregistered.email, unregistered.password)

            cy.get('form[action="/login"]').contains('p', ERROR_MESSAGE).should('be.visible')
            shouldBeLoggedOut()
        })

        // CT-AUTH-LOGIN-04
        // o navegador só bloqueia o envio enquanto os campos forem "required"
        it('campos vazios são bloqueados antes do envio', () => {
            cy.get('[data-qa="login-button"]').click()

            ;['[data-qa="login-email"]', '[data-qa="login-password"]'].forEach((field) => {
                cy.get(field).then(($field) => {
                    expect($field[0].validity.valueMissing, `${field} obrigatório`).to.be.true
                })
            })
            shouldBeLoggedOut()
        })
    })

    describe('logout', () => {
        beforeEach(() => {
            cy.login(user.email, user.password)
            cy.visit('/')
        })

        // CT-AUTH-LOGIN-05
        it('logout encerra a sessão, também após recarregar', () => {
            cy.get('.shop-menu a[href="/logout"]').click()

            cy.url().should('include', '/login')
            cy.reload()
            shouldBeLoggedOut()
        })

        // CT-AUTH-LOGIN-06
        // o navegador perder o cookie não basta: a sessão tem que morrer no servidor
        it('após o logout, o cookie de sessão antigo não é mais aceito', () => {
            const useOnlyCookie = (value) => {
                cy.clearCookies()
                cy.setCookie('sessionid', value)
            }

            cy.getCookie('sessionid')
                .should('exist')
                .then(({ value: oldCookie }) => {
                    // controle: antes do logout, só esse cookie já basta para estar logado
                    // (sem isso, o teste passaria mesmo se o cookie nunca fosse usado)
                    useOnlyCookie(oldCookie)
                    cy.request('/').its('body').should('include', 'Logged in as')

                    cy.visit('/')
                    cy.get('.shop-menu a[href="/logout"]').click()
                    cy.url().should('include', '/login')

                    useOnlyCookie(oldCookie)
                    cy.request('/').its('body').should('not.include', 'Logged in as')
                })
        })
    })
})
