const { defineConfig } = require('cypress')
const mochawesome = require('cypress-mochawesome-reporter/plugin')

// Specs de bugs conhecidos descrevem o comportamento CORRETO e por isso
// falham enquanto o bug existir. Ficam fora da suíte padrão (e do CI) e só
// rodam quando pedidos explicitamente com --env knownBugs=true
// (ver script "test:bugs" no package.json).
const KNOWN_BUGS_SPECS = 'cypress/e2e/known-bugs/**'

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

      mochawesome(on)
      return config
    },
  },
})
