import { gerarCredenciais, gerarEmail } from '../../support/usuarioDeTeste'

// BUG-18 (ver BUGS.md)
// Na tela, o campo de e-mail é type="email": o navegador bloqueia formatos
// inválidos (coberto na suíte principal, em signup.cy.js). O servidor, porém,
// não valida o formato: a API e o próprio formulário de cadastro, enviado sem
// passar pelo navegador, aceitam qualquer texto como e-mail.
describe('[BUG-18] Cadastro - e-mail em formato inválido é aceito pelo servidor', () => {

    // chave = modelo em users.json > emailsInvalidos
    const casos = [
        // CT-BUGS-EMAIL-FORMAT-01
        { cenario: 'sem @', chave: 'semArroba' },
        // CT-BUGS-EMAIL-FORMAT-02
        { cenario: 'sem domínio', chave: 'semDominio' },
        // CT-BUGS-EMAIL-FORMAT-03
        { cenario: 'sem usuário', chave: 'semUsuario' },
        // CT-BUGS-EMAIL-FORMAT-04
        { cenario: 'com espaço', chave: 'comEspaco' },
        // CT-BUGS-EMAIL-FORMAT-05
        { cenario: 'com @ duplo', chave: 'arrobaDuplo' },
    ]

    // enquanto o bug existir a conta é criada de fato: apaga ao final de cada teste
    const contasCriadas = []

    afterEach(() => {
        contasCriadas.splice(0).forEach(({ email, password }) => {
            cy.apiDeleteAccount(email, password)
        })
    })

    casos.forEach(({ cenario, chave }) => {
        it(`[BUG-18] API: e-mail ${cenario} deve ser recusado com 400`, function () {
            const email = gerarEmail(this.users.emailsInvalidos[chave])
            const { password } = gerarCredenciais(this.users.contaAleatoria)

            cy.fixture('apiData').then(({ novaConta }) => {
                contasCriadas.push({ email, password })

                cy.apiCreateAccount({ ...novaConta, email, password })
                    .its('body.responseCode')
                    .should('eq', 400)
            })
        })
    })

    // CT-BUGS-EMAIL-FORMAT-06
    // Envia a 1ª etapa do cadastro como o navegador enviaria, mas sem a
    // validação do campo type="email". Só essa etapa: nenhuma conta é criada.
    it('[BUG-18] formulário de cadastro enviado sem o navegador deve recusar e-mail sem @', function () {
        const email = gerarEmail(this.users.emailsInvalidos.semArroba)

        cy.enviarSignupSemNavegador(this.users.nomeAlternativo, email).then((pagina) => {
            // a página de espera do site também não teria a 2ª etapa: não pode contar como acerto
            expect(pagina.includes('class="logo'), 'resposta é uma página do site').to.be.true
            expect(pagina.includes('Enter Account Information'), 'avançou para a 2ª etapa do cadastro').to.be.false
        })
    })
})
