// BUG-08, BUG-10 e BUG-11 (ver BUGS.md)
// Os três formulários mostram mensagem de sucesso, mas o JavaScript da página
// cancela o envio (return false) e nada chega ao servidor.
//
// O teste não fixa o endpoint de uma futura correção: aceita qualquer
// requisição que não seja GET para o próprio site, exceto /cdn-cgi/ (métricas
// da Cloudflare, enviadas em toda página).
//
// ATENÇÃO quando o site corrigir estes bugs: os testes passam a enviar
// mensagens, inscrições e avaliações de verdade, a cada execução do CI. Os
// dados já são marcados como teste (users.json > forms), mas ao mover estes
// testes para a suíte principal decida entre manter o envio real ou trocá-lo
// por um cy.intercept que só confere a requisição, sem deixá-la chegar ao
// servidor (ver "Dados que os testes criam" no README).
describe('[BUG-08/10/11] Formulários - mensagem de sucesso sem envio', () => {
    const recordSubmissions = () => {
        const submissions = []
        cy.intercept({ hostname: 'automationexercise.com' }, (req) => {
            if (req.method !== 'GET' && !req.url.includes('/cdn-cgi/')) {
                submissions.push(`${req.method} ${req.url}`)
            }
        })
        return submissions
    }

    const shouldHaveSubmitted = (submissions) => {
        cy.wrap(submissions, { timeout: 10000 }).should((list) => {
            expect(list, 'requisições enviadas ao site').to.have.length.greaterThan(0)
        })
    }

    // CT-BUGS-FORMS-NOT-SUBMITTED-01
    // O Cypress aceita o confirm() automaticamente, como um usuário que clica em OK.
    it('[BUG-08] Contact Us deve enviar a mensagem ao servidor', function () {
        const contact = this.users.forms.contact
        cy.visit('/contact_us')
        const submissions = recordSubmissions()

        cy.get('[data-qa="name"]').type(contact.name)
        cy.get('[data-qa="email"]').type(contact.email)
        cy.get('[data-qa="subject"]').type(contact.subject)
        cy.get('[data-qa="message"]').type(contact.message)
        cy.get('[data-qa="submit-button"]').click()

        cy.get('.contact-form .status.alert-success')
            .should('be.visible')
            .and('have.text', 'Success! Your details have been submitted successfully.')
        shouldHaveSubmitted(submissions)
    })

    // CT-BUGS-FORMS-NOT-SUBMITTED-02
    it('[BUG-10] assinatura da newsletter deve ser enviada ao servidor', function () {
        cy.visit('/')
        const submissions = recordSubmissions()

        cy.get('#susbscribe_email').type(this.users.forms.newsletter.email)
        cy.get('#subscribe').click()

        cy.get('#success-subscribe').should('be.visible').and('contain.text', 'You have been successfully subscribed!')
        shouldHaveSubmitted(submissions)
    })

    // CT-BUGS-FORMS-NOT-SUBMITTED-03
    it('[BUG-11] avaliação de produto deve ser enviada ao servidor', function () {
        const review = this.users.forms.review
        cy.visit('/product_details/1')
        const submissions = recordSubmissions()

        cy.get('#name').type(review.name)
        cy.get('#email').type(review.email)
        cy.get('#review').type(review.text)
        cy.get('#button-review').click()

        // a caixa da mensagem, não o #review-section: ele tem altura 0 (a coluna
        // interna flutua) e o Cypress trata elementos sem altura como invisíveis
        cy.get('#review-section .alert-success').should('be.visible').and('contain.text', 'Thank you for your review.')
        shouldHaveSubmitted(submissions)
    })
})
