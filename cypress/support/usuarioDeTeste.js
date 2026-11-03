// Preenche o modelo de users.json ("qa.{id}@teste.com", "Qa@{id}") com um ID
// novo a cada chamada. Serve tanto para contas que o teste cria quanto para
// uma conta que não pode existir: um e-mail fixo poderia ser cadastrado por
// alguém no site.
//   const conta = gerarCredenciais(this.users.contaAleatoria)
const novoId = () => `${Date.now()}${Cypress._.random(1000, 9999)}`

export const gerarCredenciais = ({ email, password }) => {
    const id = novoId()
    return { email: email.replaceAll('{id}', id), password: password.replaceAll('{id}', id) }
}

// mesmo preenchimento, para um modelo de e-mail solto (ex.: users.emailsInvalidos)
export const gerarEmail = (modelo) => modelo.replaceAll('{id}', novoId())

// Provisiona um usuário descartável para o describe que chamar esta função:
// cria a conta via API antes dos testes e a remove ao final. Assim nenhuma
// credencial fica no repositório e a suíte não depende de uma conta fixa,
// que poderia ser apagada por terceiros (DELETE /api/deleteAccount é aberto).
//
// Uso:
//   const usuario = usarUsuarioDeTeste()
//   it('...', () => { cy.login(usuario.email, usuario.password) })
//
// O objeto retornado só é preenchido no before(), por isso deve ser lido
// dentro dos testes/hooks, nunca no corpo do describe.
export const usarUsuarioDeTeste = () => {
    const usuario = {}

    before(() => {
    // before() roda uma vez por describe, antes do alias @users existir
    cy.fixture('users').then(({ contaAleatoria }) => Object.assign(usuario, gerarCredenciais(contaAleatoria)))

    cy.fixture('apiData').then(({ novaConta }) => {
        usuario.name = novaConta.name   // << expõe o nome para os testes
        cy.apiCreateAccount({ ...novaConta, email: usuario.email, password: usuario.password })
            .its('body.responseCode')
            .should('eq', 201)
    })
})

    after(() => {
        cy.apiDeleteAccount(usuario.email, usuario.password)
            .its('body.responseCode')
            .should('eq', 200)
    })

    return usuario
}
