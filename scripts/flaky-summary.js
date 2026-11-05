#!/usr/bin/env node
// Lista os testes da suíte principal que só passaram numa nova tentativa
// (retries do cypress.config.js). Eles aparecem verdes no relatório, mas falharam
// pelo menos uma vez: sem este aviso, a nova tentativa esconderia a instabilidade.
//
// Lê cypress/reports/suite/resumo.json (gravado pelo cypress.config.js).
// No GitHub Actions, escreve no resumo da execução e cria avisos (::warning::);
// fora dele, imprime no terminal. Nunca falha o job.
// Uso: node scripts/flaky-summary.js [rótulo, ex.: o navegador] [arquivo do resumo]

const fs = require('fs')

// resumo da suíte no computador, ou o da tela de celular (2º argumento)
const SUMMARY_FILE = process.argv[3] || 'cypress/reports/suite/resumo.json'
const label = process.argv[2] ? ` (${process.argv[2]})` : ''

const lines = []
const addLine = (text = '') => lines.push(text)
const publish = () => {
    const text = lines.join('\n') + '\n'
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text)
    else process.stdout.write(text)
}

if (!fs.existsSync(SUMMARY_FILE)) {
    addLine(`### ⚠️ Suíte principal${label}: a execução não terminou (sem resumo dos testes)`)
    publish()
    process.exit(0)
}

const { tests } = JSON.parse(fs.readFileSync(SUMMARY_FILE, 'utf8'))
const flaky = tests.filter((t) => t.state === 'passed' && t.attempts.length > 1)
const failed = tests.filter((t) => t.state === 'failed')
const unavailable = failed.filter((t) => t.siteUnavailable)

if (!flaky.length) {
    addLine(`### ✅ Suíte principal${label}: nenhum teste precisou de nova tentativa`)
} else {
    addLine(`### ⚠️ Suíte principal${label}: ${flaky.length} teste(s) só passaram numa nova tentativa`)
    addLine()
    addLine('Ficaram verdes, mas falharam antes. Investigue a causa (espera, dado compartilhado, site lento):')
    for (const t of flaky) {
        addLine(`- \`${t.title}\` (${t.file}): passou na tentativa ${t.attempts.length}`)
        console.log(
            `::warning title=Teste instável${label}::${t.title} só passou na tentativa ${t.attempts.length} (${t.file})`,
        )
    }
}

if (unavailable.length) {
    addLine()
    addLine(
        `> ${unavailable.length} de ${failed.length} falha(s) foram por "Site indisponível": não indicam defeito; rode de novo.`,
    )
}

publish()
