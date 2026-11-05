// Carrinho montado, lido e limpo por HTTP, para testes que verificam outra
// coisa (remoção, checkout, endereço) sem depender dos botões da tela.

// Itens do carrinho no servidor, como { idDoProduto: quantidade }.
Cypress.Commands.add('cartItems', () => {
    // a página de espera (carrinho "vazio") é barrada pelo cy.request
    return cy
        .request('/view_cart')
        .its('body')
        .then((body) => {
            const doc = new DOMParser().parseFromString(body, 'text/html')
            return Object.fromEntries(
                [...doc.querySelectorAll('tr[id^="product-"]')].map((row) => [
                    row.id.replace('product-', ''),
                    Number(row.querySelector('.cart_quantity button').textContent.trim()),
                ]),
            )
        })
})

Cypress.Commands.add('clearCart', () => {
    cy.request('/view_cart').then(({ body }) => {
        const doc = new DOMParser().parseFromString(body, 'text/html')
        const ids = [...doc.querySelectorAll('.cart_quantity_delete')].map((el) => el.dataset.productId)

        ids.forEach((id) => {
            cy.request(`/delete_cart/${id}`).its('status').should('eq', 200)
        })
    })
})

// Adiciona o produto pelo mesmo endpoint do botão "Add to cart", sem passar
// pela tela: para testes que precisam de um carrinho montado, mas verificam
// outra coisa (remoção, checkout, endereço).
Cypress.Commands.add('addToCart', (id) => {
    cy.request(`/add_to_cart/${id}`).its('status').should('eq', 200)
})
