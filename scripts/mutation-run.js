#!/usr/bin/env node
// Análise de mutação: roda cada defeito de cypress/mutations/catalog.js contra
// os testes que deveriam pegá-lo e diz se ele foi pego.
//
// 1. Linha de base: os mesmos testes, sem defeito nenhum, precisam passar.
//    Senão uma falha qualquer (site lento, teste quebrado) contaria como "pego".
// 2. Cada defeito, num processo do Cypress próprio (--expose mutant=<id>):
//    - pego: algum teste indicado falhou com o defeito aplicado;
//    - sobreviveu: o defeito foi aplicado e todos os testes passaram (teste fraco);
//    - não aplicado: a alteração não casou com a resposta do site (catálogo
//      desatualizado); nunca conta como pego;
//    - inconclusivo: o teste falhou por "Site indisponível".
//
// Escreve o resultado em cypress/reports/mutation-results/ (resultado.json e um
// log por execução) e no resumo do GitHub Actions. Falha (exit 1) se algum
// defeito sobreviver, não se aplicar ou se a linha de base falhar.
// Uso: npm run test:mutation [-- M01 M05]   (sem ids: o catálogo inteiro)

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const catalog = require('../cypress/mutations/catalog')

const RESULTS_DIR = 'cypress/reports/mutation-results'
const SUMMARY_FILE = 'cypress/reports/mutation/resumo.json'
const requested = process.argv.slice(2)
const mutants = requested.length ? catalog.filter((m) => requested.includes(m.id)) : catalog
const unknown = requested.filter((id) => !catalog.some((m) => m.id === id))
if (unknown.length) {
    console.error(`Defeitos que não existem no catálogo: ${unknown.join(', ')}`)
    process.exit(1)
}

fs.rmSync(RESULTS_DIR, { recursive: true, force: true })
fs.mkdirSync(RESULTS_DIR, { recursive: true })

// lê o resumo da execução direto, sem conferir antes se existe (conferir e depois
// ler deixa o arquivo mudar no meio); sem resumo, a execução não terminou
const readSummary = () => {
    try {
        return JSON.parse(fs.readFileSync(SUMMARY_FILE, 'utf8'))
    } catch (err) {
        if (err.code === 'ENOENT') return null
        throw err
    }
}

// roda o Cypress pelo mesmo lançador dos scripts npm; saída num log por execução
const runCypress = (id, specs) => {
    const log = path.join(RESULTS_DIR, `${id}.log`)
    const started = Date.now()
    // um só descritor para a saída normal e a de erros (abrir o arquivo duas vezes
    // é uma condição de corrida, apontada pelo CodeQL)
    const logFd = fs.openSync(log, 'w')
    let status
    try {
        ;({ status } = spawnSync(
            process.execPath,
            ['scripts/cypress.js', 'run', '--browser', 'chrome', '--spec', specs.join(','), '--expose', `mutant=${id}`],
            { stdio: ['ignore', logFd, logFd] },
        ))
    } finally {
        fs.closeSync(logFd)
    }
    const summary = readSummary()
    fs.rmSync(SUMMARY_FILE, { force: true })
    return { status, summary, seconds: Math.round((Date.now() - started) / 1000), log }
}

const lines = []
const addLine = (text = '') => lines.push(text)
const publish = () => {
    const text = lines.join('\n') + '\n'
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text)
    process.stdout.write(text)
}

// 1. linha de base
console.log(`Linha de base: ${mutants.length} defeito(s), testes indicados sem defeito...`)
const allSpecs = [...new Set(mutants.map((m) => m.spec))]
const baseline = runCypress('baseline', allSpecs)
const baselineTests = baseline.summary?.tests || []
const baselineFailed = baselineTests.filter((t) => t.state !== 'passed')
const expectedTests = new Set(mutants.flatMap((m) => m.tests))
const missingInBaseline = [...expectedTests].filter((title) => !baselineTests.some((t) => t.title.endsWith(title)))

if (baseline.status !== 0 || baselineFailed.length || missingInBaseline.length) {
    addLine('### 🧬 Análise de mutação: linha de base falhou')
    addLine()
    addLine('Os testes indicados no catálogo precisam passar sem defeito nenhum; senão o resultado não vale.')
    for (const t of baselineFailed) addLine(`- falhou sem defeito: \`${t.title}\``)
    for (const title of missingInBaseline) addLine(`- não encontrado: \`${title}\``)
    addLine(`- log: ${baseline.log}`)
    publish()
    process.exit(1)
}

// 2. cada defeito
const results = []
for (const mutant of mutants) {
    console.log(`${mutant.id}: ${mutant.description}...`)
    const run = runCypress(mutant.id, [mutant.spec])
    const tests = run.summary?.tests || []
    const applied = run.summary?.mutation?.applied || 0
    let verdict
    if (!tests.length) verdict = 'erro'
    else if (!applied) verdict = 'não aplicado'
    else if (tests.some((t) => t.state === 'failed' && !t.siteUnavailable)) verdict = 'pego'
    else if (tests.some((t) => t.siteUnavailable)) verdict = 'inconclusivo'
    else verdict = 'sobreviveu'
    results.push({
        id: mutant.id,
        description: mutant.description,
        verdict,
        applied,
        seconds: run.seconds,
        tests: tests.map((t) => ({ title: t.title, state: t.state })),
        log: run.log,
    })
    console.log(`  -> ${verdict} (${run.seconds} s)`)
}
fs.writeFileSync(path.join(RESULTS_DIR, 'resultado.json'), JSON.stringify(results, null, 2))

const count = (verdict) => results.filter((r) => r.verdict === verdict).length
const caught = count('pego')
addLine(`### 🧬 Análise de mutação: ${caught} de ${results.length} defeitos pegos`)
addLine()
const icon = { pego: '✅', sobreviveu: '❌', 'não aplicado': '⚠️', inconclusivo: '❔', erro: '❌' }
for (const r of results) {
    addLine(`- ${icon[r.verdict]} **${r.id}** ${r.description}: **${r.verdict}** (${r.seconds} s)`)
}
const problems = results.filter((r) => ['sobreviveu', 'não aplicado', 'erro'].includes(r.verdict))
if (problems.length) {
    addLine()
    addLine(
        'Sobreviveu = o teste não percebeu o defeito (reforce a asserção). Não aplicado = a alteração não casou ' +
            'com a resposta do site (atualize o catálogo). Erro = o teste indicado não rodou.',
    )
    for (const r of problems) console.log(`::error title=Mutação ${r.id}::${r.description}: ${r.verdict}`)
}
for (const r of results.filter((x) => x.verdict === 'inconclusivo')) {
    console.log(`::warning title=Mutação ${r.id}::site indisponível; rode de novo`)
}
publish()
process.exit(problems.length ? 1 : 0)
