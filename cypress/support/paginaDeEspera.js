// Página de espera do site
//
// Sob carga, o automationexercise.com às vezes responde, a qualquer URL
// (inclusive da API), uma página HTML provisória que se recarrega sozinha
// via setTimeout. Ela não é o site: não tem cabeçalho, logo, produtos nem JSON.
//
// Sem tratamento isso gera dois problemas:
//   - na API, o teste quebra com "Resposta inválida", parecendo defeito;
//   - na tela, testes que conferem que algo NÃO aparece passam sem motivo
//     (foi o que aconteceu com BUG-12 e BUG-16 no CI).
//
// Toda página real do site tem o logo no cabeçalho. Se ele não está lá, é a
// página de espera: tentamos de novo algumas vezes e, se ela persistir, o
// teste falha com "Site indisponível", nunca passa nem vira bug.
//
// A verificação fica só em dois lugares, nas sobrescritas de cy.visit e de
// cy.request (commands.js). Comandos e testes não precisam repeti-la.

export const TENTATIVAS = 3
export const ESPERA_ENTRE_TENTATIVAS = 5000
const ARQUIVO = 'cypress/reports/pagina-de-espera.html'

// usado para respostas de cy.request (texto cru)
export const htmlEhPaginaDeEspera = (texto) =>
    typeof texto === 'string' && texto.trimStart().startsWith('<') && !texto.includes('class="logo')

// usado depois de cy.visit (página já carregada)
export const documentoEhPaginaDeEspera = (doc) => !doc.querySelector('.logo')

export const erroSiteIndisponivel = (onde, motivo = 'página de espera') =>
    new Error(
        `Site indisponível: ${motivo} em ${onde} após ${TENTATIVAS} tentativas.\n` +
        'Não é resultado do teste. Rode novamente mais tarde.'
    )

// Disjuntor: depois que o site é declarado indisponível, as próximas respostas
// instáveis falham na hora, sem novas tentativas nem espera. Assim uma queda no
// meio da execução não faz cada teste seguinte esperar ~10 s (vezes as novas
// tentativas do próprio teste). A primeira resposta normal desarma o disjuntor.
// O estado vale para o spec em execução (o Cypress recarrega o suporte a cada spec).
let siteForaDoAr = false

export const siteRespondeu = () => { siteForaDoAr = false }

// Chamado a cada resposta instável (página de espera, 503, 429). Lança o erro
// quando deve parar; se não lançar, quem chamou espera e tenta de novo.
export const tratarInstabilidade = (onde, tentativa, motivo) => {
    if (siteForaDoAr) {
        throw new Error(
            `Site indisponível: ${motivo} em ${onde}. O site já estava fora do ar nesta execução, ` +
            'então não houve novas tentativas.\nNão é resultado do teste. Rode novamente mais tarde.'
        )
    }
    if (tentativa >= TENTATIVAS) {
        siteForaDoAr = true
        throw erroSiteIndisponivel(onde, motivo)
    }
}

// guarda a primeira ocorrência da execução para análise (sai junto do relatório no CI)
let jaGuardada = false
export const guardarPaginaDeEspera = (html, onde) => {
    if (jaGuardada) return
    jaGuardada = true
    cy.writeFile(ARQUIVO, `<!-- ${onde} · ${new Date().toISOString()} -->\n${html}`, { log: false })
}
