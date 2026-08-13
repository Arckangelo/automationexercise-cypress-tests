// Ignora exceções não tratadas vindas do código da aplicação (fora do nosso controle),
// para que bugs do site não quebrem testes que não são sobre esse bug específico
Cypress.on('uncaught:exception', (err, runnable) => {
    return false
})

import './commands.js'