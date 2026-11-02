#!/usr/bin/env node
// Roda o Cypress com um ambiente que funciona em qualquer distro Linux, no
// macOS e no Windows. Uso: node scripts/cypress.js <run|open> [opções do Cypress]
//
// Corrige duas variáveis herdadas do sistema que quebram o navegador Electron:
// - ELECTRON_RUN_AS_NODE: editores feitos em Electron (VS Code, Cursor...) a
//   repassam aos processos filhos; com ela o Cypress roda como Node puro e
//   nem abre ("bad option: --no-sandbox").
// - XDG_SESSION_TYPE=wayland: o Electron passa a usar o Wayland nativo, onde
//   a captura de tela das falhas trava por 30 s e esconde o erro real. Em
//   X11 (XWayland, ou o Xvfb que o Cypress inicia sozinho) funciona.
// Chrome, Firefox e Edge não são afetados por nenhuma das duas.

const { spawnSync } = require('child_process')
const path = require('path')

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
if (process.platform === 'linux' && env.XDG_SESSION_TYPE === 'wayland') {
    env.XDG_SESSION_TYPE = 'x11'
}

// o pacote não exporta "bin/cypress"; localiza o executável pela pasta dele
const cli = path.join(path.dirname(require.resolve('cypress/package.json')), 'bin', 'cypress')
const { status, error } = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], { stdio: 'inherit', env })

if (error) throw error
process.exit(status ?? 1)
