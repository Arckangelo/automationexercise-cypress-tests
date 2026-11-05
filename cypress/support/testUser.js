// Preenche o modelo de users.json ("qa.{id}@teste.com", "Qa@{id}") com um ID
// novo a cada chamada. Serve tanto para contas que o teste cria quanto para
// uma conta que não pode existir: um e-mail fixo poderia ser cadastrado por
// alguém no site.
//   const conta = generateCredentials(this.users.randomAccount)
const newId = () => `${Date.now()}${Cypress._.random(1000, 9999)}`

export const generateCredentials = ({ email, password }) => {
    const id = newId()
    return { email: email.replaceAll('{id}', id), password: password.replaceAll('{id}', id) }
}

// mesmo preenchimento, para um modelo de e-mail solto (ex.: users.invalidEmails)
export const generateEmail = (template) => template.replaceAll('{id}', newId())

// Provisiona um usuário descartável para o describe que chamar esta função:
// cria a conta via API antes dos testes e a remove ao final. Assim nenhuma
// credencial fica no repositório e a suíte não depende de uma conta fixa,
// que poderia ser apagada por terceiros (DELETE /api/deleteAccount é aberto).
//
// Uso:
//   const usuario = useTestUser()
//   it('...', () => { cy.login(usuario.email, usuario.password) })
//
// O objeto retornado só é preenchido no before(), por isso deve ser lido
// dentro dos testes/hooks, nunca no corpo do describe.
export const useTestUser = () => {
    const user = {}

    before(() => {
        // before() roda uma vez por describe, antes do alias @users existir
        cy.fixture('users').then(({ randomAccount }) => Object.assign(user, generateCredentials(randomAccount)))

        cy.fixture('apiData').then(({ newAccount }) => {
            user.name = newAccount.name // << expõe o nome para os testes
            cy.apiCreateAccount({ ...newAccount, email: user.email, password: user.password })
                .its('body.responseCode')
                .should('eq', 201)
        })
    })

    after(() => {
        cy.apiDeleteAccount(user.email, user.password).its('body.responseCode').should('eq', 200)
    })

    return user
}
