import { gerarCredenciais } from '../../support/usuarioDeTeste'

// BUG-04 e BUG-05 (ver BUGS.md)
// Os testes em cypress/e2e/api/ contornam essas falhas de propósito (checam
// responseCode no corpo e fazem o parse manual do JSON). Aqui elas são
// tratadas como o que são: violações do protocolo HTTP.
describe('[BUG-04/05] API - status HTTP e Content-Type incorretos', () => {

    // Status HTTP real esperado = responseCode que a própria API devolve no corpo
    const requisicoesDeErro = [
        // CT-BUGS-API-HTTP-STATUS-01
        { method: 'POST', url: '/api/productsList', esperado: 405 },
        // CT-BUGS-API-HTTP-STATUS-02
        { method: 'PUT', url: '/api/brandsList', esperado: 405 },
        // CT-BUGS-API-HTTP-STATUS-03
        { method: 'DELETE', url: '/api/verifyLogin', esperado: 405 },
        // CT-BUGS-API-HTTP-STATUS-04
        { method: 'POST', url: '/api/searchProduct', cenario: 'sem parâmetro', esperado: 400 },
        // CT-BUGS-API-HTTP-STATUS-05
        // a API só lê os campos do corpo do formulário; na query string eles são ignorados
        {
            method: 'POST',
            url: '/api/verifyLogin',
            credenciaisNaQuery: true,
            cenario: 'com parâmetros na query string',
            esperado: 400,
        },
    ]

    requisicoesDeErro.forEach(({ method, url, credenciaisNaQuery, cenario, esperado }) => {
        const titulo = [method, url, cenario].filter(Boolean).join(' ')

        it(`[BUG-04] ${titulo} deve retornar HTTP ${esperado}`, function () {
            const qs = credenciaisNaQuery ? gerarCredenciais(this.users.contaAleatoria) : undefined

            cy.apiRequest({ method, url, qs }).then((response) => {
                // garante que a API realmente sinaliza esse erro no corpo,
                // para o teste falhar só pelo status HTTP
                expect(response.body.responseCode, 'responseCode no corpo').to.eq(esperado)
                expect(response.status, 'status HTTP').to.eq(esperado)
            })
        })
    })

    // CT-BUGS-API-HTTP-STATUS-06
    // Só o PATCH recebe um 405 de verdade, mas no formato padrão do framework
    // ({"detail": ...}), sem o responseCode que todas as outras respostas têm.
    it('[BUG-04] PATCH /api/verifyLogin deve responder no formato da API (com responseCode)', () => {
        cy.request({ method: 'PATCH', url: '/api/verifyLogin', failOnStatusCode: false }).then(({ status, body }) => {
            expect(status, 'status HTTP').to.eq(405)
            expect(body, 'corpo').to.have.property('responseCode', 405)
        })
    })

    // CT-BUGS-API-HTTP-STATUS-07
    // O cabeçalho Allow anuncia GET, PUT e DELETE, que o próprio endpoint recusa.
    it('[BUG-04] OPTIONS /api/verifyLogin: o cabeçalho Allow deve anunciar só os métodos aceitos', () => {
        cy.request({ method: 'OPTIONS', url: '/api/verifyLogin' }).its('headers.allow').then((allow) => {
            const metodos = allow.split(',').map((m) => m.trim()).sort()
            expect(metodos, 'métodos anunciados').to.deep.equal(['OPTIONS', 'POST'])
        })
    })

    // CT-BUGS-API-HTTP-STATUS-08
    it('[BUG-05] GET /api/productsList deve declarar Content-Type JSON', () => {
        cy.apiGetProductsList().then((response) => {
            expect(response.body.responseCode).to.eq(200)
            expect(response.headers['content-type'], 'Content-Type').to.include('application/json')
        })
    })
})
