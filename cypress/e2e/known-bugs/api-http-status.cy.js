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
        { method: 'POST', url: '/api/searchProduct', esperado: 400 },
    ]

    requisicoesDeErro.forEach(({ method, url, esperado }) => {
        it(`[BUG-04] ${method} ${url} deve retornar HTTP ${esperado}`, () => {
            cy.apiRequest({ method, url }).then((response) => {
                // garante que a API realmente sinaliza esse erro no corpo,
                // para o teste falhar só pelo status HTTP
                expect(response.body.responseCode, 'responseCode no corpo').to.eq(esperado)
                expect(response.status, 'status HTTP').to.eq(esperado)
            })
        })
    })

    it('[BUG-05] GET /api/productsList deve declarar Content-Type application/json', () => {
        cy.apiGetProductsList().then((response) => {
            expect(response.body.responseCode).to.eq(200)
            expect(response.headers['content-type'], 'Content-Type').to.include('application/json')
        })
    })
})
