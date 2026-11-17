# Plano de testes — automationexercise-cypress-tests

| | |
|---|---|
| **Versão** | 1.0 · 17/11/2026 |
| **Responsável** | Angelo Roque |
| **Sistema sob teste** | [AutomationExercise](https://automationexercise.com): site e API pública, em produção |
| **Documentos relacionados** | [Casos de teste](casos-de-teste.md) · [BUGS.md](../BUGS.md) · [Relatório de bugs (PDF)](Relatorio_de_Bugs.pdf) · [README](../README.md) |

O plano descreve o que a suíte testa, como, onde, quando e com que critério uma execução é aceita. O
detalhe de cada teste (passos, dados e resultado esperado) fica nos [casos de teste](casos-de-teste.md),
com o mesmo ID `CT-…` do comentário no código.

## 1. Objetivo

- Verificar os fluxos essenciais de um e-commerce (autenticação, cadastro, catálogo, busca, filtros,
  carrinho e compra completa) pela interface e pela API.
- Manter um teste de regressão para cada bug encontrado no site, que falha enquanto o bug existir e
  avisa quando ele para de reproduzir.
- Medir se os testes pegam defeitos de verdade, e não só passam (análise de mutação).

## 2. Sistema sob teste

- **Site:** e-commerce fictício para prática de automação, de terceiros. Não há acesso ao código nem ao
  banco; tudo é observado pela tela e pela API.
- **API:** a [API pública](https://automationexercise.com/api_list) responde HTTP 200 até nos erros
  (BUG-04); quem indica sucesso ou falha é o campo `responseCode` do corpo.
- **Ambiente:** produção pública e compartilhada. O que os testes enviam fica gravado lá (seção 9).

## 3. Escopo

### 3.1 Dentro do escopo

| Área | Funcionalidades | Arquivos | Testes |
|---|---|---|---|
| API | Conta (criar, consultar, atualizar, apagar, permissões, campos obrigatórios), login, produtos e marcas, busca, guarda do catálogo | `cypress/e2e/api/` (5) | 24 |
| Autenticação | Login e logout pela tela, sessão invalidada no servidor, cadastro, exclusão de conta | `cypress/e2e/auth/` (3) | 10 |
| Carrinho | Adicionar, somar, remover, carrinho vazio, checkout, compra completa com fatura, carrinho entre sessões | `cypress/e2e/cart/` (2) | 14 |
| Produtos | Busca, filtros por categoria e marca, página de detalhes comparada à API | `cypress/e2e/products/` (3) | 12 |
| **Suíte principal** | | **13 arquivos** | **60** |
| Bugs conhecidos | Um ou mais testes por bug, BUG-01 a BUG-21 | `cypress/e2e/known-bugs/` (13) | 46 |
| **Total** | | **26 arquivos** | **106** |

### 3.2 Fora do escopo

| Item | Motivo |
|---|---|
| Desempenho e carga | Site público de terceiros: carga seria abuso do serviço |
| Navegadores de celular reais (Safari do iPhone, Chrome do Android) e toque | A suíte simula só a tela do celular (375x667) |
| Acessibilidade e regressão visual | Fora do foco atual da suíte |
| Envio real de e-mail e mensagens | Os formulários não enviam nada hoje (BUG-08, 10 e 11) |
| Testes de intrusão | Os achados de segurança vêm de uso comum do site (URL, API sem autenticação), sem ataque |
| Defeitos de estado no servidor na análise de mutação | Não dá para simular alterando respostas (ex.: logout que não invalida a sessão) |

## 4. Estratégia

### 4.1 Níveis e tipos de teste

| Tipo | O que cobre | Onde |
|---|---|---|
| Funcional E2E (interface) | Fluxos completos na tela, com o efeito conferido no servidor | Suíte principal |
| API | Contrato, regras de negócio e efeito no servidor de cada endpoint | `cypress/e2e/api/` |
| Regressão de bugs conhecidos | Comportamento correto esperado; falha enquanto o bug existir | `cypress/e2e/known-bugs/` |
| Fumaça (`@smoke`) | 6 testes do fluxo crítico: login, cadastro, busca, detalhe, compra completa, criação de conta pela API (~1 min) | Toda execução de CI |
| Compatibilidade | Mesma suíte no Chrome, no Firefox e no Edge | CI |
| Responsividade | Fumaça em toda execução e a suíte inteira uma vez por dia numa tela de 375x667 | CI |
| Teste de guarda | Catálogo da API comparado com a referência conferida (`referenceCatalog`) | `api/catalog.api.cy.js` |
| Análise de mutação | 10 defeitos injetados nas respostas do site (M01 a M10), que os testes indicados precisam pegar | `cypress/mutations/catalog.js` |
| Segurança do pipeline | Segredos (gitleaks), dependências vulneráveis (`npm audit`), análise estática (CodeQL) | Workflows de segurança |

### 4.2 Técnicas de projeto

- **Partição de equivalência:** amostra de detalhes do produto com uma categoria, uma marca, os preços
  extremos, o nome mais longo, o último ID e `&` no texto, mais 1 produto sorteado a cada execução.
- **Valor-limite:** quantidade no carrinho (zero, negativa, decimal) e campos obrigatórios vazios.
- **Oráculo independente:** o valor esperado vem da API, lida na hora do teste, nunca da própria tela.
  As regras (total = soma dos itens, quantidade × preço) ficam no teste.
- **Efeito no servidor:** além da mensagem na tela, o teste confere o resultado (conta criada,
  sessão invalidada, senha não sobrescrita), inclusive depois de recarregar a página.

### 4.3 Princípios de escrita

- Valores exatos em vez de "contém".
- Nenhum dado fixo: contas descartáveis com e-mail único, criadas pela API e removidas por hook que
  aceita "já removido".
- Preparação por API ou HTTP (login, carrinho); a tela só para o que está sendo testado.
- Sem esperas fixas: espera por asserção ou por alias de `cy.intercept`.
- Testes independentes, sem ordem de execução.
- A proteção contra a instabilidade do site fica num lugar só (`cypress/support/commands/protection.js`).

## 5. Priorização

A prioridade de cada caso segue o risco: dinheiro, conta e dados pessoais primeiro.

| Área | Alta | Média | Baixa | Total |
|---|---|---|---|---|
| API | 11 | 10 | 3 | 24 |
| Autenticação | 8 | 2 | 0 | 10 |
| Carrinho | 8 | 6 | 0 | 14 |
| Produtos | 4 | 5 | 3 | 12 |
| Bugs conhecidos | 12 | 22 | 12 | 46 |
| **Total** | **43** | **45** | **18** | **106** |

Os 21 bugs se dividem em 7 de severidade alta, 7 média e 7 baixa ([BUGS.md](../BUGS.md)).

## 6. Critérios

### 6.1 Entrada

- Formatação e tags conferidas (`npm run format:check` e `npm run check:tags`): é o primeiro job do CI.
- Dependências instaladas nas versões do `package-lock.json` (`npm ci`), com Node 24 (`.nvmrc`).
- Site respondendo. Se não responder, a execução é suspensa (6.3).

### 6.2 Saída (execução aceita)

| Execução | Critério |
|---|---|
| Suíte principal | Os 60 testes passam nos três navegadores e na fumaça do celular |
| Testes instáveis | Os que só passaram numa nova tentativa aparecem no resumo do CI como instáveis, com aviso; a nova tentativa não esconde a instabilidade |
| Pedidos | `npm run check:orders` sem falha: todo teste que confirmou pedido tem a tag `@creates-order` |
| Bugs conhecidos | Cada teste falha pela asserção do bug. Um bug que parou de reproduzir aparece no resumo, com aviso, para ser investigado |
| Mutação | Nenhum defeito sobrevive e nenhum fica como "não aplicado", depois de uma linha de base que passa |
| Segurança | gitleaks sem segredo, `npm audit --audit-level=high` sem falha e CodeQL sem alerta |

### 6.3 Suspensão e retomada

- **Suspensão:** o site responde a página de espera ("heavy load"), `429`, `502`-`504` ou `520`-`524`.
  A requisição é repetida até 3 vezes; se o problema persistir, o teste falha com "Site indisponível".
  Esse resultado não conta como aprovação nem como bug.
- **Disjuntor:** depois que o site é declarado indisponível, as próximas falhas do mesmo tipo
  acontecem na hora, sem novas esperas.
- **Retomada:** quando o site volta a responder normalmente, a execução é refeita.

## 7. Ambiente e ferramentas

| Item | Valor |
|---|---|
| Framework | Cypress 16, JavaScript, Mocha/Chai; API por `cy.request` |
| Node | 24 (`.nvmrc`, igual no CI) |
| Navegadores | Chrome, Firefox e Edge no CI; Chrome no trabalho local |
| Telas | 1280x720 (computador) e 375x667 (celular, `--env mobile=true`) |
| Novas tentativas | 1 no modo headless; 0 nos bugs conhecidos e na mutação |
| Bloqueio de terceiros | Anúncios e rastreadores em `blockHosts` (`cypress.config.js`) |
| Filtro por tags | `@cypress/grep`, só com as tags `@smoke` e `@creates-order` |
| Relatórios | `cypress-mochawesome-reporter` (HTML com screenshots das falhas) |
| CI | GitHub Actions (`ubuntu-latest`), relatório publicado no GitHub Pages |

## 8. Cronograma de execução

| Gatilho | O que roda |
|---|---|
| Push na `main` | Formatação e tags, suíte principal nos 3 navegadores, fumaça no celular, todos os bugs conhecidos, publicação do relatório; gitleaks, `npm audit` e CodeQL |
| Pull request | O mesmo, com os bugs conhecidos sem os testes `@creates-order` e sem publicar o relatório |
| Diário, 06:00 UTC | Os testes do push, mais a suíte inteira no celular |
| Segunda-feira, 07:00 UTC | Análise de mutação (~7 min) |
| Semanal | gitleaks e `npm audit` (segunda, 05:00 UTC), CodeQL (domingo, 04:00 UTC), Dependabot |
| Manual | Qualquer workflow, por `workflow_dispatch` |
| Local | Só os arquivos afetados durante o trabalho; suíte completa no Chrome antes do commit |

## 9. Dados de teste

- **Massa:** `cypress/fixtures/users.json` (credenciais modelo, e-mails inválidos, dados de formulário,
  cartão fictício) e `cypress/fixtures/apiData.json` (dados da API e `referenceCatalog`).
- **Identificação:** todo dado enviado é marcado como teste: nome "QA Automatizado", e-mails
  `qa.<id>@teste.com` e textos com "teste automatizado (QA)".
- **Limpeza:** contas apagadas ao fim de cada teste ou `describe`, por hook que roda mesmo com falha;
  o carrinho some com a conta ou a sessão.
- **Pedidos:** ficam no site, que não oferece forma de apagá-los. Por isso a tag `@creates-order` é
  conferida a cada execução.

| Execução | Pedidos confirmados |
|---|---|
| Pull request | 4 (compra completa nos 3 navegadores e na fumaça do celular) |
| Push na `main` | 9 (mais 4 do BUG-20 e 1 do BUG-13) |
| Execução diária | 10 (mais a suíte inteira no celular) |
| Análise de mutação | 2 (linha de base e M07) |

## 10. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Site instável ou sobrecarregado | Repetição só da requisição, disjuntor e resultado "Site indisponível" (6.3); página de espera salva como artefato |
| Mudança de preço ou catálogo derrubar testes | Valor esperado lido da API na hora; só o teste de guarda compara com a referência e diz o que mudou e quanto, marcando como SUSPEITO uma variação acima de 50% |
| Preço errado na própria API, aceito pelos outros testes | Teste de guarda; a falha pede confirmação com quem define os preços antes de atualizar a referência |
| Teste que passa sem pegar defeito | Análise de mutação semanal |
| Filtro por tag que roda zero testes e termina verde | Falha antes de abrir o navegador e ao final, se nenhum teste rodou |
| Tag digitada errada tirar o teste do filtro | `npm run check:tags` no CI |
| Pedido criado sem controle | `npm run check:orders` compara os pedidos registrados com as tags |
| Erro de script de terceiros mascarado | Nenhuma exceção da página é ignorada; a falha lista os domínios de terceiros |
| Instabilidade escondida pela nova tentativa | Resumo de instáveis no CI (`scripts/flaky-summary.js`) |
| Ambiente local do Electron travar | Testes sempre por `npm run`, pelo `scripts/cypress.js` |

## 11. Gestão de defeitos

1. **Investigação:** um comportamento diferente do esperado é investigado; a asserção nunca é afrouxada
   para o teste passar.
2. **Registro:** um defeito confirmado ganha:
   - um ID `BUG-NN` e uma severidade (alta, média ou baixa);
   - uma seção no [BUGS.md](../BUGS.md) e uma linha nas tabelas do BUGS.md e do README;
   - uma seção no relatório PDF, gerado por `docs/relatorio/gerar.sh`;
   - um teste em `cypress/e2e/known-bugs/` com `[BUG-NN]` no título e ID `CT-BUGS-<ARQUIVO>-NN`;
   - um caso em [casos-de-teste.md](casos-de-teste.md) e uma issue no GitHub.
3. **Acompanhamento:** o job de bugs conhecidos roda em todo push e diariamente, sem quebrar o pipeline,
   e lista teste a teste cada bug que parou de reproduzir.
4. **Última verificação dos bugs:** 03/11/2026, em produção, no Chrome.

## 12. Rastreabilidade

| Elemento | Liga com |
|---|---|
| `// CT-<ÁREA>-<ARQUIVO>-NN` acima de cada `it` | O caso de mesmo ID em [casos-de-teste.md](casos-de-teste.md) |
| `[BUG-NN]` no título do teste de bug | A seção do bug no [BUGS.md](../BUGS.md) e no PDF |
| Campo "Bug relacionado" do caso | O bug que o caso cobre ou do qual depende |
| `// pega: Mnn` no teste | O defeito simulado em `cypress/mutations/catalog.js` |

## 13. Entregáveis

| Entregável | Onde |
|---|---|
| Relatório HTML de cada execução (por navegador, celular e bugs conhecidos) | [GitHub Pages](https://arckangelo.github.io/automationexercise-cypress-tests/) e artefatos do CI |
| Resumos do CI: instáveis, bugs que pararam de reproduzir, pedidos | Resumo de cada job no GitHub Actions |
| Casos de teste | [docs/casos-de-teste.md](casos-de-teste.md) |
| Bugs | [BUGS.md](../BUGS.md) e [relatório PDF](Relatorio_de_Bugs.pdf) |
| Plano de testes | Este documento |

## 14. Responsabilidades

| Papel | Responsável |
|---|---|
| Definir o que testar, as regras do projeto e aprovar cada mudança | Angelo Roque |
| Propor e escrever código, testes e documentação; investigar o site; rodar os testes | Claude Code (assistente de IA), sob revisão |
| Manter as dependências e as actions atualizadas | Dependabot, com PRs revisados |
