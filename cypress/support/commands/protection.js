// Proteção contra a instabilidade do site: sobrescritas de cy.visit e cy.request.
// É o ponto único dessa proteção (ver ../waitPage.js): comandos e testes não
// precisam repeti-la. Este arquivo é importado primeiro em e2e.js, porque todos
// os outros comandos usam cy.visit e cy.request.
import {
    RETRY_DELAY_MS,
    isWaitPageHtml,
    isWaitPageDocument,
    saveWaitPage,
    markSiteAvailable,
    handleInstability,
} from '../waitPage'

// cy.visit confere se carregou o site de verdade, e não a página de espera
// (ver waitPage.js). Se for a página de espera, visita de novo; se ela
// persistir, o teste falha com "Site indisponível" em vez de passar.
Cypress.Commands.overwrite('visit', (originalVisit, url, options, attempt = 1) => {
    // o visit original devolve uma promise, não uma cadeia: roda dentro de um .then
    return cy
        .wrap(null, { log: false })
        .then({ timeout: Cypress.config('pageLoadTimeout') }, () => originalVisit(url, options))
        .then(() => cy.document({ log: false }))
        .then((doc) => {
            if (!isWaitPageDocument(doc)) {
                markSiteAvailable()
                return cy.window({ log: false })
            }
            saveWaitPage(doc.documentElement.outerHTML, `GET ${url}`)
            handleInstability(`GET ${url}`, attempt, 'página de espera')
            cy.wait(RETRY_DELAY_MS, { log: false })
            return cy.visit(url, options, attempt + 1)
        })
})

// cy.request é o ponto único de proteção contra a instabilidade do site, para
// toda leitura por HTTP (inclusive cy.apiRequest e os comandos que leem páginas).
// Repete só a própria requisição, em vez de o Cypress repetir o teste inteiro:
//   - 503 ou 429 (sobrecarga);
//   - resposta 2xx com HTML sem o logo do site: a página de espera
//     (ver waitPage.js). JSON, texto puro e páginas 4xx/5xx não entram.
// Se persistir, falha com "Site indisponível" e arma o disjuntor (ver
// waitPage.js): a próxima instabilidade falha sem esperar. Os demais status seguem a regra
// de sempre: com failOnStatusCode (padrão), 4xx/5xx falham o teste.
const OVERLOAD_STATUSES = [429, 503]

const normalizeRequestArgs = (args) => {
    if (typeof args[0] === 'object') return { ...args[0] }
    if (args.length === 1) return { url: args[0] }
    if (args.length === 2)
        return /^[A-Z]+$/.test(args[0]) ? { method: args[0], url: args[1] } : { url: args[0], body: args[1] }
    return { method: args[0], url: args[1], body: args[2] }
}

Cypress.Commands.overwrite('request', (originalRequest, ...args) => {
    const options = normalizeRequestArgs(args)
    const target = `${options.method || 'GET'} ${options.url}`
    const timeoutMs = (options.timeout || Cypress.config('responseTimeout')) + 1000

    const tryRequest = (attempt) =>
        cy
            .wrap(null, { log: false })
            // o request original devolve uma promise, não uma cadeia: roda dentro de um .then
            .then({ timeout: timeoutMs }, () => originalRequest({ ...options, failOnStatusCode: false }))
            .then((response) => {
                if (OVERLOAD_STATUSES.includes(response.status)) {
                    handleInstability(target, attempt, `HTTP ${response.status}`)
                    cy.wait(RETRY_DELAY_MS, { log: false })
                    return tryRequest(attempt + 1)
                }
                if (response.status >= 200 && response.status < 300 && isWaitPageHtml(response.body)) {
                    saveWaitPage(response.body, target)
                    handleInstability(target, attempt, 'página de espera')
                    cy.wait(RETRY_DELAY_MS, { log: false })
                    return tryRequest(attempt + 1)
                }
                markSiteAvailable()
                if (options.failOnStatusCode !== false && response.status >= 400) {
                    throw new Error(`${target} respondeu HTTP ${response.status}`)
                }
                return response
            })

    return tryRequest(1)
})
