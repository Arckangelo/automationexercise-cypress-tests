#!/usr/bin/env node
// Lista os testes da suíte principal que só passaram numa nova tentativa
// (retries do cypress.config.js). Eles aparecem verdes no relatório, mas falharam
// pelo menos uma vez: sem este aviso, a nova tentativa esconderia a instabilidade.
//
// Lê cypress/reports/suite/resumo.json (gravado pelo cypress.config.js).
// No GitHub Actions, escreve no resumo da execução e cria avisos (::warning::);
// fora dele, imprime no terminal. Nunca falha o job.
// Uso: node scripts/resumo-instaveis.js [rótulo, ex.: o navegador]

const fs = require('fs')

const ARQUIVO = 'cypress/reports/suite/resumo.json'
const rotulo = process.argv[2] ? ` (${process.argv[2]})` : ''

const linhas = []
const escrever = (texto = '') => linhas.push(texto)
const publicar = () => {
  const texto = linhas.join('\n') + '\n'
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, texto)
  else process.stdout.write(texto)
}

if (!fs.existsSync(ARQUIVO)) {
  escrever(`### ⚠️ Suíte principal${rotulo}: a execução não terminou (sem resumo dos testes)`)
  publicar()
  process.exit(0)
}

const { testes } = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'))
const instaveis = testes.filter((t) => t.estado === 'passed' && t.tentativas.length > 1)
const falharam = testes.filter((t) => t.estado === 'failed')
const indisponiveis = falharam.filter((t) => t.siteIndisponivel)

if (!instaveis.length) {
  escrever(`### ✅ Suíte principal${rotulo}: nenhum teste precisou de nova tentativa`)
} else {
  escrever(`### ⚠️ Suíte principal${rotulo}: ${instaveis.length} teste(s) só passaram numa nova tentativa`)
  escrever()
  escrever('Ficaram verdes, mas falharam antes. Investigue a causa (espera, dado compartilhado, site lento):')
  for (const t of instaveis) {
    escrever(`- \`${t.titulo}\` (${t.arquivo}): passou na tentativa ${t.tentativas.length}`)
    console.log(`::warning title=Teste instável${rotulo}::${t.titulo} só passou na tentativa ${t.tentativas.length} (${t.arquivo})`)
  }
}

if (indisponiveis.length) {
  escrever()
  escrever(`> ${indisponiveis.length} de ${falharam.length} falha(s) foram por "Site indisponível": não indicam defeito; rode de novo.`)
}

publicar()
