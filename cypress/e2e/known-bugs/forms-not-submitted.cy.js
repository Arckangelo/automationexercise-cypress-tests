// BUG-08, BUG-10 e BUG-11 (ver BUGS.md)
// Os três formulários mostram mensagem de sucesso, mas o JavaScript da página
// cancela o envio (return false) e nada chega ao servidor.
//
// O teste não fixa o endpoint de uma futura correção: aceita qualquer
// requisição que não seja GET para o próprio site, exceto /cdn-cgi/ (métricas
// da Cloudflare, enviadas em toda página).
describe('[BUG-08/10/11] Formulários - mensagem de sucesso sem envio', () => {

    const registrarEnvios = () => {
        const envios = []
        cy.intercept({ hostname: 'automationexercise.com' }, (req) => {
            if (req.method !== 'GET' && !req.url.includes('/cdn-cgi/')) {
                envios.push(`${req.method} ${req.url}`)
            }
        })
        return envios
    }

    const deveTerEnviado = (envios) => {
        cy.wrap(envios, { timeout: 10000 }).should((lista) => {
            expect(lista, 'requisições enviadas ao site').to.have.length.greaterThan(0)
        })
    }

    // CT-BUGS-FORMS-NOT-SUBMITTED-01
    // O Cypress aceita o confirm() automaticamente, como um usuário que clica em OK.
    it('[BUG-08] Contact Us deve enviar a mensagem ao servidor', function () {
        const contato = this.users.formularios.contato
        cy.visit('/contact_us')
        const envios = registrarEnvios()

        cy.get('[data-qa="name"]').type(contato.nome)
        cy.get('[data-qa="email"]').type(contato.email)
        cy.get('[data-qa="subject"]').type(contato.assunto)
        cy.get('[data-qa="message"]').type(contato.mensagem)
        cy.get('[data-qa="submit-button"]').click()

        cy.get('.contact-form .status.alert-success')
            .should('be.visible')
            .and('have.text', 'Success! Your details have been submitted successfully.')
        deveTerEnviado(envios)
    })

    // CT-BUGS-FORMS-NOT-SUBMITTED-02
    it('[BUG-10] assinatura da newsletter deve ser enviada ao servidor', function () {
        cy.visit('/')
        const envios = registrarEnvios()

        cy.get('#susbscribe_email').type(this.users.formularios.newsletter.email)
        cy.get('#subscribe').click()

        cy.get('#success-subscribe')
            .should('be.visible')
            .and('contain.text', 'You have been successfully subscribed!')
        deveTerEnviado(envios)
    })

    // CT-BUGS-FORMS-NOT-SUBMITTED-03
    it('[BUG-11] avaliação de produto deve ser enviada ao servidor', function () {
        const avaliacao = this.users.formularios.avaliacao
        cy.visit('/product_details/1')
        const envios = registrarEnvios()

        cy.get('#name').type(avaliacao.nome)
        cy.get('#email').type(avaliacao.email)
        cy.get('#review').type(avaliacao.texto)
        cy.get('#button-review').click()

        // a caixa da mensagem, não o #review-section: ele tem altura 0 (a coluna
        // interna flutua) e o Cypress trata elementos sem altura como invisíveis
        cy.get('#review-section .alert-success')
            .should('be.visible')
            .and('contain.text', 'Thank you for your review.')
        deveTerEnviado(envios)
    })
})
