// Toda exceção não tratada da página falha o teste; nenhuma é ignorada.
// Anúncios e rastreadores conhecidos nem chegam a carregar (blockHosts no
// cypress.config.js). Quando a exceção vem de um script de outro domínio, o
// navegador esconde os detalhes (muitas vezes só "Script error.", sem arquivo
// nem linha). Para a falha apontar a origem, a mensagem ganha a lista de
// scripts de terceiros que rodaram na página; se for um provedor novo de
// anúncio ou rastreador, é só acrescentar o domínio ao blockHosts.
let appWindow
Cypress.on('window:load', (win) => {
    appWindow = win
})

const thirdPartyScripts = () => {
    const site = new URL(Cypress.config('baseUrl')).hostname
    const blocked = Cypress.config('blockHosts') || []
    const hosts = appWindow.performance
        .getEntriesByType('resource')
        .filter((entry) => entry.initiatorType === 'script')
        .map((entry) => new URL(entry.name).hostname)
        // o próprio site e os domínios bloqueados (a tentativa fica registrada, mas não rodou)
        .filter((host) => host !== site && !host.endsWith(`.${site}`))
        .filter((host) => !blocked.some((pattern) => Cypress.minimatch(host, pattern)))
    return [...new Set(hosts)]
}

Cypress.on('uncaught:exception', (err) => {
    try {
        const hosts = thirdPartyScripts()
        if (hosts.length) {
            err.message +=
                `\n\nScripts de terceiros que rodaram nesta página: ${hosts.join(', ')}.` +
                '\nSe o erro vier de um deles (anúncio, rastreador), acrescente o domínio ao blockHosts do cypress.config.js.'
        }
    } catch {
        // sem a lista, a falha segue com a mensagem original
    }
    // sem "return false": o teste falha, com a mensagem acima
})

// E-mails e senhas usados nos testes ficam em fixtures/users.json, disponível em
// todo teste e hook como this.users (com function, não arrow) ou cy.get('@users').
beforeEach(() => {
    cy.fixture('users').as('users')
})

import 'cypress-mochawesome-reporter/register'
// Filtro por tags (@cypress/grep): ver "Tags" no README
import { register as registerCypressGrep } from '@cypress/grep'
registerCypressGrep()
// Registro dos pedidos que cada teste criou (conferido com a tag @creates-order)
import './orders'
// Defeitos simulados da análise de mutação (só com --expose mutant=<id>)
import './mutations'
// Comandos customizados, um arquivo por assunto. protection.js vem primeiro:
// as sobrescritas de cy.visit e cy.request valem para todos os outros.
import './commands/protection'
import './commands/session'
import './commands/cart'
import './commands/ui'
import './commands/forms'
import './commands/api'
