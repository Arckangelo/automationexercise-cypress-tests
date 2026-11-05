# Template de especificação para uma nova suíte E2E

Extraído da suíte `automationexercise-cypress-tests` (commit `30a7700`, 04/11/2026). Serve para pedir
uma nova suíte com o mesmo padrão de qualidade. As referências `arquivo:linha` apontam para a
implementação de cada padrão naquele commit. Depois dele, os identificadores e os arquivos de código
foram traduzidos para o inglês (por exemplo, `paginaDeEspera.js` virou `waitPage.js`) e o código foi
formatado; os nomes citados aqui já são os atuais, mas os números de linha podem ter mudado.

---

## 1. Checklist do que informar antes de pedir a suíte

Para cada item: **o que informar**, **por que importa** e **o que dá errado se ficar de fora**.

1. **Sistema e ambiente.** Informe a URL base, se o ambiente é de produção ou de homologação, se é
   compartilhado com outras pessoas e se é permitido criar e apagar dados nele.
   *Por que:* define o `baseUrl` (`cypress.config.js:20`) e a estratégia de dados.
   *Se faltar:* testes rodam no ambiente errado, ou criam lixo e colidem com dados de terceiros.
2. **Fluxos-alvo e prioridade por risco.** Liste os fluxos e diga quais são críticos (dinheiro,
   conta, dados pessoais).
   *Por que:* a cobertura desta suíte foi escolhida por risco; o fluxo de compra completo é o teste
   de maior valor (`cypress/e2e/cart/checkout.cy.js:169-193`).
   *Se faltar:* a suíte cobre o que é fácil, não o que é importante.
3. **Critérios de aceite observáveis.** Para cada fluxo, diga o resultado esperado na tela, no
   servidor e em efeitos colaterais (e-mail, fatura, estoque).
   *Por que:* os testes confirmam o efeito no servidor, não só a mensagem
   (`checkout.cy.js:76-87`, `signup.cy.js:63-66`).
   *Se faltar:* testes que passam com a mensagem de sucesso mesmo quando nada foi gravado.
4. **Fonte de verdade independente.** Indique uma API, banco ou arquivo de referência para
   comparar com a tela.
   *Por que:* os valores esperados vêm da API, não da tela testada (`cypress/support/catalog.js:1-3`,
   `checkout.cy.js:12-14`).
   *Se faltar:* a tela é comparada com ela mesma, e um erro de dado passa como correto.
5. **Perfis de usuário e como criá-los e apagá-los.** Diga quais papéis existem e qual API ou rotina
   cria e remove cada conta.
   *Por que:* cada spec cria a própria conta e a remove ao final (`cypress/support/testUser.js:27-49`).
   *Se faltar:* a suíte passa a depender de contas fixas, que podem ser apagadas ou alteradas por terceiros.
6. **Dados de teste e limpeza.** Diga quais dados podem ser fixos, quais precisam ser únicos por
   execução, e o que **não** pode ser limpo (pedidos, e-mails enviados).
   *Por que:* os modelos ficam em fixtures com `{id}` aleatório (`cypress/fixtures/users.json`,
   `testUser.js:6-14`).
   *Se faltar:* colisões entre execuções e lixo permanente no ambiente.
7. **Regras de negócio e casos de borda.** Informe formatos válidos, campos obrigatórios, limites,
   valores proibidos e classes de equivalência.
   *Por que:* os bugs mais graves desta suíte saíram de bordas: campos vazios, formato inválido,
   carrinho vazio, ID inexistente (`known-bugs/required-fields.cy.js`, `payment-validation.cy.js`).
   *Se faltar:* só o caminho feliz é coberto.
8. **Integrações externas e decisão de mock.** Para cada serviço externo (pagamento, anúncios,
   e-mail, analytics), diga se é real, bloqueado ou simulado, e por quê.
   *Por que:* aqui anúncios são bloqueados (`cypress.config.js:21-30`) e o resto é real.
   *Se faltar:* testes lentos ou instáveis por causa de terceiros, ou mocks que escondem defeitos reais.
9. **Seletores estáveis.** Diga se a aplicação tem `data-testid`/`data-qa` e se o time pode
   adicioná-los.
   *Por que:* a suíte usa `data-qa` onde existe (51 ocorrências) e, fora disso, atributos estáveis
   como `href` e `action` (`login.cy.js:11-18`).
   *Se faltar:* seletores frágeis, quebrando a cada mudança de layout.
10. **Comportamentos conhecidos do ambiente.** Informe instabilidades (páginas de espera, 503, limite
    de requisições) e particularidades do contrato da API.
    *Por que:* a suíte trata a página de espera (`cypress/support/waitPage.js`), o 503/429
    (`commands.js:24-58`) e a API que sempre responde HTTP 200 (`commands.js:161-172`).
    *Se faltar:* falsos positivos (testes que passam na página errada) e falsos bugs.
11. **Política para bugs conhecidos.** Diga se um bug encontrado deve virar teste que falha
    (separado da suíte principal) e onde documentá-lo.
    *Por que:* bugs ficam em `cypress/e2e/known-bugs/`, fora do CI principal (`cypress.config.js:4-8`, `:37-44`).
    *Se faltar:* um bug conhecido quebra a suíte todo dia, ou é aceito como contrato sem registro.
12. **Navegadores, dispositivos e viewport.**
    *Por que:* aqui o CI roda Chrome, Firefox e Edge (`.github/workflows/cypress.yml:24-25`), só em desktop (`cypress.config.js:31-32`).
    *Se faltar:* defeitos de um navegador ou de mobile ficam sem cobertura.
13. **Orçamento de tempo.** Informe o tempo máximo aceitável local e no CI.
    *Por que:* a suíte foi otimizada para ~2min45 no Chrome com amostragem, login por HTTP e repetição
    só da requisição sobrecarregada.
    *Se faltar:* a suíte cresce até ninguém querer rodá-la.
14. **CI e gates.** Informe quando roda (PR, push, agendado), quais checks são obrigatórios e quais
    artefatos guardar.
    *Por que:* o check obrigatório “Suíte principal” agrega a matriz (`cypress.yml:69-83`).
    *Se faltar:* a suíte não protege a branch principal, ou o nome do check não bate com a regra de proteção.
15. **Rastreabilidade.** Defina o prefixo dos IDs de caso de teste e onde registrar bugs (arquivo,
    relatório, issues).
    *Por que:* cada teste tem `// CT-...` e cada bug tem `[BUG-NN]` no título.
    *Se faltar:* não dá para ligar requisito, teste e bug.
16. **Idioma** de títulos, comentários e nomes de comandos.

---

## 2. Padrões obrigatórios

Regras curtas, cada uma verificável por leitura ou busca no código.

1. Todo `it` tem acima um comentário `// CT-<ÁREA>-<ARQUIVO>-NN`; em testes gerados por lista, o ID fica em cada caso.
2. Nenhum `cy.wait(<número>)` nos specs. Espera-se por asserção com retry ou por alias de `cy.intercept` (`checkout.cy.js:22-23`, `:56`).
3. Seletor por `data-qa`/`data-testid` quando existir; senão, atributo estável (`id`, `href`, `action`). Texto só para conferir mensagens.
4. Nenhum e-mail, senha ou dado pessoal escrito no spec: tudo em fixtures, e contas únicas geradas a partir de um modelo com `{id}`.
5. Todo dado criado é removido em `after`/`afterEach`, que aceita “já removido” (200 ou 404) (`account.api.cy.js:27-31`).
6. Preparação por API ou HTTP; a tela só é usada para o que está sendo testado (`checkout.cy.js:4-6`, `commands.js:127-132`).
7. Login reaproveitado com `cy.session` e `validate` (`commands.js:79-90`).
8. Valor esperado vem de fonte independente (API, banco), nunca da própria tela testada.
9. Valor conhecido é comparado de forma exata (`eq`, `deep.equal`), não com `contain`.
10. Efeito no servidor confirmado depois da ação (recarregar a página ou consultar a API), não só a mensagem de sucesso.
11. Asserção negativa (“não aparece”) só depois de garantir que a página certa carregou: a guarda da página de espera no `cy.visit` (`commands.js:7-22`) ou um controle positivo (`login.cy.js:93-96`).
12. Asserções com mensagem: `expect(valor, 'o que é').to...`.
13. A guarda contra página inválida fica só nas sobrescritas de `cy.visit` e `cy.request` (`commands.js`), nunca espalhada pelos comandos; assim todo comando novo já nasce protegido.
14. Instabilidade do ambiente termina em “Site indisponível”, nunca em teste aprovado nem em bug.
15. Bug conhecido: spec em `known-bugs/`, título começando por `[BUG-NN]`, descrevendo o comportamento **correto**, sem retries.
16. Quando não for óbvio, um comentário `// pega:` diz qual defeito a asserção detecta (`checkout.cy.js:65`).
17. Senha digitada com `{ log: false }`.
18. Catálogo grande: amostra por partição de equivalência mais 1 item sorteado e reproduzível; cobertura total pela API (`catalog.js:32-64`, `product-details.cy.js`).
19. Testes locais só no Chrome; o CI roda Chrome, Firefox e Edge.
20. Versões fixadas: Node pelo `.nvmrc`, `npm ci`, actions fixadas por SHA (`cypress.yml:28-41`).

---

## 3. Modelo de prompt

Copie, preencha os campos entre `<>` e apague o que não se aplica.

```text
Crie uma suíte E2E em Cypress para <SISTEMA>, seguindo o padrão de
automationexercise-cypress-tests e as regras de docs/e2e-nova-suite-template.md (seção 2).

AMBIENTE
- URL base: <url>   | tipo: <produção/homologação>   | compartilhado: <sim/não>
- Posso criar e apagar dados? <sim/não; limites>
- Instabilidades conhecidas: <página de espera, 503, limite de requisições...>

FLUXOS (em ordem de risco)
1. <fluxo> — critério de aceite: <resultado na tela + no servidor + efeitos colaterais>
2. ...

FONTE DE VERDADE
- <API/banco/arquivo> para conferir: <quais dados>

USUÁRIOS
- Perfis: <papel: permissões>
- Criar: <endpoint/rotina>   | Apagar: <endpoint/rotina>

DADOS
- Fixos (fixtures): <...>   | Únicos por execução: <...>   | Não limpáveis: <...>

REGRAS DE NEGÓCIO E BORDAS
- Campos obrigatórios / formatos / limites: <...>
- Classes de equivalência relevantes: <...>

INTEGRAÇÕES
- <serviço>: <real | bloquear | simular> porque <motivo>

SELETORES
- Existe data-testid/data-qa? <sim/não/parcial>

BUGS
- Bug encontrado vira teste em known-bugs/ com [BUG-NN] e é registrado em <BUGS.md, relatório, issues>.

EXECUÇÃO
- Navegadores no CI: <chrome, firefox, edge>   | Viewports: <...>
- Orçamento de tempo: local <x min>, CI <y min>
- CI: gatilhos <PR/push/agendado>, check obrigatório <nome>, artefatos <relatório, screenshots>

RASTREABILIDADE
- Prefixo dos casos de teste: CT-<ÁREA>-<ARQUIVO>-NN

REAPROVEITE (adaptando ao novo sistema)
- scripts/cypress.js (ambiente do navegador em qualquer SO)
- cypress.config.js (reporter, separação de known-bugs, blockHosts, retries)
- cypress/support/waitPage.js e as sobrescritas de cy.visit/cy.request em commands.js
- cypress/support/testUser.js (conta descartável por describe)
- cypress/support/catalog.js (fonte de verdade, partição de equivalência, sorteio)
- .github/workflows/cypress.yml, security.yml, codeql.yml e dependabot.yml

ENTREGA
- Specs com IDs CT, fixtures, comandos, README com cobertura e como rodar.
- Rodar só no Chrome localmente e me mostrar os resultados antes do commit.
```

---

## 4. Critério de “pronto”

A nova suíte atinge o mesmo nível quando todos os itens abaixo forem verdadeiros:

1. **Estável:** 3 execuções completas seguidas no Chrome sem nenhuma tentativa repetida (o log não mostra `attempt 2`).
2. **Multinavegador:** passa no CI em Chrome, Firefox e Edge.
3. **Independente:** cada spec passa sozinho (`--spec`) e junto com os outros, em qualquer ordem.
4. **Limpa os próprios dados:** todo dado criado tem remoção num hook que tolera “já removido”; o que não pode ser limpo está documentado.
5. **Sem atalhos proibidos:** a busca por `cy.wait(<número>)` nos specs, `.only(`, `.skip(` e credenciais fixas não encontra nada.
6. **Diagnosticável:** toda falha tem screenshot, uma mensagem de asserção que diz o que era esperado, e aparece no relatório HTML publicado.
7. **Sensível a defeitos:** em cada teste novo, alterar o valor esperado (ou a condição) faz o teste falhar. É a análise de mutação manual citada no `README.md:18`.
8. **Robusto ao ambiente:** simular a instabilidade conhecida (por exemplo, com `cy.intercept` devolvendo a página de espera) termina em “Site indisponível”, nunca em teste aprovado.
9. **Bugs separados:** os testes de bugs conhecidos falham todos pela asserção do bug, e nenhum por instabilidade.
10. **Dentro do orçamento** de tempo informado.
11. **Rastreável:** todo `it` tem ID CT, e o README lista a cobertura por arquivo.

---

## 5. Fraquezas da suíte atual que não devem ser copiadas

1. **Guarda da página de espera espalhada (corrigido):** cada comando conferia a página por conta própria, e dois (`clearCart` e `submitSignupWithoutBrowser`) não conferiam. A guarda foi movida para a sobrescrita do `cy.request`. Na nova suíte, comece já com ela centralizada.
2. **Resumo do CI só detectava correção total (corrigido):** o job de bugs conhecidos olhava o resultado geral e só avisava quando todos passavam. Agora `scripts/bug-summary.js` lista teste a teste cada bug que parou de reproduzir. Na nova suíte, comece já com o resumo por teste.
3. **IDs CT só em comentário:** eles não aparecem no título do teste nem no relatório HTML, então a rastreabilidade não chega ao relatório. Na nova suíte, coloque o ID no título.
4. **Duas camadas de repetição (corrigido):** o `cy.request` repetia até 3 vezes e o Cypress repetia o teste inteiro 2 vezes. Agora há um disjuntor (`waitPage.js`), o teste é repetido só 1 vez (`cypress.config.js`) e o resumo do CI mostra quem precisou da repetição. Na nova suíte, comece já assim.
5. **Comentário desatualizado (corrigido):** `loginViaUi` dizia servir ao carrinho entre sessões, que passou a usar `loginByRequest`. O comentário agora diz que ele serve para quando o próprio login pela tela faz parte do teste. Na nova suíte, revise os comentários sempre que um comando mudar de uso.
6. **Estilo inconsistente:** nomes de comandos em inglês e português (`apiCreateAccount` e `addToCart`), indentação de 2 espaços no `commands.js` e de 4 nos specs, e indentação quebrada em `testUser.js:30-40`.
7. **Ordem confusa no `commands.js`:** comandos de tela e de formulário (`submitSignupWithoutBrowser`, `pagar`) ficam no meio da seção “Comandos de API” (`commands.js:246-296`).
8. **Tratamento de exceções de anúncios redundante:** `e2e.js:5-11` ignora erros de anúncios que o `blockHosts` (`cypress.config.js:22-30`) já impede de carregar. Mantenha só um mecanismo, ou documente por que existem os dois.
9. **Efeitos colaterais não limpáveis:** os testes de pagamento criam pedidos reais no site (`payment-validation.cy.js`, `checkout.cy.js:169-193`) sem forma de apagá-los.
10. **Sem tags nem subconjunto rápido:** a separação é só por pasta (`known-bugs/`); não existe um conjunto de fumaça.
11. **Sem paralelismo dentro de um navegador:** o CI divide só por navegador; não há divisão de specs entre máquinas.
12. **Só desktop:** viewport fixo em 1280x720 (`cypress.config.js:31-32`).
13. **Análise de mutação sem ferramenta:** o README cita (`README.md:18`), mas ela é feita à mão; os comentários `// pega:` são o único registro.
