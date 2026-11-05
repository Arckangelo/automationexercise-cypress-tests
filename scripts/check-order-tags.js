#!/usr/bin/env node
// Garante a regra "teste que cria pedido leva @creates-order" com base no que
// de fato aconteceu na execução, não só no que o código diz:
// - teste que criou pedido sem a tag: erro (exit 1);
// - teste com a tag que rodou e não criou pedido: aviso, para a tag não sobrar
//   (exceto quando o site estava indisponível);
// - teste executado que não casa com exatamente um teste do código: erro. Os
//   títulos gerados a partir de listas são casados por padrão (ver
//   scripts/test-tags.js); se ainda assim houver dúvida, o script não ignora.
//
// Lê o resumo gravado pelo cypress.config.js (pedidos por teste) e as tags do
// código. No GitHub Actions escreve no resumo da execução e cria anotações.
// Uso: node scripts/check-order-tags.js <resumo.json> [rótulo]

const fs = require('fs')
const { readAllSpecs, findMatches, describeTest } = require('./test-tags')

const [summaryFile, labelArg] = process.argv.slice(2)
const label = labelArg ? ` (${labelArg})` : ''

const lines = []
const addLine = (text = '') => lines.push(text)
const publish = () => {
    const text = lines.join('\n') + '\n'
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text)
    else process.stdout.write(text)
}

if (!summaryFile || !fs.existsSync(summaryFile)) {
    addLine(`### ⚠️ Pedidos${label}: sem resumo da execução (${summaryFile || 'arquivo não informado'})`)
    publish()
    process.exit(0)
}

const { tests: executed, filter } = JSON.parse(fs.readFileSync(summaryFile, 'utf8'))
const { tests: codeTests } = readAllSpecs()
const errors = []
const warnings = []
let totalOrders = 0

for (const test of executed) {
    totalOrders += test.orders
    const matches = findMatches(codeTests, test.file, test.titlePath)
    if (matches.length !== 1) {
        const candidates = matches.length ? `: ${matches.map(describeTest).join('; ')}` : ''
        errors.push(
            `não foi possível casar com certeza o teste executado "${test.title}" (${test.file}) com o código: ` +
                `${matches.length} candidatos${candidates}. Deixe o título inequívoco.`,
        )
        continue
    }
    const [code] = matches
    const tagged = code.tags.includes('@creates-order')
    if (test.orders > 0 && !tagged) {
        errors.push(`"${test.title}" criou ${test.orders} pedido(s) sem a tag @creates-order (${describeTest(code)})`)
    }
    if (test.orders === 0 && tagged && test.state !== 'pending' && !test.siteUnavailable) {
        warnings.push(`"${test.title}" tem @creates-order, mas não criou pedido nesta execução (${describeTest(code)})`)
    }
}

addLine(`### 🧾 Pedidos criados nesta execução${label}: ${totalOrders}${filter ? ` (filtro: ${filter})` : ''}`)

if (errors.length) {
    addLine()
    addLine('#### ❌ Regra da tag @creates-order')
    for (const error of errors) {
        addLine(`- ${error}`)
        console.log(`::error title=Tag @creates-order${label}::${error}`)
    }
}

if (warnings.length) {
    addLine()
    addLine('#### ⚠️ Tag @creates-order possivelmente sobrando')
    addLine(
        'O teste tem a tag, mas não criou pedido. Se o comportamento mudou (por exemplo, o bug foi corrigido), remova a tag.',
    )
    for (const warning of warnings) {
        addLine(`- ${warning}`)
        console.log(`::warning title=Tag @creates-order sobrando${label}::${warning}`)
    }
}

publish()
process.exit(errors.length ? 1 : 0)
