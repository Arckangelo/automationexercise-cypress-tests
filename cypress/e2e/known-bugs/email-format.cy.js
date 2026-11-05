import { generateCredentials, generateEmail } from '../../support/testUser'

// BUG-18 (ver BUGS.md)
// Na tela, o campo de e-mail é type="email": o navegador bloqueia formatos
// inválidos (coberto na suíte principal, em signup.cy.js). O servidor, porém,
// não valida o formato: a API e o próprio formulário de cadastro, enviado sem
// passar pelo navegador, aceitam qualquer texto como e-mail.
describe('[BUG-18] Cadastro - e-mail em formato inválido é aceito pelo servidor', () => {

    // chave = modelo em users.json > invalidEmails
    const cases = [
        // CT-BUGS-EMAIL-FORMAT-01
        { scenario: 'sem @', key: 'noAt' },
        // CT-BUGS-EMAIL-FORMAT-02
        { scenario: 'sem domínio', key: 'noDomain' },
        // CT-BUGS-EMAIL-FORMAT-03
        { scenario: 'sem usuário', key: 'noUser' },
        // CT-BUGS-EMAIL-FORMAT-04
        { scenario: 'com espaço', key: 'withSpace' },
        // CT-BUGS-EMAIL-FORMAT-05
        { scenario: 'com @ duplo', key: 'doubleAt' },
    ]

    // enquanto o bug existir a conta é criada de fato: apaga ao final de cada teste
    const createdAccounts = []

    afterEach(() => {
        createdAccounts.splice(0).forEach(({ email, password }) => {
            cy.apiDeleteAccount(email, password)
        })
    })

    cases.forEach(({ scenario, key }) => {
        it(`[BUG-18] API: e-mail ${scenario} deve ser recusado com 400`, function () {
            const email = generateEmail(this.users.invalidEmails[key])
            const { password } = generateCredentials(this.users.randomAccount)

            cy.fixture('apiData').then(({ newAccount }) => {
                createdAccounts.push({ email, password })

                cy.apiCreateAccount({ ...newAccount, email, password })
                    .its('body.responseCode')
                    .should('eq', 400)
            })
        })
    })

    // CT-BUGS-EMAIL-FORMAT-06
    // Envia a 1ª etapa do cadastro como o navegador enviaria, mas sem a
    // validação do campo type="email". Só essa etapa: nenhuma conta é criada.
    it('[BUG-18] formulário de cadastro enviado sem o navegador deve recusar e-mail sem @', function () {
        const email = generateEmail(this.users.invalidEmails.noAt)

        cy.submitSignupWithoutBrowser(this.users.alternativeName, email).then((page) => {
            // a página de espera do site também não teria a 2ª etapa: não pode contar como acerto
            expect(page.includes('class="logo'), 'resposta é uma página do site').to.be.true
            expect(page.includes('Enter Account Information'), 'avançou para a 2ª etapa do cadastro').to.be.false
        })
    })
})
