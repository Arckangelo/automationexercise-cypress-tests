// Leitura e ações na tela.
import { sortIds } from '../catalog'

// texto exato do elemento, sem espaços nas pontas (respeita o .within())
Cypress.Commands.add('textOf', (selector) => {
    return cy.get(selector).invoke('text').invoke('trim')
})

// nome exibido no menu em "Logged in as <nome>" (item com o ícone de usuário)
Cypress.Commands.add('loggedInUser', () => {
    return cy.textOf('.shop-menu a:has(.fa-user) b')
})

// busca pela caixa da página /products e espera a lista de resultados
Cypress.Commands.add('searchProduct', (term) => {
    cy.visit('/products')
    cy.get('#search_product').type(term)
    cy.get('#submit_search').click()
    cy.get('.features_items h2.title').should('have.text', 'Searched Products')
})

// IDs dos produtos na lista principal, em ordem crescente (lista vazia se não
// houver nenhum), para comparar com os IDs de useCatalog()
Cypress.Commands.add('idsOnScreen', () => {
    return cy.get('.features_items').then(($list) =>
        sortIds(
            $list
                .find('.productinfo a.add-to-cart')
                .toArray()
                .map((button) => Number(button.dataset.productId)),
        ),
    )
})

// Preenche o formulário de /payment com um cartão de users.json > cards e clica em pagar.
Cypress.Commands.add('pay', (card) => {
    cy.get('[data-qa="name-on-card"]').type(card.name)
    cy.get('[data-qa="card-number"]').type(card.number)
    cy.get('[data-qa="cvc"]').type(card.cvc)
    cy.get('[data-qa="expiry-month"]').type(card.month)
    cy.get('[data-qa="expiry-year"]').type(card.year)
    cy.get('[data-qa="pay-button"]').click()
})
