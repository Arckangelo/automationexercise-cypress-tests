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

const ARQUIVO = 'cypress/reports/known-bugs/resumo.json'
const PAGINA_DE_ESPERA = 'cypress/reports/pagina-de-espera.html'

const linhas = []
const escrever = (texto = '') => linhas.push(texto)

const publicar = () => {
  const texto = linhas.join('\n') + '\n'
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, texto)
  else process.stdout.write(texto)
}

if (!fs.existsSync(ARQUIVO)) {
  escrever('### ⚠️ Bugs conhecidos: a execução não terminou (sem resumo dos testes)')
  publicar()
  process.exit(0)
}

const { testes } = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'))

// agrupa pelo ID no título do teste: "[BUG-15] ..."
const bugs = new Map()
for (const teste of testes) {
  const id = (teste.titulo.match(/\[(BUG-\d+)\]/) || [])[1] || 'sem ID de bug'
  if (!bugs.has(id)) bugs.set(id, [])
  bugs.get(id).push(teste)
}
const ordenados = [...bugs].sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { numeric: true }))

const corrigidos = []
const inconclusivos = []
let reproduzindo = 0

for (const [id, lista] of ordenados) {
  const passaram = lista.filter((t) => t.estado === 'passed')
  const indisponiveis = lista.filter((t) => t.siteIndisponivel)
  if (passaram.length) corrigidos.push({ id, lista, passaram })
  else if (indisponiveis.length) inconclusivos.push({ id, lista, indisponiveis })
  else reproduzindo += 1
}

escrever(`### 🐞 ${reproduzindo} de ${bugs.size} bugs conhecidos continuam reproduzindo`)

if (corrigidos.length) {
  escrever()
  escrever('#### ⚠️ Possível correção: confira e mova os testes para a suíte principal')
  for (const { id, lista, passaram } of corrigidos) {
    const parcial = passaram.length < lista.length ? ' (correção parcial)' : ''
    escrever(`- **${id}**: ${passaram.length} de ${lista.length} testes passaram${parcial}`)
    for (const t of passaram) escrever(`  - \`${t.titulo}\` (${t.arquivo})`)
    console.log(`::warning title=Possível correção do ${id}::${passaram.length} de ${lista.length} testes do ${id} passaram${parcial}`)
  }
}

if (inconclusivos.length) {
  escrever()
  escrever('#### Não avaliados: o site estava indisponível')
  for (const { id, lista, indisponiveis } of inconclusivos) {
    escrever(`- **${id}**: ${indisponiveis.length} de ${lista.length} testes terminaram em "Site indisponível"; rode de novo`)
  }
}

if (fs.existsSync(PAGINA_DE_ESPERA)) {
  escrever()
  escrever('> O site respondeu a página de espera durante a execução; a cópia está no artefato `pagina-de-espera-known-bugs`.')
}

publicar()
