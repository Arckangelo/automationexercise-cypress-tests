import { gerarCredenciais, usarUsuarioDeTeste } from '../../support/usuarioDeTeste'

describe('Login', () => {

    // conta descartável criada via API antes dos testes e removida no final
    const usuario = usarUsuarioDeTeste()

    const MENSAGEM_DE_ERRO = 'Your email or password is incorrect!'

    const enviarLogin = (email, senha) => {
        cy.get('[data-qa="login-email"]').type(email)
        cy.get('[data-qa="login-password"]').type(senha, { log: false })
        cy.get('[data-qa="login-button"]').click()
    }

    const deveEstarDeslogado = () => {
        cy.get('.shop-menu a[href="/logout"]').should('not.exist')
        cy.get('.shop-menu a[href="/login"]').should('be.visible')
    }

    describe('pelo formulário', () => {

        beforeEach(() => {
            cy.visit('/login')
        })

        // CT-AUTH-LOGIN-01
        it('credenciais válidas logam o usuário certo', () => {
            enviarLogin(usuario.email, usuario.password)

            cy.usuarioLogado().should('eq', usuario.name)
        })

        // CT-AUTH-LOGIN-02
        // o erro sozinho não basta: um bug pode mostrar a mensagem e logar mesmo assim
        it('senha incorreta mostra erro e não loga', function () {
            enviarLogin(usuario.email, this.users.senhaIncorreta)

            cy.get('form[action="/login"]').contains('p', MENSAGEM_DE_ERRO).should('be.visible')
            deveEstarDeslogado()
        })

        // CT-AUTH-LOGIN-03
        // mesma mensagem da senha incorreta: o site não revela se o e-mail existe
        it('e-mail não cadastrado mostra o mesmo erro e não loga', function () {
            const naoCadastrado = gerarCredenciais(this.users.contaAleatoria)

            enviarLogin(naoCadastrado.email, naoCadastrado.password)

            cy.get('form[action="/login"]').contains('p', MENSAGEM_DE_ERRO).should('be.visible')
            deveEstarDeslogado()
        })

        // CT-AUTH-LOGIN-04
        // o navegador só bloqueia o envio enquanto os campos forem "required"
        it('campos vazios são bloqueados antes do envio', () => {
            cy.get('[data-qa="login-button"]').click()

            ;['[data-qa="login-email"]', '[data-qa="login-password"]'].forEach((campo) => {
                cy.get(campo).then(($campo) => {
                    expect($campo[0].validity.valueMissing, `${campo} obrigatório`).to.be.true
                })
            })
            deveEstarDeslogado()
        })
    })

    describe('logout', () => {

        beforeEach(() => {
            cy.login(usuario.email, usuario.password)
            cy.visit('/')
        })

        // CT-AUTH-LOGIN-05
        it('logout encerra a sessão, também após recarregar', () => {
            cy.get('.shop-menu a[href="/logout"]').click()

            cy.url().should('include', '/login')
            cy.reload()
            deveEstarDeslogado()
        })

        // CT-AUTH-LOGIN-06
        // o navegador perder o cookie não basta: a sessão tem que morrer no servidor
        it('após o logout, o cookie de sessão antigo não é mais aceito', () => {
            const usarSomenteOCookie = (valor) => {
                cy.clearCookies()
                cy.setCookie('sessionid', valor)
            }

            cy.getCookie('sessionid').should('exist').then(({ value: cookieAntigo }) => {
                // controle: antes do logout, só esse cookie já basta para estar logado
                // (sem isso, o teste passaria mesmo se o cookie nunca fosse usado)
                usarSomenteOCookie(cookieAntigo)
                cy.request('/').its('body').should('include', 'Logged in as')

                cy.visit('/')
                cy.get('.shop-menu a[href="/logout"]').click()
                cy.url().should('include', '/login')

                usarSomenteOCookie(cookieAntigo)
                cy.request('/').its('body').should('not.include', 'Logged in as')
            })
        })
    })
})
