// Lê os testes dos specs como código (AST, via @babel/parser) e devolve, para
// cada `it`, o arquivo, a linha, o caminho de títulos (describe › ... › it) e
// as tags efetivas (as do próprio it somadas às dos describe que o envolvem).
//
// Usado por:
// - scripts/check-tags.js: só tags permitidas, sempre como texto literal;
// - scripts/check-order-tags.js: casa os testes que criaram pedido (registrados
//   na execução) com as tags do código.
//
// Títulos gerados em tempo de execução (its criados a partir de listas) viram
// padrões: texto fixo é comparado exatamente; num template literal, cada
// ${...} aceita qualquer texto. Um título que não seja texto nem template é
// registrado como problema: sem ele não dá para casar o teste com certeza.

const fs = require('fs')
const path = require('path')
const { parse } = require('@babel/parser')

const ALLOWED_TAGS = ['@smoke', '@creates-order']
const SUITE_FUNCTIONS = new Set(['describe', 'context'])
const TEST_FUNCTIONS = new Set(['it', 'specify'])
const SPECS_DIR = 'cypress/e2e'

const listSpecs = (dir = SPECS_DIR) =>
    fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((entry) => {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) return listSpecs(full)
            return entry.name.endsWith('.cy.js') ? [full] : []
        })
        .sort()

// it(...), it.only(...), describe.skip(...) etc.
const calleeName = (callee) => {
    if (callee.type === 'Identifier') return callee.name
    if (callee.type === 'MemberExpression' && callee.object.type === 'Identifier') return callee.object.name
    return null
}

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// padrão de um título: { text } para texto fixo, { regex } para template literal
const titlePattern = (node) => {
    if (!node) return null
    if (node.type === 'StringLiteral') return { text: node.value, source: JSON.stringify(node.value) }
    if (node.type === 'TemplateLiteral') {
        const body = node.quasis.map((q) => escapeRegex(q.value.cooked)).join('(.+?)')
        return { regex: new RegExp(`^${body}$`), source: `\`${node.quasis.map((q) => q.value.cooked).join('${…}')}\`` }
    }
    return null
}

const matchesPattern = (pattern, title) =>
    pattern.text !== undefined ? pattern.text === title : pattern.regex.test(title)

// tags declaradas nas opções do it/describe; problemas quando não são texto literal
const readTags = (options, where, problems) => {
    if (!options) return []
    if (options.type !== 'ObjectExpression') {
        problems.push(`${where}: as opções do teste precisam ser um objeto literal ({ tags: [...] })`)
        return []
    }
    const tags = []
    for (const prop of options.properties) {
        if (prop.type !== 'ObjectProperty') {
            problems.push(`${where}: as opções do teste não podem usar spread (...)`)
            continue
        }
        const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value
        if (key !== 'tags') continue
        const values = prop.value.type === 'ArrayExpression' ? prop.value.elements : [prop.value]
        for (const value of values) {
            if (value && value.type === 'StringLiteral') tags.push(value.value)
            else problems.push(`${where}: tag que não é texto literal (use '@tag', não variáveis ou expressões)`)
        }
    }
    return tags
}

const readSpec = (file) => {
    const ast = parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', errorRecovery: false })
    const tests = []
    const problems = []

    const visit = (node, suites) => {
        if (!node || typeof node.type !== 'string') return
        if (node.type === 'CallExpression') {
            const name = calleeName(node.callee)
            if (SUITE_FUNCTIONS.has(name) || TEST_FUNCTIONS.has(name)) {
                const where = `${file}:${node.loc.start.line}`
                const [titleNode, second, third] = node.arguments
                const options = third ? second : null
                const callback = third || second
                const pattern = titlePattern(titleNode)
                if (!pattern) problems.push(`${where}: o título precisa ser texto ou template literal`)
                const tags = readTags(options, where, problems)

                if (SUITE_FUNCTIONS.has(name)) {
                    visit(callback, [...suites, { pattern, tags }])
                } else {
                    tests.push({
                        file,
                        line: node.loc.start.line,
                        patterns: [...suites.map((s) => s.pattern), pattern],
                        tags: [...new Set([...suites.flatMap((s) => s.tags), ...tags])],
                    })
                }
                return
            }
        }
        for (const key of Object.keys(node)) {
            if (key === 'loc' || key === 'start' || key === 'end') continue
            const child = node[key]
            if (Array.isArray(child)) child.forEach((c) => visit(c, suites))
            else if (child && typeof child.type === 'string') visit(child, suites)
        }
    }

    visit(ast.program, [])
    return { tests, problems }
}

const readAllSpecs = (files = listSpecs()) => {
    const results = files.map(readSpec)
    return { tests: results.flatMap((r) => r.tests), problems: results.flatMap((r) => r.problems) }
}

// testes do código que casam com um teste executado (mesmo arquivo e mesmo
// caminho de títulos, segmento por segmento)
const findMatches = (codeTests, file, titlePath) =>
    codeTests.filter(
        (t) =>
            path.normalize(t.file) === path.normalize(file) &&
            t.patterns.length === titlePath.length &&
            t.patterns.every((p, i) => p && matchesPattern(p, titlePath[i])),
    )

const describeTest = (t) => `${t.file}:${t.line} (${t.patterns.map((p) => (p ? p.source : '?')).join(' › ')})`

module.exports = { ALLOWED_TAGS, listSpecs, readAllSpecs, findMatches, describeTest }
