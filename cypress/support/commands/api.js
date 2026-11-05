// Comandos da API pública do site: cy.apiRequest e um comando por endpoint
// ("api" + nome do endpoint), na ordem da lista de APIs do site.

// A API do automationexercise.com sempre responde com HTTP 200, mesmo em
// cenários de erro (método não suportado, parâmetro faltando, etc.) — quem
// diz o que realmente aconteceu é o campo "responseCode" no corpo da
// resposta. Por isso os comandos usam failOnStatusCode: false e os testes
// checam response.body.responseCode, nunca response.status.
//
// Outra pegadinha da API: ela manda o corpo como JSON, mas declara o
// header Content-Type como "text/html". O Cypress só faz o parse
// automático do corpo quando o Content-Type é "application/json", então
// sem esse ajuste response.body chegaria como STRING crua nos testes.
// cy.apiRequest() centraliza esse parse pra todos os outros comandos.
// A página de espera e a sobrecarga já são tratadas pelo cy.request.
Cypress.Commands.add('apiRequest', (options) => {
    return cy.request({ failOnStatusCode: false, ...options }).then((response) => {
        const rawBody = response.body
        let body

        if (typeof rawBody === 'string') {
            try {
                body = JSON.parse(rawBody)
            } catch (e) {
                throw new Error(
                    `Resposta inválida em ${options.method || 'GET'} ${options.url}\n` +
                        `Content-Type: ${response.headers['content-type'] || ''}\n` +
                        `Status: ${response.status}\n` +
                        `Body: ${String(rawBody).slice(0, 200)}`,
                )
            }
        } else {
            body = rawBody
        }

        if (!body || typeof body !== 'object' || !('responseCode' in body)) {
            throw new Error(
                `Resposta da API sem payload esperado em ${options.method || 'GET'} ${options.url}\n` +
                    `Content-Type: ${response.headers['content-type'] || ''}\n` +
                    `Status: ${response.status}\n` +
                    `Body: ${JSON.stringify(body || '').slice(0, 200)}`,
            )
        }

        return { ...response, body }
    })
})

Cypress.Commands.add('apiGetProductsList', () => {
    return cy.apiRequest({ method: 'GET', url: '/api/productsList' })
})

Cypress.Commands.add('apiGetBrandsList', () => {
    return cy.apiRequest({ method: 'GET', url: '/api/brandsList' })
})

Cypress.Commands.add('apiSearchProduct', (searchTerm) => {
    return cy.apiRequest({
        method: 'POST',
        url: '/api/searchProduct',
        form: true,
        // omite o campo por completo (em vez de mandar string vazia) pra
        // simular de verdade o cenário de "parâmetro ausente"
        body: searchTerm === undefined ? {} : { search_product: searchTerm },
    })
})

Cypress.Commands.add('apiVerifyLogin', (email, password) => {
    const body = {}
    if (email !== undefined) body.email = email
    if (password !== undefined) body.password = password

    return cy.apiRequest({ method: 'POST', url: '/api/verifyLogin', form: true, body })
})

Cypress.Commands.add('apiCreateAccount', (data) => {
    return cy.apiRequest({ method: 'POST', url: '/api/createAccount', form: true, body: data })
})

Cypress.Commands.add('apiUpdateAccount', (data) => {
    return cy.apiRequest({ method: 'PUT', url: '/api/updateAccount', form: true, body: data })
})

Cypress.Commands.add('apiDeleteAccount', (email, password) => {
    return cy.apiRequest({ method: 'DELETE', url: '/api/deleteAccount', form: true, body: { email, password } })
})

// Único ponto do projeto que chama este endpoint. Ele é o próprio BUG-07 (expõe
// dados sem autenticação): se o site passar a exigir login, o ajuste é só aqui.
Cypress.Commands.add('apiGetUserDetail', (email) => {
    return cy.apiRequest({ method: 'GET', url: '/api/getUserDetailByEmail', qs: { email } })
})

// A consulta devolve os dados do cadastro com 3 campos renomeados e sem a senha
// e o celular. O comando converte a conta enviada no cadastro para esse formato
// e confere que todos os campos foram gravados como enviados.
const DETAIL_FIELD_NAMES = { birth_date: 'birth_day', firstname: 'first_name', lastname: 'last_name' }
const FIELDS_NOT_IN_DETAIL = ['password', 'mobile_number']

Cypress.Commands.add('accountShouldBeSaved', (account) => {
    const expected = Cypress._.mapKeys(
        Cypress._.omit(account, FIELDS_NOT_IN_DETAIL),
        (_value, field) => DETAIL_FIELD_NAMES[field] || field,
    )

    return cy.apiGetUserDetail(account.email).then(({ body }) => {
        expect(body.responseCode, 'conta encontrada').to.eq(200)
        expect(body.user, 'dados gravados').to.include(expected)
    })
})
