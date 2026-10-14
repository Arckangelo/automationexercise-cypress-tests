// BUG-03 (ver BUGS.md)
// O navegador bloqueia recursos http:// em páginas https:// (Mixed Content),
// então as fontes Roboto, Open Sans e Abel nunca carregam.
describe('[BUG-03] Front-end - Mixed Content nas folhas de estilo', () => {

    // Checar só os <link href="http://..."> do HTML NÃO pega este bug: o
    // recurso inseguro vem de um @import dentro do CSS (main.css, linhas 5–7).
    // Por isso o teste baixa cada CSS do próprio site e inspeciona o conteúdo.
    it('[BUG-03] as folhas de estilo do site não devem importar recursos via http://', () => {
        cy.visit('/')

        cy.document().then((doc) => {
            const cssDoSite = [...doc.querySelectorAll('link[rel="stylesheet"]')]
                .map((link) => link.href)
                .filter((href) => new URL(href).origin === doc.location.origin)

            expect(cssDoSite, 'folhas de estilo do site').to.not.be.empty

            cssDoSite.forEach((href) => {
                cy.request(href).its('body').then((css) => {
                    const importsInseguros = css.match(/@import\s+url\(\s*['"]?http:\/\/[^)]+\)/g) || []
                    expect(importsInseguros, `@import http:// em ${href}`).to.be.empty
                })
            })
        })
    })
})
