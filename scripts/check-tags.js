#!/usr/bin/env node
// Confere as tags de todos os specs (it e describe): só tags permitidas e
// sempre como texto literal. Uma tag digitada errada tiraria o teste do filtro
// sem ninguém perceber; por isso este script falha (exit 1) em vez de avisar.
// Roda no CI (job "Formatação e tags") e localmente: npm run check:tags

const { ALLOWED_TAGS, readAllSpecs } = require('./test-tags')

const { tests, problems } = readAllSpecs()
const errors = [...problems]

for (const test of tests) {
    for (const tag of test.tags) {
        if (!ALLOWED_TAGS.includes(tag)) {
            errors.push(`${test.file}:${test.line}: tag desconhecida "${tag}" (permitidas: ${ALLOWED_TAGS.join(', ')})`)
        }
    }
}

if (errors.length) {
    console.error(`Tags inválidas (${errors.length}):`)
    for (const error of [...new Set(errors)]) {
        console.error(`- ${error}`)
        console.log(`::error title=Tag inválida::${error}`)
    }
    process.exit(1)
}

const count = (tag) => tests.filter((t) => t.tags.includes(tag)).length
console.log(
    `Tags conferidas em ${tests.length} testes: ${ALLOWED_TAGS.map((tag) => `${tag} em ${count(tag)}`).join(', ')}.`,
)
