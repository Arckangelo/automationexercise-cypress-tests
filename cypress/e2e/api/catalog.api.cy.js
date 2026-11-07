import { SUSPICIOUS_CHANGE_PERCENT, catalogChanges } from '../../support/catalog'

// Teste de guarda. Os outros testes leem o preço esperado do catálogo da API na
// hora, então uma mudança de preço não os derruba: passam a esperar o preço novo,
// como num software real, em que o preço muda. Este é o único que compara o
// catálogo com a referência conferida (referenceCatalog em apiData.json) e, se algo
// mudou, falha dizendo o quê e quanto. É também a única defesa contra um preço
// errado na própria API, que os outros testes aceitariam: por isso a falha não
// manda só atualizar a referência. Primeiro se confirma com quem define os preços;
// se foi engano, é bug do site.
//
// Num catálogo com preço dinâmico (que muda todo dia), a comparação com a
// referência deixaria de fazer sentido, mas a defesa contra o preço errado não
// pode sumir junto: ela passaria a ser uma regra de variação máxima, aplicada na
// origem do preço (ver "Observações" no README).
describe('API - Catálogo conferido (teste de guarda)', () => {
    // CT-API-CATALOG-01
    it('catálogo da API igual à referência conferida (nomes e preços)', () => {
        cy.fixture('apiData').then(({ referenceCatalog }) => {
            cy.apiGetProductsList().then(({ body }) => {
                expect(body.responseCode, 'responseCode').to.eq(200)

                const changes = catalogChanges(referenceCatalog.products, body.products)
                const message =
                    `o catálogo da API mudou desde a conferência de ${referenceCatalog.checkedOn}. ` +
                    'Os outros testes já calculam com o preço novo e não acusam nada: confirme com quem ' +
                    'define os preços antes de aceitar. Se a mudança foi intencional, atualize ' +
                    'referenceCatalog em cypress/fixtures/apiData.json; se foi engano, é um bug do site ' +
                    `(regra 5 do CLAUDE.md). Variação acima de ${SUSPICIOUS_CHANGE_PERCENT}% vem marcada ` +
                    `como SUSPEITO:\n${changes.join('\n')}\n`
                expect(changes, message).to.deep.equal([])
            })
        })
    })
})
