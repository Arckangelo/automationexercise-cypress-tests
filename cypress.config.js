const fs = require('fs')
const path = require('path')
const { defineConfig } = require('cypress')
const { beforeRunHook, afterRunHook } = require('cypress-mochawesome-reporter/lib')
const { plugin: cypressGrepPlugin } = require('@cypress/grep/plugin')

// Specs de bugs conhecidos descrevem o comportamento CORRETO e por isso
// falham enquanto o bug existir. Ficam fora da suíte padrão (e do CI) e só
// rodam quando pedidos explicitamente com --env knownBugs=true
// (ver script "test:bugs" no package.json).
const KNOWN_BUGS_SPECS = 'cypress/e2e/known-bugs/**'
const BUG_SUMMARY_FILE = 'cypress/reports/known-bugs/resumo.json'
const SUITE_SUMMARY_FILE = 'cypress/reports/suite/resumo.json'
// lido por scripts/cypress.js: filtro ativo e nenhum teste executado = falha
const NO_TESTS_MARKER = 'cypress/reports/.nenhum-teste-executado'

const activeFilter = (config) => {
    const expose = config.expose || {}
    const filter = [expose.grep && `grep=${expose.grep}`, expose.grepTags && `grepTags=${expose.grepTags}`]
    return filter.filter(Boolean).join(', ') || null
}

const testKey = (file, titlePath) => [file, ...titlePath].join('\u0000')

// Estado de cada teste ao fim da execução, lido pelos scripts de resumo do CI:
// - bugs conhecidos (scripts/bug-summary.js): quais bugs pararam de reproduzir;
// - suíte principal (scripts/flaky-summary.js): quais testes só passaram
//   numa nova tentativa, para que o retries não esconda instabilidade.
// - pedidos (scripts/check-order-tags.js): quais testes criaram pedido, para
//   conferir com a tag @creates-order.
const writeSummary = (file, results, { filter, ordersByTest }) => {
    const tests = (results?.runs || []).flatMap((run) =>
        run.tests.map((test) => ({
            file: run.spec.relative,
            titlePath: test.title,
            title: test.title.join(' › '),
            state: test.state,
            attempts: (test.attempts || []).map((attempt) => attempt.state),
            siteUnavailable: String(test.displayError || '').includes('Site indisponível'),
            orders: ordersByTest.get(testKey(run.spec.relative, test.title)) || 0,
        })),
    )
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify({ filter, tests }, null, 2))
}

module.exports = defineConfig({
    reporter: 'cypress-mochawesome-reporter',
    reporterOptions: {
        reportDir: 'cypress/reports/suite',
        reportPageTitle: 'AutomationExercise - Relatório de testes',
        charts: true,
        embeddedScreenshots: true,
        inlineAssets: true,
    },
    e2e: {
        baseUrl: 'https://automationexercise.com',
        // Anúncios e rastreadores de terceiros: pesados e sem relação com o site testado.
        // Se um teste falhar por exceção de um domínio novo desse tipo, a mensagem
        // lista os scripts de terceiros da página (e2e.js): acrescente o domínio aqui.
        blockHosts: [
            '*googlesyndication.com',
            '*doubleclick.net',
            '*googletagmanager.com',
            '*googleadservices.com',
            '*google-analytics.com',
            '*adtrafficquality.google',
            '*fundingchoicesmessages.google.com',
        ],
        viewportWidth: 1280,
        viewportHeight: 720,
        // Instabilidade do site (página de espera, 429, 502-504 e 520-524) é tratada na própria
        // requisição (commands/protection.js), com disjuntor. A nova tentativa do teste inteiro
        // fica só para falhas raras de tela; quem precisar dela aparece como
        // "instável" no resumo do CI (scripts/flaky-summary.js).
        retries: { runMode: 1, openMode: 0 },
        // Filtro por tags (@cypress/grep, ver README): com um filtro ativo, pula os
        // specs sem teste que case (grepFilterSpecs) e não lista os testes filtrados
        // no relatório (grepOmitFiltered). Sem filtro, não muda nada.
        expose: { grepFilterSpecs: true, grepOmitFiltered: true },
        setupNodeEvents(on, config) {
            if (config.env.knownBugs) {
                // falha é o resultado esperado aqui: repetir só atrasaria a execução
                config.retries = 0
                config.reporterOptions.reportDir = 'cypress/reports/known-bugs'
                config.reporterOptions.reportPageTitle = 'AutomationExercise - Bugs conhecidos'
            } else {
                config.excludeSpecPattern = [].concat(config.excludeSpecPattern, KNOWN_BUGS_SPECS)
            }

            // Filtro por tags. Se nenhum spec casar, o plugin não falha: volta a rodar
            // todos e filtra teste a teste (o que terminaria com zero testes). Como as
            // tags são sempre texto literal (scripts/check-tags.js), a leitura do plugin
            // é confiável: specPattern sem mudança com filtro ativo = nada casou. Com o
            // grepFilterSpecs desligado, quem cobre é a checagem de zero testes (after:run).
            const filter = activeFilter(config)
            const originalSpecPattern = config.specPattern
            cypressGrepPlugin(config)
            const filterSpecs = String(config.expose?.grepFilterSpecs) === 'true'
            if (filter && filterSpecs && config.specPattern === originalSpecPattern) {
                throw new Error(
                    `Filtro sem resultados (${filter}): nenhum spec tem teste com essas tags. ` +
                        'Confira o nome da tag (permitidas: scripts/test-tags.js).',
                )
            }

            // pedidos que cada teste criou, enviados por cypress/support/orders.js
            const ordersByTest = new Map()
            on('task', {
                recordOrders({ file, titlePath, count }) {
                    const key = testKey(file, titlePath)
                    ordersByTest.set(key, (ordersByTest.get(key) || 0) + count)
                    return null
                },
            })

            // o Cypress chama um só handler por evento: o do relatório HTML e o do
            // resumo dos testes rodam no mesmo after:run
            on('before:run', (details) => {
                // a cópia da página de espera é desta execução, não de uma anterior
                fs.rmSync('cypress/reports/pagina-de-espera.html', { force: true })
                fs.rmSync(NO_TESTS_MARKER, { force: true })
                return beforeRunHook(details)
            })
            on('after:run', async (results) => {
                // resumo e registro antes do relatório HTML: o gerador do relatório
                // quebra quando nenhum teste rodou, e isso não pode esconder a falha
                writeSummary(config.env.knownBugs ? BUG_SUMMARY_FILE : SUITE_SUMMARY_FILE, results, {
                    filter,
                    ordersByTest,
                })
                // segunda proteção: filtro ativo e nenhum teste executado (scripts/cypress.js falha)
                if (filter && !results?.totalTests) {
                    fs.mkdirSync(path.dirname(NO_TESTS_MARKER), { recursive: true })
                    fs.writeFileSync(NO_TESTS_MARKER, filter)
                }
                try {
                    await afterRunHook(results)
                } catch (err) {
                    if (results?.totalTests) throw err
                    console.log('Relatório HTML não gerado: nenhum teste foi executado.')
                }
            })
            return config
        },
    },
})
