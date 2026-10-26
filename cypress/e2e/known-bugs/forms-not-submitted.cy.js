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

    // O Cypress aceita o confirm() automaticamente, como um usuário que clica em OK.
    it('[BUG-08] Contact Us deve enviar a mensagem ao servidor', () => {
        cy.visit('/contact_us')
        const envios = registrarEnvios()

        cy.get('[data-qa="name"]').type('QA Automatizado')
        cy.get('[data-qa="email"]').type('qa.contato@teste.com')
        cy.get('[data-qa="subject"]').type('Teste de regressão')
        cy.get('[data-qa="message"]').type('Mensagem de teste do BUG-08.')
        cy.get('[data-qa="submit-button"]').click()

        cy.get('.contact-form .status.alert-success')
            .should('be.visible')
            .and('have.text', 'Success! Your details have been submitted successfully.')
        deveTerEnviado(envios)
    })

    it('[BUG-10] assinatura da newsletter deve ser enviada ao servidor', () => {
        cy.visit('/')
        const envios = registrarEnvios()

        cy.get('#susbscribe_email').type('qa.newsletter@teste.com')
        cy.get('#subscribe').click()

        cy.get('#success-subscribe')
            .should('be.visible')
            .and('contain.text', 'You have been successfully subscribed!')
        deveTerEnviado(envios)
    })

    it('[BUG-11] avaliação de produto deve ser enviada ao servidor', () => {
        cy.visit('/product_details/1')
        const envios = registrarEnvios()

        cy.get('#name').type('QA Automatizado')
        cy.get('#email').type('qa.avaliacao@teste.com')
        cy.get('#review').type('Avaliação de teste do BUG-11.')
        cy.get('#button-review').click()

        // a caixa da mensagem, não o #review-section: ele tem altura 0 (a coluna
        // interna flutua) e o Cypress trata elementos sem altura como invisíveis
        cy.get('#review-section .alert-success')
            .should('be.visible')
            .and('contain.text', 'Thank you for your review.')
        deveTerEnviado(envios)
    })
})
