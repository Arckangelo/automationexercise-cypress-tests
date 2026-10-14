// Scripts de anúncio de terceiros (Google Ads e afins) às vezes lançam
// exceções que não têm relação com o site sob teste. Só esses erros são
// ignorados: qualquer outra exceção não tratada continua falhando o teste,
// para que erros reais do site não passem despercebidos.
const SCRIPTS_DE_ANUNCIO = /googlesyndication|doubleclick|googletagmanager|googleadservices|adtrafficquality|fundingchoicesmessages/

Cypress.on('uncaught:exception', (err) => {
    if (SCRIPTS_DE_ANUNCIO.test(`${err.message}\n${err.stack}`)) {
        return false
    }
})

import 'cypress-mochawesome-reporter/register'
import './commands.js'
