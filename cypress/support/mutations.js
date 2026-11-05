// Aplica o defeito simulado escolhido com --expose mutant=<id> (análise de
// mutação, ver cypress/mutations/catalog.js e scripts/mutation-run.js).
// Sem essa opção, nada aqui roda.
//
// - defeitos 'page': alteram a resposta no navegador (cy.intercept);
// - defeitos 'request': alteram a resposta do cy.request (chamado pela
//   sobrescrita em commands/protection.js).
// Cada alteração aplicada é contada e enviada ao cypress.config.js: um defeito
// que não se aplicou não pode contar como "pego".

import catalog from '../mutations/catalog'

const mutantId = Cypress.expose('mutant')
const mutant = mutantId && mutantId !== 'baseline' ? catalog.find((m) => m.id === mutantId) : null
if (mutantId && mutantId !== 'baseline' && !mutant) {
    throw new Error(`Defeito "${mutantId}" não existe em cypress/mutations/catalog.js`)
}

let appliedInTest = 0

const mutateBody = (body) => {
    if (typeof body !== 'string') return body
    const mutated = mutant.mutate(body)
    if (mutated !== body) appliedInTest += 1
    return mutated
}

// chamado pela sobrescrita do cy.request antes de devolver a resposta
export const mutateRequestResponse = (options, response) => {
    if (!mutant || mutant.via !== 'request') return
    if ((options.method || 'GET').toUpperCase() !== mutant.method) return
    const url = new URL(options.url, Cypress.config('baseUrl'))
    if (!mutant.path.test(url.pathname + url.search)) return
    response.body = mutateBody(response.body)
}

if (mutant) {
    beforeEach(() => {
        appliedInTest = 0
        if (mutant.via === 'page') {
            cy.intercept({ method: mutant.method, path: mutant.path }, (req) => {
                req.continue((res) => {
                    res.body = mutateBody(res.body)
                })
            })
        }
    })

    afterEach(() => {
        if (appliedInTest) cy.task('recordMutationApplied', appliedInTest, { log: false })
    })
}
