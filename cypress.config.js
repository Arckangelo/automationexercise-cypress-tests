const fs = require('fs')
const path = require('path')
const { defineConfig } = require('cypress')
const { beforeRunHook, afterRunHook } = require('cypress-mochawesome-reporter/lib')

// Specs de bugs conhecidos descrevem o comportamento CORRETO e por isso
// falham enquanto o bug existir. Ficam fora da suíte padrão (e do CI) e só
// rodam quando pedidos explicitamente com --env knownBugs=true
// (ver script "test:bugs" no package.json).
const KNOWN_BUGS_SPECS = 'cypress/e2e/known-bugs/**'
const BUG_SUMMARY_FILE = 'cypress/reports/known-bugs/resumo.json'
const SUITE_SUMMARY_FILE = 'cypress/reports/suite/resumo.json'

// Estado de cada teste ao fim da execução, lido pelos scripts de resumo do CI:
// - bugs conhecidos (scripts/bug-summary.js): quais bugs pararam de reproduzir;
// - suíte principal (scripts/flaky-summary.js): quais testes só passaram
//   numa nova tentativa, para que o retries não esconda instabilidade.
const writeSummary = (file, results) => {
    const tests = (results?.runs || []).flatMap((run) =>
        run.tests.map((test) => ({
            file: run.spec.relative,
            title: test.title.join(' › '),
            state: test.state,
            attempts: (test.attempts || []).map((attempt) => attempt.state),
            siteUnavailable: String(test.displayError || '').includes('Site indisponível'),
        })),
    )
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify({ tests }, null, 2))
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
        // anúncios e rastreadores de terceiros: pesados e sem relação com o site testado
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
        // Instabilidade do site (página de espera, 503/429) é tratada na própria
        // requisição (commands/protection.js), com disjuntor. A nova tentativa do teste inteiro
        // fica só para falhas raras de tela; quem precisar dela aparece como
        // "instável" no resumo do CI (scripts/flaky-summary.js).
        retries: { runMode: 1, openMode: 0 },
        setupNodeEvents(on, config) {
            if (config.env.knownBugs) {
                // falha é o resultado esperado aqui: repetir só atrasaria a execução
                config.retries = 0
                config.reporterOptions.reportDir = 'cypress/reports/known-bugs'
                config.reporterOptions.reportPageTitle = 'AutomationExercise - Bugs conhecidos'
            } else {
                config.excludeSpecPattern = [].concat(config.excludeSpecPattern, KNOWN_BUGS_SPECS)
            }

            // o Cypress chama um só handler por evento: o do relatório HTML e o do
            // resumo dos testes rodam no mesmo after:run
            on('before:run', (details) => {
                // a cópia da página de espera é desta execução, não de uma anterior
                fs.rmSync('cypress/reports/pagina-de-espera.html', { force: true })
                return beforeRunHook(details)
            })
            on('after:run', async (results) => {
                await afterRunHook(results)
                writeSummary(config.env.knownBugs ? BUG_SUMMARY_FILE : SUITE_SUMMARY_FILE, results)
            })
            return config
        },
    },
})
