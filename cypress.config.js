const fs = require('fs')
const path = require('path')
const { defineConfig } = require('cypress')
const { beforeRunHook, afterRunHook } = require('cypress-mochawesome-reporter/lib')

// Specs de bugs conhecidos descrevem o comportamento CORRETO e por isso
// falham enquanto o bug existir. Ficam fora da suíte padrão (e do CI) e só
// rodam quando pedidos explicitamente com --env knownBugs=true
// (ver script "test:bugs" no package.json).
const KNOWN_BUGS_SPECS = 'cypress/e2e/known-bugs/**'
const RESUMO_DOS_BUGS = 'cypress/reports/known-bugs/resumo.json'

// Estado de cada teste de bug conhecido, lido por scripts/resumo-bugs.js no CI
// para apontar teste a teste quais bugs pararam de reproduzir.
const gravarResumoDosBugs = (resultados) => {
  const testes = (resultados?.runs || []).flatMap((run) => run.tests.map((teste) => ({
    arquivo: run.spec.relative,
    titulo: teste.title[teste.title.length - 1],
    estado: teste.state,
    siteIndisponivel: String(teste.displayError || '').includes('Site indisponível'),
  })))
  fs.mkdirSync(path.dirname(RESUMO_DOS_BUGS), { recursive: true })
  fs.writeFileSync(RESUMO_DOS_BUGS, JSON.stringify({ testes }, null, 2))
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
    // o site é público e às vezes responde "heavy load (queue full)";
    // no modo headless cada teste tem até 2 novas tentativas antes de falhar
    retries: { runMode: 2, openMode: 0 },
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
      // resumo dos bugs rodam no mesmo after:run
      on('before:run', (detalhes) => beforeRunHook(detalhes))
      on('after:run', async (resultados) => {
        await afterRunHook(resultados)
        if (config.env.knownBugs) gravarResumoDosBugs(resultados)
      })
      return config
    },
  },
})
