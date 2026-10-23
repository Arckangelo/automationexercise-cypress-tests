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
    const id = `${Date.now()}${Cypress._.random(1000, 9999)}`
    usuario.email = `qa.suite.${id}@teste.com`
    usuario.password = `Qa@${id}`

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
