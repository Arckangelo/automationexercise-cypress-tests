// Proteção contra a instabilidade do site: sobrescritas de cy.visit e cy.request.
// É o ponto único dessa proteção (ver ../waitPage.js): comandos e testes não
// precisam repeti-la. Este arquivo é importado primeiro em e2e.js, porque todos
// os outros comandos usam cy.visit e cy.request.
import {
    RETRY_DELAY_MS,
    isWaitPageHtml,
    isWaitPageDocument,
    unavailablePageText,
    saveWaitPage,
    markSiteAvailable,
    markSiteDown,
    handleInstability,
} from '../waitPage'
import { recordPaymentResponse } from '../orders'
import { mutateRequestResponse } from '../mutations'

// Site fora do ar ou sobrecarregado: 429, 502, 503, 504 e os códigos da Cloudflare
// para servidor de origem inacessível (520 a 524). Vale para cy.visit e cy.request.
const UNAVAILABLE_STATUSES = [429, 502, 503, 504, 520, 521, 522, 523, 524]

// Com status fora de 2xx, o cy.visit original falha antes de qualquer conferência, com
// a mensagem "The response we received from your web server was: > 503: Service
// Unavailable". O código sai dessa linha; se o formato mudar, a falha segue como está.
const visitFailureStatus = (err) => {
    const match = /^\s*> (\d{3}):/m.exec(err?.message || '')
    return match ? Number(match[1]) : null
}

// cy.visit confere se carregou o site de verdade:
//   - status de site fora do ar (UNAVAILABLE_STATUSES): visita de novo;
//   - página de espera (ver waitPage.js): visita de novo.
// Se persistir, o teste falha com "Site indisponível" em vez de passar ou de parecer
// defeito. Outros status (404, 500) continuam falhando como sempre.
Cypress.Commands.overwrite('visit', (originalVisit, url, options, attempt = 1) => {
    // o visit original devolve uma promise, não uma cadeia: roda dentro de um .then
    return cy
        .wrap(null, { log: false })
        .then({ timeout: Cypress.config('pageLoadTimeout') }, () =>
            originalVisit(url, options).then(
                () => null,
                (err) => {
                    const status = visitFailureStatus(err)
                    if (UNAVAILABLE_STATUSES.includes(status)) return `HTTP ${status}`
                    throw err
                },
            ),
        )
        .then((unavailableReason) => {
            if (unavailableReason) {
                handleInstability(`GET ${url}`, attempt, unavailableReason)
                cy.wait(RETRY_DELAY_MS, { log: false })
                return cy.visit(url, options, attempt + 1)
            }
            return cy.document({ log: false }).then((doc) => {
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
})

// Navegação que não passa por cy.visit nem por cy.request (envio de formulário, clique
// em link) também pode cair na página de espera ou numa página de erro do servidor
// sobrecarregado. Nada confere essa página, e o teste quebraria na asserção seguinte,
// parecendo defeito do site. Quando um teste falha, a página aberta é conferida: se for
// de site indisponível (ver unavailablePageText), a falha vira "Site indisponível" e o
// disjuntor é armado. Com uma página real do site, ou nenhuma (testes de API), a falha
// continua a mesma. O erro é sempre lançado de novo: este handler nunca aprova um teste.
// (Sem "instanceof Error": AssertionError e CypressError nascem na janela do Cypress, e
// não na do teste, então instanceof dá falso para eles.)
Cypress.on('fail', (err) => {
    if (typeof err?.message !== 'string' || err.message.includes('Site indisponível')) throw err
    let doc
    try {
        doc = cy.state('document')
    } catch {
        throw err
    }
    const marker = unavailablePageText(doc)
    if (!marker) throw err
    markSiteDown()
    const page = `${doc.location.pathname}${doc.location.search}`
    throw new Error(
        `Site indisponível: página com "${marker}" em ${page}, depois de uma ação na tela ` +
            '(envio de formulário ou clique).\nNão é resultado do teste. Rode novamente mais tarde.' +
            `\n\nFalha original: ${err.message}`,
    )
})

// cy.request é o ponto único de proteção contra a instabilidade do site, para
// toda leitura por HTTP (inclusive cy.apiRequest e os comandos que leem páginas).
// Repete só a própria requisição, em vez de o Cypress repetir o teste inteiro:
//   - site fora do ar ou sobrecarregado: UNAVAILABLE_STATUSES;
//   - resposta 2xx com HTML sem o logo do site: a página de espera
//     (ver waitPage.js). JSON, texto puro e páginas 4xx/5xx não entram.
// Se persistir, falha com "Site indisponível" e arma o disjuntor (ver
// waitPage.js): a próxima instabilidade falha sem esperar. Os demais status seguem a regra
// de sempre: com failOnStatusCode (padrão), 4xx/5xx falham o teste.

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
                if (UNAVAILABLE_STATUSES.includes(response.status)) {
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
                // pagamento enviado por HTTP: entra no registro de pedidos (ver ../orders.js)
                if ((options.method || 'GET').toUpperCase() === 'POST' && /\/payment\/?$/.test(options.url)) {
                    recordPaymentResponse(response)
                }
                if (options.failOnStatusCode !== false && response.status >= 400) {
                    throw new Error(`${target} respondeu HTTP ${response.status}`)
                }
                // análise de mutação: só com --expose mutant=<id> (ver ../mutations.js)
                mutateRequestResponse(options, response)
                return response
            })

    return tryRequest(1)
})
