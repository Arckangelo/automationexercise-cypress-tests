import { ordenarIds } from './catalogo'
import {
  TENTATIVAS, ESPERA_ENTRE_TENTATIVAS, htmlEhPaginaDeEspera, documentoEhPaginaDeEspera,
  erroSiteIndisponivel, guardarPaginaDeEspera,
} from './paginaDeEspera'

// cy.visit confere se carregou o site de verdade, e não a página de espera
// (ver paginaDeEspera.js). Se for a página de espera, visita de novo; se ela
// persistir, o teste falha com "Site indisponível" em vez de passar.
Cypress.Commands.overwrite('visit', (visitar, url, opcoes, tentativa = 1) => {
  // o visit original devolve uma promise, não uma cadeia: roda dentro de um .then
  return cy.wrap(null, { log: false })
    .then({ timeout: Cypress.config('pageLoadTimeout') }, () => visitar(url, opcoes))
    .then(() => cy.document({ log: false }))
    .then((doc) => {
      if (!documentoEhPaginaDeEspera(doc)) return cy.window({ log: false })
      guardarPaginaDeEspera(doc.documentElement.outerHTML, `GET ${url}`)
      if (tentativa >= TENTATIVAS) throw erroSiteIndisponivel(`GET ${url}`)
      cy.wait(ESPERA_ENTRE_TENTATIVAS, { log: false })
      return cy.visit(url, opcoes, tentativa + 1)
    })
})

// cy.request é o ponto único de proteção contra a instabilidade do site, para
// toda leitura por HTTP (inclusive cy.apiRequest e os comandos que leem páginas).
// Repete só a própria requisição, em vez de o Cypress repetir o teste inteiro:
//   - 503 ou 429 (sobrecarga);
//   - resposta 2xx com HTML sem o logo do site: a página de espera
//     (ver paginaDeEspera.js). JSON, texto puro e páginas 4xx/5xx não entram.
// Se persistir, falha com "Site indisponível". Os demais status seguem a regra
// de sempre: com failOnStatusCode (padrão), 4xx/5xx falham o teste.
const SOBRECARGA = [429, 503]

const opcoesDaRequisicao = (args) => {
  if (typeof args[0] === 'object') return { ...args[0] }
  if (args.length === 1) return { url: args[0] }
  if (args.length === 2) return /^[A-Z]+$/.test(args[0]) ? { method: args[0], url: args[1] } : { url: args[0], body: args[1] }
  return { method: args[0], url: args[1], body: args[2] }
}

Cypress.Commands.overwrite('request', (requisitar, ...args) => {
  const opcoes = opcoesDaRequisicao(args)
  const onde = `${opcoes.method || 'GET'} ${opcoes.url}`
  const espera = (opcoes.timeout || Cypress.config('responseTimeout')) + 1000

  const tentar = (tentativa) => cy.wrap(null, { log: false })
    // o request original devolve uma promise, não uma cadeia: roda dentro de um .then
    .then({ timeout: espera }, () => requisitar({ ...opcoes, failOnStatusCode: false }))
    .then((resposta) => {
      if (SOBRECARGA.includes(resposta.status)) {
        if (tentativa >= TENTATIVAS) throw erroSiteIndisponivel(onde, `HTTP ${resposta.status}`)
        cy.wait(ESPERA_ENTRE_TENTATIVAS, { log: false })
        return tentar(tentativa + 1)
      }
      if (resposta.status >= 200 && resposta.status < 300 && htmlEhPaginaDeEspera(resposta.body)) {
        guardarPaginaDeEspera(resposta.body, onde)
        if (tentativa >= TENTATIVAS) throw erroSiteIndisponivel(onde)
        cy.wait(ESPERA_ENTRE_TENTATIVAS, { log: false })
        return tentar(tentativa + 1)
      }
      if (opcoes.failOnStatusCode !== false && resposta.status >= 400) {
        throw new Error(`${onde} respondeu HTTP ${resposta.status}`)
      }
      return resposta
    })

  return tentar(1)
})

// Login por HTTP (mesmo formulário da tela, sem renderizar a página): para
// testes em que o login é só preparação. O login pela tela é coberto em login.cy.js.
Cypress.Commands.add('entrarPorRequisicao', (email, password) => {
  cy.request('/login').then(({ body }) => {
    const token = Cypress.$(body).find('form[action="/login"] [name="csrfmiddlewaretoken"]').val()
    expect(token, 'formulário de login carregado').to.be.a('string').and.not.be.empty

    cy.request({
      method: 'POST',
      url: '/login',
      form: true,
      headers: { referer: `${Cypress.config('baseUrl')}/login` },
      body: { csrfmiddlewaretoken: token, email, password },
      log: false,
    })
  })
  cy.request('/').its('body').should('include', 'Logged in as')
})

Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    // por HTTP: o login é preparação; entrarPorRequisicao já confere que funcionou
    cy.entrarPorRequisicao(email, password)
  }, {
    // a cada teste, confere se a sessão salva ainda é válida
    validate() {
      cy.request('/').its('body').should('include', 'Logged in as')
    },
    cacheAcrossSpecs: true,
  })
})

// Login pelo formulário, sem cy.session: para quando o próprio login pela tela
// faz parte do teste (ex.: a tentativa recusada depois de excluir a conta).
Cypress.Commands.add('entrarPelaTela', (email, password) => {
  cy.visit('/login')
  cy.get('[data-qa="login-email"]').type(email)
  cy.get('[data-qa="login-password"]').type(password, { log: false })
  cy.get('[data-qa="login-button"]').click()
})

// Itens do carrinho no servidor, como { idDoProduto: quantidade }.
Cypress.Commands.add('itensDoCarrinho', () => {
  // a página de espera (carrinho "vazio") é barrada pelo cy.request
  return cy.request('/view_cart').its('body').then((body) => {
    const doc = new DOMParser().parseFromString(body, 'text/html')
    return Object.fromEntries([...doc.querySelectorAll('tr[id^="product-"]')].map((linha) => [
      linha.id.replace('product-', ''),
      Number(linha.querySelector('.cart_quantity button').textContent.trim()),
    ]))
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
// A página de espera e a sobrecarga já são tratadas pelo cy.request.
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

// Envia a 1ª etapa do cadastro (/login -> /signup) como o navegador enviaria, mas
// sem a validação dos campos na tela (type="email", required). Devolve o HTML da resposta.
Cypress.Commands.add('enviarSignupSemNavegador', (name, email) => {
  return cy.request('/login').then(({ body }) => {
    const token = Cypress.$(body).find('form[action="/signup"] [name="csrfmiddlewaretoken"]').val()
    expect(token, 'formulário de cadastro carregado').to.be.a('string').and.not.be.empty

    return cy.request({
      method: 'POST',
      url: '/signup',
      form: true,
      headers: { referer: `${Cypress.config('baseUrl')}/login` },
      body: { csrfmiddlewaretoken: token, name, email, form_type: 'signup' },
    })
  }).its('body')
})

// Preenche o formulário de /payment com um cartão de users.json > cartoes e clica em pagar.
Cypress.Commands.add('pagar', (cartao) => {
  cy.get('[data-qa="name-on-card"]').type(cartao.nome)
  cy.get('[data-qa="card-number"]').type(cartao.numero)
  cy.get('[data-qa="cvc"]').type(cartao.cvc)
  cy.get('[data-qa="expiry-month"]').type(cartao.mes)
  cy.get('[data-qa="expiry-year"]').type(cartao.ano)
  cy.get('[data-qa="pay-button"]').click()
})

// Envia o formulário de /payment como o navegador enviaria, mas sem a validação
// dos campos (required). Não segue o redirecionamento: devolve a resposta do POST.
Cypress.Commands.add('enviarPagamentoSemNavegador', (cartao) => {
  return cy.request('/payment').then(({ body }) => {
    const token = Cypress.$(body).find('#payment-form [name="csrfmiddlewaretoken"]').val()
    // sem o formulário (ex.: página de espera do site) o POST daria 403 e o teste passaria sem motivo
    expect(token, 'formulário de pagamento carregado').to.be.a('string').and.not.be.empty

    return cy.request({
      method: 'POST',
      url: '/payment',
      form: true,
      followRedirect: false,
      headers: { referer: `${Cypress.config('baseUrl')}/payment` },
      body: {
        csrfmiddlewaretoken: token,
        name_on_card: cartao.nome,
        card_number: cartao.numero,
        cvc: cartao.cvc,
        expiry_month: cartao.mes,
        expiry_year: cartao.ano,
      },
    })
  })
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