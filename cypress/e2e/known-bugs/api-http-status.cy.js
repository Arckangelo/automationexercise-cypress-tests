// BUG-04 e BUG-05 (ver BUGS.md)
// Os testes em cypress/e2e/api/ contornam essas falhas de propósito (checam
// responseCode no corpo e fazem o parse manual do JSON). Aqui elas são
// tratadas como o que são: violações do protocolo HTTP.
describe('[BUG-04/05] API - status HTTP e Content-Type incorretos', () => {

    // Status HTTP real esperado = responseCode que a própria API devolve no corpo
    const requisicoesDeErro = [
        { method: 'POST', url: '/api/productsList', esperado: 405 },
        { method: 'PUT', url: '/api/brandsList', esperado: 405 },
        { method: 'DELETE', url: '/api/verifyLogin', esperado: 405 },
        { method: 'POST', url: '/api/searchProduct', cenario: 'sem parâmetro', esperado: 400 },
        // a API só lê os campos do corpo do formulário; na query string eles são ignorados
        {
            method: 'POST',
            url: '/api/verifyLogin',
            qs: { email: 'qa@teste.com', password: 'qualquercoisa' },
            cenario: 'com parâmetros na query string',
            esperado: 400,
        },
    ]

    requisicoesDeErro.forEach(({ method, url, qs, cenario, esperado }) => {
        const titulo = [method, url, cenario].filter(Boolean).join(' ')

        it(`[BUG-04] ${titulo} deve retornar HTTP ${esperado}`, () => {
            cy.apiRequest({ method, url, qs }).then((response) => {
                // garante que a API realmente sinaliza esse erro no corpo,
                // para o teste falhar só pelo status HTTP
                expect(response.body.responseCode, 'responseCode no corpo').to.eq(esperado)
                expect(response.status, 'status HTTP').to.eq(esperado)
            })
        })
    })

    it('[BUG-05] GET /api/productsList deve declarar Content-Type JSON', () => {
        cy.apiGetProductsList().then((response) => {
            expect(response.body.responseCode).to.eq(200)
            expect(response.headers['content-type'], 'Content-Type').to.include('application/json')
        })
    })
})
