// Catálogo de defeitos simulados (análise de mutação).
//
// O site é de terceiros: não há código para mutar. Os defeitos são injetados na
// fronteira de rede, alterando a resposta do site antes de ela chegar ao teste.
// Para cada defeito, os testes indicados em `tests` precisam FALHAR: se falham,
// o defeito foi "pego"; se passam, ele "sobreviveu" e aponta um teste fraco.
//
// Campos de cada defeito:
// - id / description: identificação (os comentários `// pega:` citam o id)
// - via: 'page' (navegador, cy.intercept) ou 'request' (cy.request, na
//   sobrescrita de commands/protection.js), conforme o teste lê a resposta
// - method / path: requisição alterada (path é uma expressão regular)
// - mutate(body): devolve o corpo alterado; se devolver o mesmo texto, a
//   alteração não se aplicou (o defeito conta como "não aplicado", nunca como pego)
// - spec / tests: onde estão e quais são os testes que devem pegar o defeito
//
// Ativado só com --expose mutant=<id> (scripts/mutation-run.js). Nas execuções
// normais nada aqui é usado.

const addOne = (match, prefix, value) => `${prefix}${Number(value) + 1}`

module.exports = [
    {
        id: 'M01',
        description: 'preço errado no carrinho (Rs. +1 no primeiro item)',
        via: 'page',
        method: 'GET',
        path: /^\/view_cart$/,
        mutate: (body) => body.replace(/(<td class="cart_price">\s*<p>Rs\. )(\d+)/, addOne),
        spec: 'cypress/e2e/cart/checkout.cy.js',
        tests: ['adicionar pela listagem mostra o produto no carrinho'],
    },
    {
        id: 'M02',
        description: 'quantidade não soma no carrinho (2 vira 1)',
        via: 'page',
        method: 'GET',
        path: /^\/view_cart$/,
        mutate: (body) => body.replace('<button class="disabled">2</button>', '<button class="disabled">1</button>'),
        spec: 'cypress/e2e/cart/checkout.cy.js',
        tests: ['adicionar o mesmo produto duas vezes soma quantidade e total'],
    },
    {
        id: 'M03',
        description: 'busca mostra um produto que não contém o termo (troca o ID do primeiro resultado)',
        via: 'page',
        method: 'GET',
        path: /^\/products\?search=/,
        mutate: (body) => body.replace(/(class="productinfo[\s\S]*?data-product-id=")(\d+)/, '$19999'),
        spec: 'cypress/e2e/products/search.cy.js',
        tests: ['termo existente mostra exatamente os produtos que contêm o termo'],
    },
    {
        id: 'M04',
        description: 'filtro de categoria mostra produto de outra categoria (troca o ID do primeiro resultado)',
        via: 'page',
        method: 'GET',
        path: /^\/category_products\/\d+$/,
        mutate: (body) => body.replace(/(class="productinfo[\s\S]*?data-product-id=")(\d+)/, '$19999'),
        spec: 'cypress/e2e/products/filter.cy.js',
        tests: ['categoria Women > Dress mostra exatamente os produtos dessa categoria'],
    },
    {
        id: 'M05',
        description: 'nome errado em "Logged in as" depois do login',
        via: 'page',
        method: 'GET',
        path: /^\/$/,
        mutate: (body) => body.replace(/(Logged in as <b>)[^<]*/, '$1Outro Usuário'),
        spec: 'cypress/e2e/auth/login.cy.js',
        tests: ['credenciais válidas logam o usuário certo'],
    },
    {
        id: 'M06',
        description: 'endereço trocado no checkout (cidade)',
        via: 'page',
        method: 'GET',
        path: /^\/checkout$/,
        mutate: (body) => body.replace(/Sao Paulo/g, 'Campinas'),
        spec: 'cypress/e2e/cart/checkout.cy.js',
        tests: ['checkout mostra o endereço cadastrado do usuário'],
    },
    {
        id: 'M07',
        description: 'valor errado na fatura (total +1)',
        via: 'request',
        method: 'GET',
        path: /^\/download_invoice\/\d+$/,
        mutate: (body) => body.replace(/(amount is )(\d+)/, addOne),
        spec: 'cypress/e2e/cart/checkout.cy.js',
        // cria 1 pedido por rodada (@creates-order)
        tests: ['compra completa: o pagamento confirma o pedido, a fatura traz o total e o carrinho esvazia'],
    },
    {
        id: 'M08',
        description: 'preço da página de detalhe diferente da API (Rs. +1)',
        via: 'request',
        method: 'GET',
        path: /^\/product_details\/\d+$/,
        mutate: (body) => body.replace(/(<span>Rs\. )(\d+)/, addOne),
        spec: 'cypress/e2e/products/product-details.cy.js',
        tests: [
            'a página mostra nome, preço, categoria e marca iguais aos da API (classes de equivalência + 1 sorteado)',
        ],
    },
    {
        id: 'M09',
        description: 'campo "brand" faltando no primeiro produto da API',
        via: 'request',
        method: 'GET',
        path: /^\/api\/productsList$/,
        mutate: (body) => body.replace(/"brand": "[^"]*", /, ''),
        spec: 'cypress/e2e/api/products.api.cy.js',
        tests: ['lista de produtos: todos os itens têm formato válido e IDs únicos'],
    },
    {
        id: 'M10',
        description: 'carrinho da conta não soma o do visitante ao entrar (2 vira 1, lido por HTTP)',
        via: 'request',
        method: 'GET',
        path: /^\/view_cart$/,
        mutate: (body) => body.replace('<button class="disabled">2</button>', '<button class="disabled">1</button>'),
        spec: 'cypress/e2e/cart/cart-session.cy.js',
        tests: ['itens do visitante são somados ao carrinho que a conta já tinha'],
    },
]
