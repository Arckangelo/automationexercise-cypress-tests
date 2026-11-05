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
const RESUMO_DA_SUITE = 'cypress/reports/suite/resumo.json'

// Estado de cada teste ao fim da execução, lido pelos scripts de resumo do CI:
// - bugs conhecidos (scripts/resumo-bugs.js): quais bugs pararam de reproduzir;
// - suíte principal (scripts/resumo-instaveis.js): quais testes só passaram
//   numa nova tentativa, para que o retries não esconda instabilidade.
const gravarResumo = (arquivo, resultados) => {
  const testes = (resultados?.runs || []).flatMap((run) => run.tests.map((teste) => ({
    arquivo: run.spec.relative,
    titulo: teste.title.join(' › '),
    estado: teste.state,
    tentativas: (teste.attempts || []).map((tentativa) => tentativa.state),
    siteIndisponivel: String(teste.displayError || '').includes('Site indisponível'),
  })))
  fs.mkdirSync(path.dirname(arquivo), { recursive: true })
  fs.writeFileSync(arquivo, JSON.stringify({ testes }, null, 2))
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
    // requisição (commands.js), com disjuntor. A nova tentativa do teste inteiro
    // fica só para falhas raras de tela; quem precisar dela aparece como
    // "instável" no resumo do CI (scripts/resumo-instaveis.js).
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
      on('before:run', (detalhes) => {
        // a cópia da página de espera é desta execução, não de uma anterior
        fs.rmSync('cypress/reports/pagina-de-espera.html', { force: true })
        return beforeRunHook(detalhes)
      })
      on('after:run', async (resultados) => {
        await afterRunHook(resultados)
        gravarResumo(config.env.knownBugs ? RESUMO_DOS_BUGS : RESUMO_DA_SUITE, resultados)
      })
      return config
    },
  },
})
