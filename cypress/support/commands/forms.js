// Formulários enviados como o navegador enviaria, mas sem a validação dos campos
// na tela (type="email", required): mostram o que o servidor aceita por conta própria.

// Envia a 1ª etapa do cadastro (/login -> /signup) como o navegador enviaria, mas
// sem a validação dos campos na tela (type="email", required). Devolve o HTML da resposta.
Cypress.Commands.add('submitSignupWithoutBrowser', (name, email) => {
    return cy
        .request('/login')
        .then(({ body }) => {
            const token = Cypress.$(body).find('form[action="/signup"] [name="csrfmiddlewaretoken"]').val()
            expect(token, 'formulário de cadastro carregado').to.be.a('string').and.not.be.empty

            return cy.request({
                method: 'POST',
                url: '/signup',
                form: true,
                headers: { referer: `${Cypress.config('baseUrl')}/login` },
                body: { csrfmiddlewaretoken: token, name, email, form_type: 'signup' },
            })
        })
        .its('body')
})

// Envia o formulário de /payment como o navegador enviaria, mas sem a validação
// dos campos (required). Não segue o redirecionamento: devolve a resposta do POST.
Cypress.Commands.add('submitPaymentWithoutBrowser', (card) => {
    return cy.request('/payment').then(({ body }) => {
        const token = Cypress.$(body).find('#payment-form [name="csrfmiddlewaretoken"]').val()
        // sem o formulário (ex.: página de espera do site) o POST daria 403 e o teste passaria sem motivo
        expect(token, 'formulário de pagamento carregado').to.be.a('string').and.not.be.empty

        return cy.request({
            method: 'POST',
            url: '/payment',
            form: true,
            followRedirect: false,
            headers: { referer: `${Cypress.config('baseUrl')}/payment` },
            body: {
                csrfmiddlewaretoken: token,
                name_on_card: card.name,
                card_number: card.number,
                cvc: card.cvc,
                expiry_month: card.month,
                expiry_year: card.year,
            },
        })
    })
})
