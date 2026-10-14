describe('Cadastro de usuário', () => {

    // gera um email único a cada execução, evitando conflito de "email já existe"
    const randomEmail = `teste_qa_${Date.now()}@teste.com`
    const senha = 'Senha123!'

    // remove a conta criada pelo teste via API, mesmo se o teste falhar no meio,
    // para não deixar contas de teste acumuladas no site (mesmo padrão autolimpo
    // do account.api.cy.js); 404 significa que a conta nem chegou a ser criada
    afterEach(() => {
        cy.apiDeleteAccount(randomEmail, senha)
            .its('body.responseCode')
            .should('be.oneOf', [200, 404])
    })

    it('deve cadastrar um novo usuário com sucesso', () => {
        const nome = 'Angelo Teste'

        cy.visit('/login')

        // ---- Parte 1: Signup inicial (nome + email) ----
        cy.get('[data-qa="signup-name"]').type(nome)
        cy.get('[data-qa="signup-email"]').type(randomEmail)
        cy.get('[data-qa="signup-button"]').click()

        // valida que foi redirecionado pra tela de "Enter Account Information"
        cy.url().should('include', '/signup')
        cy.contains('Enter Account Information', { timeout: 10000 }).should('be.visible')

        // ---- Parte 2: Preencher informações da conta ----

        // título (Mr/Mrs) - radio button
        cy.get('#id_gender1').click()

        // senha
        cy.get('#password').type(senha)

        // data de nascimento
        cy.get('#days').select('15')
        cy.get('#months').select('5')
        cy.get('#years').select('1995')

        // checkboxes opcionais
        cy.get('#newsletter').click()
        cy.get('#optin').click()

        // ---- Parte 3: Informações de endereço ----
        cy.get('#first_name').type('Angelo')
        cy.get('#last_name').type('Teste')
        cy.get('#company').type('QA Company')
        cy.get('#address1').type('Rua dos Testes, 123')
        cy.get('#address2').type('Apto 45')
        cy.get('#country').select('United States')
        cy.get('#state').type('Goiás')
        cy.get('#city').type('Anápolis')
        cy.get('#zipcode').type('75000-000')
        cy.get('#mobile_number').type('62999999999')

        // ---- Parte 4: Criar conta ----
        cy.get('[data-qa="create-account"]').click()

        // valida mensagem de sucesso
        cy.contains('Account Created!').should('be.visible')

        // continua pra próxima tela
        cy.contains('Continue').click()

        // valida que está logado (mesmo seletor robusto que usamos no login)
        cy.get('a[href="/logout"]').should('be.visible')
    })
})