# 🐞 Bugs encontrados — AutomationExercise

Bugs identificados durante a exploração do site e da API pública, cada um coberto por um teste
automatizado de regressão em [`cypress/e2e/known-bugs/`](cypress/e2e/known-bugs/).

> 📄 Relatório completo, com análise de causa raiz, soluções propostas e plano de correção:
> **[docs/Relatorio_de_Bugs.pdf](docs/Relatorio_de_Bugs.pdf)**

**Última verificação:** 14/10/2026 · **Ambiente:** https://automationexercise.com (produção, Chrome/Electron)

| ID | Severidade | Área | Resumo | Teste |
|----|-----------|------|--------|-------|
| [BUG-01](#bug-01--carrinho-aceita-quantidade-negativa) | Alta | Carrinho | Aceita quantidade negativa, gerando total negativo | `cart-quantity.cy.js` |
| [BUG-02](#bug-02--carrinho-aceita-quantidade-zero) | Média | Carrinho | Aceita quantidade zero, gerando item com total Rs. 0 | `cart-quantity.cy.js` |
| [BUG-03](#bug-03--fontes-bloqueadas-por-mixed-content) | Baixa | Front-end | Fontes importadas via `http://` são bloqueadas (Mixed Content) | `mixed-content.cy.js` |
| [BUG-04](#bug-04--api-retorna-http-200-em-respostas-de-erro) | Média | API | Respostas de erro retornam HTTP 200 | `api-http-status.cy.js` |
| [BUG-05](#bug-05--api-declara-content-type-incorreto) | Baixa | API | JSON servido com `Content-Type: text/html` | `api-http-status.cy.js` |

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

**Escopo:** home, página de produto, carrinho e API pública. Cadastro, login, checkout,
pagamento e o upload do *Contact Us* não fizeram parte desta rodada exploratória.

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

Resultado esperado atualmente: **9 testes, 9 falhas**, todas pelas asserções que descrevem os bugs.
