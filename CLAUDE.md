# Regras para agentes de IA neste projeto

Suíte E2E e de API em Cypress para o site público https://automationexercise.com (site de prática, de
terceiros). Suíte principal em `cypress/e2e/{api,auth,cart,products}`; bugs conhecidos do site em
`cypress/e2e/known-bugs/` (falham enquanto o bug existir). Detalhes em `README.md`, `BUGS.md` e
`docs/e2e-nova-suite-template.md`.

As regras estão em ordem de prioridade. **P1** nunca se quebra; **P2** vale em toda mudança; **P3** é
para quando o assunto aparecer.

## P1 · Crítico

1. **Nada irreversível sem pedido explícito:** commit, push, PR, merge, issue, comentário no GitHub ou
   apagar branch remota só quando a pessoa pedir. Antes do commit, mostre o que mudou e o resultado dos
   testes.
2. **Prove antes de afirmar:** rode os testes afetados antes de dizer que algo funciona. Uma proteção
   nova (guarda, checagem, regra de CI) só vale depois de simular a falha que ela deveria pegar.
3. **Nunca afrouxe uma asserção para o teste passar.** Se o site mudou, investigue; se for defeito do
   site, é bug novo (regra 5).
4. **"Site indisponível" não é resultado:** nem aprovação, nem bug. Teste de bug conhecido tem que falhar
   pela asserção do bug.
5. **Bug novo, antes do commit, confira tudo que fala de bugs:**
   - `BUGS.md`: seção, tabela, contagens e data da última verificação;
   - `README.md`: contagens, tabela de bugs e a arte `docs/img/capa-relatorio.png`;
   - relatório PDF: `docs/relatorio/relatorio.html` e `capa.html` (nova versão), gerado com
     `docs/relatorio/gerar.sh`;
   - teste em `known-bugs/` com `[BUG-NN]` no título e ID `CT-BUGS-<ARQUIVO>-NN`;
   - caso de teste em `docs/casos-de-teste.md` e issue no GitHub;
   - procure o número anterior (ex.: "20 bugs", "BUG-20") para não deixar contagem velha.
6. **Teste que confirma pedido no site leva a tag `@creates-order`.** O site não deixa apagar pedidos; o
   `npm run check:orders` falha o CI se faltar a tag.
7. **Não edite arquivos de teste com o Cypress rodando.**

## P2 · Importante

8. **Rode os testes localmente só no Chrome:** `npm run test:chrome` e
   `npm run test:bugs -- --browser chrome`. Firefox e Edge só quando a pessoa pedir. Durante o
   trabalho, rode só os arquivos afetados (`-- --spec <arquivo>`); a suíte completa, uma vez antes do
   commit.
9. **Sempre por `npm run`:** o `scripts/cypress.js` corrige o ambiente do Electron (`ELECTRON_RUN_AS_NODE`
   herdado do VS Code e sessão Wayland). `npx cypress` direto precisa de
   `env -u ELECTRON_RUN_AS_NODE XDG_SESSION_TYPE=x11`.
10. **Idioma:** identificadores em inglês (variáveis, funções, comandos, arquivos de código, chaves das
    fixtures, aliases). Em português: comentários, títulos de `describe`/`it`, mensagens de erro e de
    asserção, documentação, commits e PRs.
11. **Glossário de tradução:** `notas-locais/glossario.md` existe só na máquina da pessoa (está em
    `.git/info/exclude`). Atualize-o quando renomear um identificador; nunca o coloque num commit.
12. **Rastreabilidade:** todo `it` tem um comentário `// CT-<ÁREA>-<ARQUIVO>-NN`. Teste novo ou alterado
    exige atualizar `docs/casos-de-teste.md`.
13. **Como escrever testes:**
    - sem `cy.wait(<número>)`: espere por asserção ou por alias de `cy.intercept`;
    - nenhum dado fixo no teste: use `users.json`/`apiData.json`, com `{id}` para valores únicos, e
      limpe o que criar num hook que aceita "já removido";
    - preparação por API ou HTTP; a tela só para o que está sendo testado;
    - valor esperado de fonte independente (API), valores exatos e efeito conferido no servidor;
    - a proteção contra instabilidade fica só em `cypress/support/commands/protection.js`; não repita
      guardas em comandos ou testes;
    - comandos novos no arquivo do assunto em `cypress/support/commands/`.
14. **Antes do commit:** `npm run format`, `npm run check:tags` e os testes afetados.
15. **Dependências:** versão exata, publicada há pelo menos duas semanas; `npm audit --audit-level=high`
    precisa passar.

## P3 · Complementar

16. **Paralelismo no CI:** não divida os testes entre máquinas enquanto a etapa de testes de um job de
    navegador ficar abaixo de ~5 minutos.
17. **Análise de mutação:** ao alterar um teste coberto por `cypress/mutations/catalog.js`, rode
    `npm run test:mutation -- <ids>` e mantenha o catálogo e os comentários `// pega:` em dia.
18. **Commits e PRs:** em português, explicando o porquê; o PR traz a validação feita.
19. **Documentação:** mudança de comportamento atualiza o `README.md` e, se afetar o padrão, o
    `docs/e2e-nova-suite-template.md`.

## Comandos

```bash
npm run test:chrome          # suíte principal no Chrome
npm run test:smoke           # só os testes @smoke (~1 min)
npm run test:bugs -- --browser chrome
npm run test:mobile          # suíte numa tela de celular
npm run test:mutation        # análise de mutação
npm run format && npm run check:tags
```
