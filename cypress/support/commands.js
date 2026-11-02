import { ordenarIds } from './catalogo'

Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login')
    cy.get('[data-qa="login-email"]').type(email)
    cy.get('[data-qa="login-password"]').type(password, { log: false })
    cy.get('[data-qa="login-button"]').click()

    // garante que o login funcionou antes de salvar a sessão
    cy.get('.shop-menu a:has(.fa-user)').should('be.visible')
  }, {
    // a cada teste, confere se a sessão salva ainda é válida
    validate() {
      cy.request('/').its('body').should('include', 'Logged in as')
    },
    cacheAcrossSpecs: true,
  })
})

Cypress.Commands.add('limparCarrinho', () => {
  cy.request('/view_cart').then(({ body }) => {
    const doc = new DOMParser().parseFromString(body, 'text/html')
    const ids = [...doc.querySelectorAll('.cart_quantity_delete')]
      .map(el => el.dataset.productId)

    ids.forEach(id => {
      cy.request(`/delete_cart/${id}`).its('status').should('eq', 200)
    })
  })
})

// Adiciona o produto pelo mesmo endpoint do botão "Add to cart", sem passar
// pela tela: para testes que precisam de um carrinho montado, mas verificam
// outra coisa (remoção, checkout, endereço).
Cypress.Commands.add('adicionarAoCarrinho', (id) => {
  cy.request(`/add_to_cart/${id}`).its('status').should('eq', 200)
})

// --- Comandos de leitura da tela ---

// texto exato do elemento, sem espaços nas pontas (respeita o .within())
Cypress.Commands.add('textoDe', (seletor) => {
  return cy.get(seletor).invoke('text').invoke('trim')
})

// nome exibido no menu em "Logged in as <nome>" (item com o ícone de usuário)
Cypress.Commands.add('usuarioLogado', () => {
  return cy.textoDe('.shop-menu a:has(.fa-user) b')
})

// busca pela caixa da página /products e espera a lista de resultados
Cypress.Commands.add('buscarProduto', (termo) => {
  cy.visit('/products')
  cy.get('#search_product').type(termo)
  cy.get('#submit_search').click()
  cy.get('.features_items h2.title').should('have.text', 'Searched Products')
})

// IDs dos produtos na lista principal, em ordem crescente (lista vazia se não
// houver nenhum), para comparar com os IDs de usarCatalogo()
Cypress.Commands.add('idsNaTela', () => {
  return cy.get('.features_items').then(($lista) => ordenarIds(
    $lista.find('.productinfo a.add-to-cart').toArray().map((botao) => Number(botao.dataset.productId))))
})

// --- Comandos de API ---
// A API do automationexercise.com sempre responde com HTTP 200, mesmo em
// cenários de erro (método não suportado, parâmetro faltando, etc.) — quem
// diz o que realmente aconteceu é o campo "responseCode" no corpo da
// resposta. Por isso os comandos usam failOnStatusCode: false e os testes
// checam response.body.responseCode, nunca response.status.
//
// Outra pegadinha da API: ela manda o corpo como JSON, mas declara o
// header Content-Type como "text/html". O Cypress só faz o parse
// automático do corpo quando o Content-Type é "application/json", então
// sem esse ajuste response.body chegaria como STRING crua nos testes.
// cy.apiRequest() centraliza esse parse pra todos os outros comandos.
Cypress.Commands.add('apiRequest', (options) => {
  return cy.request({ failOnStatusCode: false, ...options }).then((response) => {
    const rawBody = response.body
    let body

    if (typeof rawBody === 'string') {
      try {
        body = JSON.parse(rawBody)
      } catch (e) {
        throw new Error(
          `Resposta inválida em ${options.method || 'GET'} ${options.url}\n` +
          `Content-Type: ${response.headers['content-type'] || ''}\n` +
          `Status: ${response.status}\n` +
          `Body: ${String(rawBody).slice(0, 200)}`
        )
      }
    } else {
      body = rawBody
    }

    if (!body || typeof body !== 'object' || !('responseCode' in body)) {
      throw new Error(
        `Resposta da API sem payload esperado em ${options.method || 'GET'} ${options.url}\n` +
        `Content-Type: ${response.headers['content-type'] || ''}\n` +
        `Status: ${response.status}\n` +
        `Body: ${JSON.stringify(body || '').slice(0, 200)}`
      )
    }

    return { ...response, body }
  })
})

Cypress.Commands.add('apiGetProductsList', () => {
  return cy.apiRequest({ method: 'GET', url: '/api/productsList' })
})

Cypress.Commands.add('apiGetBrandsList', () => {
  return cy.apiRequest({ method: 'GET', url: '/api/brandsList' })
})

Cypress.Commands.add('apiSearchProduct', (searchTerm) => {
  return cy.apiRequest({
    method: 'POST',
    url: '/api/searchProduct',
    form: true,
    // omite o campo por completo (em vez de mandar string vazia) pra
    // simular de verdade o cenário de "parâmetro ausente"
    body: searchTerm === undefined ? {} : { search_product: searchTerm },
  })
})

Cypress.Commands.add('apiVerifyLogin', (email, password) => {
  const body = {}
  if (email !== undefined) body.email = email
  if (password !== undefined) body.password = password

  return cy.apiRequest({ method: 'POST', url: '/api/verifyLogin', form: true, body })
})

Cypress.Commands.add('apiCreateAccount', (dados) => {
  return cy.apiRequest({ method: 'POST', url: '/api/createAccount', form: true, body: dados })
})

Cypress.Commands.add('apiUpdateAccount', (dados) => {
  return cy.apiRequest({ method: 'PUT', url: '/api/updateAccount', form: true, body: dados })
})

Cypress.Commands.add('apiDeleteAccount', (email, password) => {
  return cy.apiRequest({ method: 'DELETE', url: '/api/deleteAccount', form: true, body: { email, password } })
})

// Único ponto do projeto que chama este endpoint. Ele é o próprio BUG-07 (expõe
// dados sem autenticação): se o site passar a exigir login, o ajuste é só aqui.
Cypress.Commands.add('apiGetUserDetail', (email) => {
  return cy.apiRequest({ method: 'GET', url: '/api/getUserDetailByEmail', qs: { email } })
})

// A consulta devolve os dados do cadastro com 3 campos renomeados e sem a senha
// e o celular. O comando converte a conta enviada no cadastro para esse formato
// e confere que todos os campos foram gravados como enviados.
const NOMES_NA_CONSULTA = { birth_date: 'birth_day', firstname: 'first_name', lastname: 'last_name' }
const FORA_DA_CONSULTA = ['password', 'mobile_number']

Cypress.Commands.add('contaDeveEstarGravada', (conta) => {
  const esperado = Cypress._.mapKeys(
    Cypress._.omit(conta, FORA_DA_CONSULTA),
    (_valor, campo) => NOMES_NA_CONSULTA[campo] || campo,
  )

  return cy.apiGetUserDetail(conta.email).then(({ body }) => {
    expect(body.responseCode, 'conta encontrada').to.eq(200)
    expect(body.user, 'dados gravados').to.include(esperado)
  })
})