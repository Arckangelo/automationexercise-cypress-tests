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
// A verificação fica só em commands/protection.js: nas sobrescritas de cy.visit e de
// cy.request e, para a navegação que não passa por elas (envio de formulário,
// clique), no handler de falha. Comandos e testes não precisam repeti-la.

export const MAX_ATTEMPTS = 3
export const RETRY_DELAY_MS = 5000
const WAIT_PAGE_FILE = 'cypress/reports/pagina-de-espera.html'

// usado para respostas de cy.request (texto cru)
export const isWaitPageHtml = (text) =>
    typeof text === 'string' && text.trimStart().startsWith('<') && !text.includes('class="logo')

// usado depois de cy.visit (página já carregada)
export const isWaitPageDocument = (doc) => !doc.querySelector('.logo')

// Página de site indisponível que chega por uma navegação da própria página (envio de
// formulário, clique em link), sem passar por cy.visit nem por cy.request. Aqui a falta do
// logo não basta: um teste de API roda em about:blank e a página de debug do Django
// (BUG-09) também não tem logo. Por isso a página precisa trazer também o texto de uma
// página de indisponibilidade: as duas já vistas no site e as de erro de servidor
// sobrecarregado ou fora do ar (inclusive as da Cloudflare, "Error code 52x").
const UNAVAILABLE_PAGE_TEXTS = [
    'under heavy load', // "This website is under heavy load (queue full)"
    'request is being verified', // "Please wait while your request is being verified..."
    'service unavailable',
    'service temporarily unavailable',
    'bad gateway',
    'gateway time',
    'too many requests',
    'error code 52',
]

// devolve o texto reconhecido, ou null se a página não for de site indisponível
export const unavailablePageText = (doc) => {
    if (!doc?.documentElement || doc.querySelector('.logo')) return null
    const text = `${doc.title} ${doc.body?.textContent || ''}`.toLowerCase()
    return UNAVAILABLE_PAGE_TEXTS.find((marker) => text.includes(marker)) || null
}

export const siteUnavailableError = (target, reason = 'página de espera') =>
    new Error(
        `Site indisponível: ${reason} em ${target} após ${MAX_ATTEMPTS} tentativas.\n` +
            'Não é resultado do teste. Rode novamente mais tarde.',
    )

// Disjuntor: depois que o site é declarado indisponível, as próximas respostas
// instáveis falham na hora, sem novas tentativas nem espera. Assim uma queda no
// meio da execução não faz cada teste seguinte esperar ~10 s (vezes as novas
// tentativas do próprio teste). A primeira resposta normal desarma o disjuntor.
// O estado vale para o spec em execução (o Cypress recarrega o suporte a cada spec).
let siteDown = false

export const markSiteAvailable = () => {
    siteDown = false
}

// arma o disjuntor quando a indisponibilidade aparece fora das sobrescritas (ver o
// handler de falha em commands/protection.js)
export const markSiteDown = () => {
    siteDown = true
}

// Chamado a cada resposta instável (página de espera, 503, 429). Lança o erro
// quando deve parar; se não lançar, quem chamou espera e tenta de novo.
export const handleInstability = (target, attempt, reason) => {
    if (siteDown) {
        throw new Error(
            `Site indisponível: ${reason} em ${target}. O site já estava fora do ar nesta execução, ` +
                'então não houve novas tentativas.\nNão é resultado do teste. Rode novamente mais tarde.',
        )
    }
    if (attempt >= MAX_ATTEMPTS) {
        siteDown = true
        throw siteUnavailableError(target, reason)
    }
}

// guarda a primeira ocorrência da execução para análise (sai junto do relatório no CI)
let alreadySaved = false
export const saveWaitPage = (html, target) => {
    if (alreadySaved) return
    alreadySaved = true
    cy.writeFile(WAIT_PAGE_FILE, `<!-- ${target} · ${new Date().toISOString()} -->\n${html}`, { log: false })
}
