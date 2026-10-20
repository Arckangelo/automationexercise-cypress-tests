# 🐞 Bugs encontrados — AutomationExercise

Bugs identificados durante a exploração do site e da API pública, cada um coberto por um teste
automatizado de regressão em [`cypress/e2e/known-bugs/`](cypress/e2e/known-bugs/).

> 📄 Relatório completo, com análise de causa raiz, soluções propostas e plano de correção:
> **[docs/Relatorio_de_Bugs.pdf](docs/Relatorio_de_Bugs.pdf)**

**Última verificação:** 16/10/2026 · **Ambiente:** https://automationexercise.com (produção, Chrome/Electron)

| ID | Severidade | Área | Resumo | Teste |
|----|-----------|------|--------|-------|
| [BUG-01](#bug-01--carrinho-aceita-quantidade-negativa) | Alta | Carrinho | Aceita quantidade negativa, gerando total negativo | `cart-quantity.cy.js` |
| [BUG-02](#bug-02--carrinho-aceita-quantidade-zero) | Média | Carrinho | Aceita quantidade zero, gerando item com total Rs. 0 | `cart-quantity.cy.js` |
| [BUG-03](#bug-03--fontes-bloqueadas-por-mixed-content) | Baixa | Front-end | Fontes importadas via `http://` são bloqueadas (Mixed Content) | `mixed-content.cy.js` |
| [BUG-04](#bug-04--api-retorna-http-200-em-respostas-de-erro) | Média | API | Respostas de erro retornam HTTP 200 | `api-http-status.cy.js` |
| [BUG-05](#bug-05--api-declara-content-type-incorreto) | Baixa | API | JSON servido com `Content-Type: text/html` | `api-http-status.cy.js` |
| [BUG-06](#bug-06--conta-é-excluída-por-um-get-sem-confirmação) | Alta | Conta | `GET /delete_account` exclui a conta logada, sem confirmação nem token CSRF | `account-security.cy.js` |
| [BUG-07](#bug-07--api-expõe-dados-pessoais-sem-autenticação) | Alta | API | `getUserDetailByEmail` devolve nome, endereço e nascimento de qualquer e-mail, sem autenticação | `account-security.cy.js` |
| [BUG-08](#bug-08--contact-us-confirma-o-envio-mas-não-envia-nada) | Alta | Contato | *Contact Us* exibe "Success!" mas a mensagem nunca é enviada | `forms-not-submitted.cy.js` |
| [BUG-09](#bug-09--quantidade-vazia-ou-não-inteira-gera-erro-500) | Média | Carrinho | Quantidade vazia, decimal ou `1e2` gera HTTP 500 com página de debug, sem aviso ao usuário | `cart-quantity.cy.js` |
| [BUG-10](#bug-10--assinatura-da-newsletter-não-é-registrada) | Média | Newsletter | Assinatura exibe sucesso, mas nada é enviado ao servidor | `forms-not-submitted.cy.js` |
| [BUG-11](#bug-11--avaliação-de-produto-não-é-enviada) | Média | Produto | Avaliação exibe agradecimento, mas nada é enviado ao servidor | `forms-not-submitted.cy.js` |

---

## Metodologia

1. **Exploração guiada por evidências:** cenários reais de navegador (Chromium headless via
   Playwright) foram capturados com a ferramenta REA, que registra eventos de console, erros
   de página, tráfego de rede e a árvore de acessibilidade ao final de cada cenário.
2. **Confirmação manual:** cada achado foi reproduzido de forma independente, pela interface e
   via `curl` no caso da API.
3. **Automação:** cada bug confirmado virou um teste de regressão com Cypress.

Exemplo de cenário capturado (BUG-01, quantidade negativa no carrinho):

```json
{
  "start_url": { "url": "https://automationexercise.com/product_details/1" },
  "actions": [
    { "step_id": "fill-qty", "action": "fill",
      "locator": { "kind": "css", "selector": "#quantity" },
      "value": { "source": "literal", "value": "-3" } },
    { "step_id": "add", "action": "click",
      "locator": { "kind": "css", "selector": "button.cart" } },
    { "step_id": "modal", "action": "wait_for",
      "locator": { "kind": "css", "selector": "#cartModal .modal-content" }, "state": "visible" },
    { "step_id": "cart", "action": "goto",
      "destination": { "url": "https://automationexercise.com/view_cart" }, "wait_until": "load" }
  ],
  "capture": { "at_end": ["accessibility", "url"], "events": ["network"] }
}
```

**Escopo:** a primeira rodada (14/10/2026, BUG-01 a BUG-05) cobriu home, página de produto,
carrinho e API pública. A segunda rodada (16/10/2026, BUG-06 a BUG-11) cobriu conta logada,
pedido completo, *Contact Us*, newsletter, avaliações de produto e a coerência entre listagem,
detalhe e API. O upload de arquivo do *Contact Us* e os meios de pagamento reais não foram testados.

Na segunda rodada, cada achado foi reproduzido pelo menos duas vezes. Como a REA não trata
diálogos JavaScript, o envio do *Contact Us* com o `confirm()` aceito foi confirmado com um
script do Playwright, que registrou todas as requisições depois do clique.

---

## BUG-01 — Carrinho aceita quantidade negativa

**Severidade:** Alta — afeta diretamente o valor do pedido.

**Passos para reproduzir**
1. Acessar `/product_details/1` (Blue Top).
2. Informar `-3` no campo *Quantity*.
3. Clicar em *Add to cart* e depois em *View Cart*.

**Resultado esperado:** a quantidade é rejeitada (mínimo 1) e o produto não é adicionado com valor inválido.

**Resultado obtido:** o carrinho exibe `Blue Top | Rs. 500 | -3 | Rs. -1500`.

**Evidência:** o servidor aceita `GET /add_to_cart/1?quantity=-3` com HTTP 200.

**Causa provável:** o campo declara `min="1"` no HTML, mas a regra não é validada nem no
front-end (o valor é enviado sem checagem) nem no back-end.

## BUG-02 — Carrinho aceita quantidade zero

**Severidade:** Média.

**Passos para reproduzir:** os mesmos do BUG-01, informando `0` como quantidade.

**Resultado esperado:** a quantidade é rejeitada (mínimo 1).

**Resultado obtido:** o carrinho exibe `Blue Top | Rs. 500 | 0 | Rs. 0`.

**Causa provável:** a mesma do BUG-01.

## BUG-03 — Fontes bloqueadas por Mixed Content

**Severidade:** Baixa — impacto visual (as fontes caem para o fallback do navegador).

**Passos para reproduzir**
1. Acessar `https://automationexercise.com/` com o DevTools aberto.
2. Observar o console.

**Resultado esperado:** todos os recursos carregados via HTTPS, sem avisos de Mixed Content.

**Resultado obtido:**
```
Mixed Content: The page at 'https://automationexercise.com/' was loaded over HTTPS, but requested
an insecure stylesheet 'http://fonts.googleapis.com/css?family=Roboto...'. This request has been blocked; the content must be served over HTTPS.
```

**Origem:** `/static/css/main.css`, linhas 5–7:
```css
@import url(http://fonts.googleapis.com/css?family=Roboto:400,300,400italic,500,700,100);
@import url(http://fonts.googleapis.com/css?family=Open+Sans:400,800,300,600,700);
@import url(http://fonts.googleapis.com/css?family=Abel);
```

**Correção sugerida:** trocar `http://` por `https://` nos três `@import`.

## BUG-04 — API retorna HTTP 200 em respostas de erro

**Severidade:** Média — clientes HTTP, monitoramento e caches tratam essas respostas como sucesso.

**Resultado esperado:** o status HTTP reflete o erro (4xx).

**Resultado obtido:** o status HTTP é sempre 200 e o erro real aparece só no campo `responseCode` do corpo.

| Requisição | Status HTTP | `responseCode` no corpo |
|---|---|---|
| `POST /api/productsList` | 200 | 405 |
| `PUT /api/brandsList` | 200 | 405 |
| `DELETE /api/verifyLogin` | 200 | 405 |
| `POST /api/searchProduct` (sem `search_product`) | 200 | 400 |
| `POST /api/verifyLogin` (parâmetros na query string) | 200 | 400 |

## BUG-05 — API declara Content-Type incorreto

**Severidade:** Baixa.

**Passos para reproduzir:** `curl -i https://automationexercise.com/api/productsList`

**Resultado esperado:** `Content-Type: application/json`.

**Resultado obtido:** o corpo é JSON, mas a resposta declara `Content-Type: text/html; charset=utf-8`.
Por isso clientes como o Cypress não fazem o parse automático (ver `cy.apiRequest` em
[`cypress/support/commands.js`](cypress/support/commands.js)).

## BUG-06 — Conta é excluída por um GET sem confirmação

**Severidade:** Alta — perda irreversível da conta e do histórico do usuário.

**Passos para reproduzir**
1. Entrar com uma conta de teste.
2. Abrir `https://automationexercise.com/delete_account` (basta um link ou a barra de endereço).

**Resultado esperado:** a exclusão pede confirmação e só acontece por `POST` com token CSRF.

**Resultado obtido:** a página exibe "Account Deleted!" e a conta deixa de existir
(`POST /api/verifyLogin` responde `User not found!`). Reproduzido com duas contas diferentes.

**Risco:** qualquer página ou e-mail com um link para `/delete_account` apaga a conta de quem
estiver logado. O cookie de sessão costuma acompanhar uma navegação vinda de outro site, mas
esse cenário entre origens é inferência e não foi testado.

**Correção sugerida:** aceitar a exclusão só por `POST` com `csrfmiddlewaretoken` (o site já usa o
token do Django nos formulários), depois de uma tela de confirmação.

## BUG-07 — API expõe dados pessoais sem autenticação

**Severidade:** Alta — exposição de dados pessoais e enumeração de contas (OWASP API Top 10:
API3 *Broken Object Property Level Authorization*).

**Passos para reproduzir:** `curl "https://automationexercise.com/api/getUserDetailByEmail?email=<e-mail de uma conta>"`

**Resultado esperado:** a API exige autenticação e devolve apenas os dados do próprio usuário.

**Resultado obtido:** sem nenhuma credencial, a resposta traz `name`, `title`, `birth_day`,
`birth_month`, `birth_year`, `first_name`, `last_name`, `company`, `address1`, `address2`,
`country`, `state`, `city` e `zipcode`. Reproduzido com duas contas de teste criadas para isso.

**Observação:** o endpoint aparece na lista pública de APIs do site, e
[`account.api.cy.js`](cypress/e2e/api/account.api.cy.js) o usa como contrato documentado. Se o site
passar a exigir autenticação, aquele teste da suíte principal precisará ser ajustado.

## BUG-08 — Contact Us confirma o envio, mas não envia nada

**Severidade:** Alta — mensagens de clientes se perdem sem que ninguém perceba.

**Passos para reproduzir**
1. Acessar `/contact_us` e preencher nome, e-mail, assunto e mensagem.
2. Clicar em *Submit* e confirmar com *OK*.

**Resultado esperado:** a mensagem é enviada ao servidor (`POST /contact_us`).

**Resultado obtido:** aparece "Success! Your details have been submitted successfully.", mas nenhuma
requisição sai para o site; só há tráfego de anúncios do Google. Reproduzido 3 vezes.

**Causa:** o script da página intercepta o `submit` e retorna `false` nos dois ramos do `confirm()`:
```js
$("#contact-us-form").on("submit", function() {
    var r = confirm("Press OK to proceed!");
    if (r == true) {
        $(".alert-success").html("Success! Your details have been submitted successfully.");
        // ...
        return false;
    } else {
        return false;
    }
});
```
O `<form>` também não declara `enctype="multipart/form-data"`, então o arquivo anexado não seria
enviado nem se o envio acontecesse.

## BUG-09 — Quantidade vazia ou não inteira gera erro 500

**Severidade:** Média — o produto não entra no carrinho, o usuário não recebe aviso e o servidor
expõe a página de debug do Django.

**Passos para reproduzir**
1. Acessar `/product_details/5`.
2. Apagar o campo *Quantity* (ou digitar `2.5` ou `1e2`, que o campo numérico aceita).
3. Clicar em *Add to cart*.

**Resultado esperado:** mensagem de validação; nenhum erro no servidor.

**Resultado obtido:** `GET /add_to_cart/5?quantity=` (ou `=2.5`, `=1e2`) responde **HTTP 500** com a
página de erro do Django (`DEBUG = True`, traceback de `ValueError`). A tela não abre o modal
"Added!" nem mostra erro, e o carrinho continua vazio. Reproduzido 2 vezes em cada valor.

**Causa provável:** a mesma falta de validação do BUG-01, agora no tipo: o campo não declara `step`,
o `cart.js` envia o texto bruto e o servidor converte com `int()` sem tratar a exceção.

**Correção sugerida:** a do BUG-01 (validar como inteiro no back-end e responder 400) resolve
também este bug; desligar `DEBUG` em produção.

## BUG-10 — Assinatura da newsletter não é registrada

**Severidade:** Média.

**Passos para reproduzir:** no rodapé de qualquer página, informar um e-mail em *Subscription* e
clicar na seta.

**Resultado esperado:** o e-mail é enviado ao servidor e a assinatura é registrada.

**Resultado obtido:** aparece "You have been successfully subscribed!", mas nenhuma requisição é feita
ao site. O `subscription.js` só mostra a mensagem e retorna `false`.

## BUG-11 — Avaliação de produto não é enviada

**Severidade:** Média.

**Passos para reproduzir:** em `/product_details/1`, preencher nome, e-mail e texto em
*Write Your Review* e clicar em *Submit*.

**Resultado esperado:** a avaliação é enviada ao servidor e passa a aparecer no produto.

**Resultado obtido:** aparece "Thank you for your review.", mas nenhuma requisição é feita ao site e
a avaliação não aparece em lugar nenhum. O script da página só mostra a mensagem.

---

## Como os testes de bug funcionam

Os testes em `cypress/e2e/known-bugs/` descrevem o **comportamento correto**. Por isso eles
**falham enquanto o bug existir** e passam a passar quando o bug é corrigido, o que avisa que o
teste pode ir para a suíte principal.

Eles ficam fora da suíte principal (`npm test`) para que bugs conhecidos do site não
mascarem regressões reais. No CI, rodam num job separado que não quebra o pipeline, a cada
push e diariamente, e o relatório HTML fica publicado no
[GitHub Pages](https://arckangelo.github.io/automationexercise-cypress-tests/). Para rodá-los localmente:

```bash
npm run test:bugs        # headless
npm run test:bugs:open   # interface do Cypress
```

Resultado esperado atualmente: **17 testes, 17 falhas**, todas pelas asserções que descrevem os bugs.
