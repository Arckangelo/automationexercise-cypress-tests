#!/usr/bin/env node
// Resume, teste a teste, a execução dos bugs conhecidos (npm run test:bugs).
// Os testes de bug descrevem o comportamento correto: falhar é o esperado, e um
// teste que passa indica uma possível correção (ou um teste quebrado). Olhar só o
// resultado geral do job esconderia um bug corrigido no meio dos outros.
//
// Lê cypress/reports/known-bugs/resumo.json (gravado pelo cypress.config.js).
// No GitHub Actions, escreve no resumo da execução e cria avisos (::warning::);
// fora dele, imprime o resumo no terminal. Nunca falha o job.

const fs = require('fs')

const SUMMARY_FILE = 'cypress/reports/known-bugs/resumo.json'
const WAIT_PAGE_FILE = 'cypress/reports/pagina-de-espera.html'

const lines = []
const addLine = (text = '') => lines.push(text)

const publish = () => {
    const text = lines.join('\n') + '\n'
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text)
    else process.stdout.write(text)
}

if (!fs.existsSync(SUMMARY_FILE)) {
    addLine('### ⚠️ Bugs conhecidos: a execução não terminou (sem resumo dos testes)')
    publish()
    process.exit(0)
}

const { tests } = JSON.parse(fs.readFileSync(SUMMARY_FILE, 'utf8'))

// agrupa pelo ID no título do teste: "[BUG-15] ..."
const bugs = new Map()
for (const test of tests) {
    // o título vem como "describe › teste"; o ID do bug é o do próprio teste
    test.title = test.title.split(' › ').pop()
    const id = (test.title.match(/\[(BUG-\d+)\]/) || [])[1] || 'sem ID de bug'
    if (!bugs.has(id)) bugs.set(id, [])
    bugs.get(id).push(test)
}
const sorted = [...bugs].sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { numeric: true }))

const fixed = []
const inconclusive = []
let reproducing = 0

for (const [id, list] of sorted) {
    const passed = list.filter((t) => t.state === 'passed')
    const unavailable = list.filter((t) => t.siteUnavailable)
    if (passed.length) fixed.push({ id, list, passed })
    else if (unavailable.length) inconclusive.push({ id, list, unavailable })
    else reproducing += 1
}

addLine(`### 🐞 ${reproducing} de ${bugs.size} bugs conhecidos continuam reproduzindo`)

if (fixed.length) {
    addLine()
    addLine('#### ⚠️ Possível correção: confira e mova os testes para a suíte principal')
    for (const { id, list, passed } of fixed) {
        const partial = passed.length < list.length ? ' (correção parcial)' : ''
        addLine(`- **${id}**: ${passed.length} de ${list.length} testes passaram${partial}`)
        for (const t of passed) addLine(`  - \`${t.title}\` (${t.file})`)
        console.log(
            `::warning title=Possível correção do ${id}::${passed.length} de ${list.length} testes do ${id} passaram${partial}`,
        )
    }
}

if (inconclusive.length) {
    addLine()
    addLine('#### Não avaliados: o site estava indisponível')
    for (const { id, list, unavailable } of inconclusive) {
        addLine(
            `- **${id}**: ${unavailable.length} de ${list.length} testes terminaram em "Site indisponível"; rode de novo`,
        )
    }
}

if (fs.existsSync(WAIT_PAGE_FILE)) {
    addLine()
    addLine(
        '> O site respondeu a página de espera durante a execução; a cópia está no artefato `pagina-de-espera-known-bugs`.',
    )
}

publish()
