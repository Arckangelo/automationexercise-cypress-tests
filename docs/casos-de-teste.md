# Casos de teste — automationexercise-cypress-tests

Um caso de teste para cada teste automatizado, na mesma ordem em que os testes aparecem em cada arquivo de cypress/e2e/, identificado pelo mesmo ID CT do comentário no código. Total: 105 casos.

**Notas gerais**

- Todos os casos rodam contra o site e a API públicos (https://automationexercise.com).
- Contas, carrinhos e dados de teste são criados e removidos pela própria suíte; e-mails são únicos a cada execução.
- O ID de cada caso é o mesmo do comentário `// CT-…` acima do teste no código; o arquivo é o da seção.
- Status "Passou" é o resultado da suíte principal. Nos bugs conhecidos, o esperado é o comportamento correto e o obtido é o do site hoje.

## Índice

| Área | Arquivo | Casos |
|---|---|---|
| API | [api/account.api.cy.js](#apiaccountapicyjs) | 10 |
| API | [api/login.api.cy.js](#apiloginapicyjs) | 6 |
| API | [api/products.api.cy.js](#apiproductsapicyjs) | 4 |
| API | [api/search.api.cy.js](#apisearchapicyjs) | 3 |
| Autenticação | [auth/login.cy.js](#authlogincyjs) | 6 |
| Autenticação | [auth/signup.cy.js](#authsignupcyjs) | 3 |
| Autenticação | [auth/delete-account.cy.js](#authdelete-accountcyjs) | 1 |
| Carrinho | [cart/checkout.cy.js](#cartcheckoutcyjs) | 10 |
| Carrinho | [cart/cart-session.cy.js](#cartcart-sessioncyjs) | 4 |
| Produtos | [products/filter.cy.js](#productsfiltercyjs) | 4 |
| Produtos | [products/search.cy.js](#productssearchcyjs) | 4 |
| Produtos | [products/product-details.cy.js](#productsproduct-detailscyjs) | 4 |
| Bugs conhecidos | [known-bugs/account-security.cy.js](#known-bugsaccount-securitycyjs) | 3 |
| Bugs conhecidos | [known-bugs/api-brands.cy.js](#known-bugsapi-brandscyjs) | 1 |
| Bugs conhecidos | [known-bugs/api-http-status.cy.js](#known-bugsapi-http-statuscyjs) | 8 |
| Bugs conhecidos | [known-bugs/cart-quantity.cy.js](#known-bugscart-quantitycyjs) | 5 |
| Bugs conhecidos | [known-bugs/checkout-access.cy.js](#known-bugscheckout-accesscyjs) | 4 |
| Bugs conhecidos | [known-bugs/email-format.cy.js](#known-bugsemail-formatcyjs) | 6 |
| Bugs conhecidos | [known-bugs/forms-not-submitted.cy.js](#known-bugsforms-not-submittedcyjs) | 3 |
| Bugs conhecidos | [known-bugs/mixed-content.cy.js](#known-bugsmixed-contentcyjs) | 1 |
| Bugs conhecidos | [known-bugs/order-confirmation.cy.js](#known-bugsorder-confirmationcyjs) | 2 |
| Bugs conhecidos | [known-bugs/payment-validation.cy.js](#known-bugspayment-validationcyjs) | 4 |
| Bugs conhecidos | [known-bugs/product-not-found.cy.js](#known-bugsproduct-not-foundcyjs) | 2 |
| Bugs conhecidos | [known-bugs/required-fields.cy.js](#known-bugsrequired-fieldscyjs) | 5 |
| Bugs conhecidos | [known-bugs/search-input.cy.js](#known-bugssearch-inputcyjs) | 2 |
| **Total** | | **105** |

## API

### api/account.api.cy.js

#### CT-API-ACCOUNT-01 — Criar conta com dados válidos

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Conta de usuário › Criação |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Alta |
| **Bug relacionado** | BUG-18 |
| **Objetivo** | Garantir que o cadastro cria a conta e que a senha informada passa a autenticar. |
| **Dados de teste** | Conta padrão com e-mail único. |
| **Passos** | 1. Enviar POST /api/createAccount com todos os campos.<br>2. Verificar o corpo da resposta.<br>3. Enviar POST /api/verifyLogin com o e-mail e a senha cadastrados. |
| **Resultado esperado** | Passo 2: corpo = { responseCode: 201, message: "User created!" }.<br>Passo 3: responseCode = 200 (login válido). |
| **Status** | Passou |
| **Observações** | E-mail em formato inválido é aceito no cadastro: BUG-18, coberto em known-bugs/email-format.cy.js.<br>Contas removidas no afterEach (DELETE /api/deleteAccount aceita 200 ou 404). |

#### CT-API-ACCOUNT-02 — Criar conta sem o campo "name"

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Conta de usuário › Criação |
| **Tipo de teste** | Funcional – negativo (validação) |
| **Prioridade** | Média |
| **Objetivo** | Garantir que a API rejeita cadastro sem nome e não cria conta parcial. |
| **Dados de teste** | Conta padrão com e-mail único, sem o campo name. |
| **Passos** | 1. Enviar POST /api/createAccount sem o campo name.<br>2. Verificar o corpo da resposta.<br>3. Enviar POST /api/verifyLogin com o e-mail e a senha enviados. |
| **Resultado esperado** | Passo 2: corpo = { responseCode: 400, message: "Bad request, name parameter is missing in POST request." }.<br>Passo 3: responseCode = 404 (a conta não foi criada). |
| **Status** | Passou |
| **Observações** | Os demais campos obrigatórios são cobertos no CT-API-ACCOUNT-03. |

#### CT-API-ACCOUNT-03 — Criar conta sem cada um dos demais campos obrigatórios

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Conta de usuário › Criação |
| **Tipo de teste** | Funcional – negativo (validação) |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-19 |
| **Objetivo** | Garantir que a API rejeita o cadastro quando falta qualquer campo obrigatório, informa qual campo faltou e não cria a conta. |
| **Dados de teste** | Conta padrão com e-mail único, omitindo um campo por vez:<br>email, password, firstname, lastname, address1, country, zipcode, state, city, mobile_number. |
| **Passos** | 1. Para cada campo obrigatório da lista, enviar POST /api/createAccount sem esse campo.<br>2. Verificar o corpo de cada resposta.<br>3. Ao final, enviar POST /api/verifyLogin com o e-mail e a senha da conta. |
| **Resultado esperado** | Passo 2 (para cada campo): corpo = { responseCode: 400, message: "Bad request, &lt;campo&gt; parameter is missing in POST request." }.<br>Passo 3: responseCode = 404 (nenhuma das tentativas criou a conta). |
| **Status** | Passou |
| **Observações** | As 10 tentativas ficam num teste só; o log mostra qual campo falhou.<br>name fica no CT-API-ACCOUNT-02; title, nascimento, company e address2 são opcionais.<br>BUG-19: campo obrigatório enviado vazio é aceito (201), inclusive a senha. |

#### CT-API-ACCOUNT-04 — Criar conta com e-mail já cadastrado

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Conta de usuário › Criação |
| **Tipo de teste** | Funcional – negativo (regra de negócio) |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que não há conta duplicada e que a senha da conta original não é sobrescrita. |
| **Pré-condições** | Conta padrão criada via POST /api/createAccount (responseCode 201). |
| **Dados de teste** | E-mail da conta existente + uma senha diferente da original. |
| **Passos** | 1. Enviar POST /api/createAccount com o e-mail existente e a senha diferente.<br>2. Verificar o corpo da resposta.<br>3. Enviar POST /api/verifyLogin com o e-mail e a senha original.<br>4. Enviar POST /api/verifyLogin com o e-mail e a senha diferente. |
| **Resultado esperado** | Passo 2: corpo = { responseCode: 400, message: "Email already exists!" }.<br>Passo 3: responseCode = 200 (a senha original continua válida).<br>Passo 4: responseCode = 404 (a senha nova não foi gravada). |
| **Status** | Passou |
| **Observações** | Verifica o efeito colateral, não só a mensagem: duplicidade ou sobrescrita de senha. |

#### CT-API-ACCOUNT-05 — Consultar conta por e-mail

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Conta de usuário › Consulta |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-07 |
| **Objetivo** | Garantir que a consulta por e-mail devolve exatamente os dados gravados no cadastro. |
| **Pré-condições** | Conta padrão criada via POST /api/createAccount (responseCode 201). |
| **Dados de teste** | E-mail da conta criada. |
| **Passos** | 1. Enviar GET /api/getUserDetailByEmail?email=&lt;e-mail&gt;.<br>2. Comparar body.user com os dados do cadastro. |
| **Resultado esperado** | responseCode = 200.<br>body.user contém, iguais aos do cadastro: name, email, title, birth_day, birth_month, birth_year, first_name, last_name, company, address1, address2, country, state, city, zipcode. |
| **Status** | Passou |
| **Observações** | Três campos mudam de nome na consulta (birth_date → birth_day, firstname → first_name, lastname → last_name); password e mobile_number não são devolvidos.<br>BUG-07: o endpoint expõe esses dados sem autenticação. Usado aqui como contrato atual; se o site passar a exigir login, revisar este caso. |

#### CT-API-ACCOUNT-06 — Atualizar conta com a senha correta

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Conta de usuário › Atualização |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que a atualização altera e persiste os dados da conta. |
| **Pré-condições** | Conta padrão criada via POST /api/createAccount (responseCode 201). |
| **Dados de teste** | city = "Campinas"<br>company = "Empresa Atualizada" |
| **Passos** | 1. Enviar PUT /api/updateAccount com e-mail, senha correta e dados alterados.<br>2. Verificar o corpo da resposta.<br>3. Consultar a conta. |
| **Resultado esperado** | Passo 2: corpo = { responseCode: 200, message: "User updated!" }.<br>Passo 3: city = "Campinas" e company = "Empresa Atualizada"; demais campos iguais ao cadastro. |
| **Status** | Passou |

#### CT-API-ACCOUNT-07 — Atualizar conta com senha errada

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Conta de usuário › Atualização |
| **Tipo de teste** | Segurança – autorização (negativo) |
| **Prioridade** | Alta |
| **Bug relacionado** | BUG-17 |
| **Objetivo** | Garantir que, sem a senha correta, não é possível alterar a conta de outra pessoa. |
| **Pré-condições** | Conta padrão criada via POST /api/createAccount (responseCode 201). |
| **Dados de teste** | Senha incorreta ("senhaerrada")<br>city = "Alterada Indevidamente" |
| **Passos** | 1. Enviar PUT /api/updateAccount com a senha errada e city alterada.<br>2. Verificar o corpo da resposta.<br>3. Consultar a conta. |
| **Resultado esperado** | Passo 2: corpo = { responseCode: 404, message: "Account not found!" } (contrato atual).<br>Passo 3: dados iguais aos do cadastro (city não foi alterada). |
| **Status** | Passou |
| **Observações** | BUG-17: a conta existe, mas a API responde 404 "Account not found!" em vez de 401. O comportamento correto é coberto em known-bugs/account-security.cy.js. Quando o bug for corrigido, atualizar o Resultado esperado. |

#### CT-API-ACCOUNT-08 — Apagar conta com a senha correta

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Conta de usuário › Remoção |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que a conta é de fato removida, e não só que a API responde sucesso. |
| **Pré-condições** | Conta padrão criada via POST /api/createAccount (responseCode 201). |
| **Dados de teste** | E-mail e senha da conta criada. |
| **Passos** | 1. Enviar DELETE /api/deleteAccount com e-mail e senha.<br>2. Verificar o corpo da resposta.<br>3. Enviar POST /api/verifyLogin com e-mail e senha.<br>4. Enviar GET /api/getUserDetailByEmail com o e-mail. |
| **Resultado esperado** | Passo 2: corpo = { responseCode: 200, message: "Account deleted!" }.<br>Passo 3: responseCode = 404.<br>Passo 4: responseCode = 404. |
| **Status** | Passou |
| **Observações** | O afterEach tenta apagar de novo e aceita 404. |

#### CT-API-ACCOUNT-09 — Apagar conta com senha errada

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Conta de usuário › Remoção |
| **Tipo de teste** | Segurança – autorização (negativo) |
| **Prioridade** | Alta |
| **Bug relacionado** | BUG-17 |
| **Objetivo** | Garantir que, sem a senha correta, não é possível apagar a conta de outra pessoa. |
| **Pré-condições** | Conta padrão criada via POST /api/createAccount (responseCode 201). |
| **Dados de teste** | Senha incorreta ("senhaerrada"). |
| **Passos** | 1. Enviar DELETE /api/deleteAccount com o e-mail e a senha errada.<br>2. Verificar o corpo da resposta.<br>3. Enviar POST /api/verifyLogin com e-mail e senha correta. |
| **Resultado esperado** | Passo 2: corpo = { responseCode: 404, message: "Account not found!" } (contrato atual).<br>Passo 3: responseCode = 200 (a conta foi mantida). |
| **Status** | Passou |
| **Observações** | O BUG-17 registra que o DELETE com senha errada responde da mesma forma que o update (404 em vez de 401). |

#### CT-API-ACCOUNT-10 — Apagar conta inexistente

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Conta de usuário › Remoção |
| **Tipo de teste** | Funcional – negativo |
| **Prioridade** | Baixa |
| **Objetivo** | Garantir resposta adequada ao tentar apagar uma conta que não existe. |
| **Dados de teste** | E-mail único, nunca cadastrado. |
| **Passos** | 1. Enviar DELETE /api/deleteAccount com o e-mail e a senha gerados.<br>2. Verificar o corpo da resposta. |
| **Resultado esperado** | corpo = { responseCode: 404, message: "Account not found!" }. |
| **Status** | Passou |
| **Observações** | O e-mail é gerado a cada execução, então ninguém consegue cadastrá-lo antes e quebrar o caso. |

### api/login.api.cy.js

#### CT-API-LOGIN-01 — Verificar login com credenciais válidas

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Autenticação › Verificação de login |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que um usuário cadastrado, com e-mail e senha corretos, é reconhecido pela API. |
| **Pré-condições** | Conta de teste. |
| **Dados de teste** | E-mail e senha da conta de teste. |
| **Passos** | 1. Enviar POST /api/verifyLogin (form) com email e password da conta de teste.<br>2. Verificar o corpo da resposta. |
| **Resultado esperado** | corpo = { responseCode: 200, message: "User exists!" }. |
| **Status** | Passou |

#### CT-API-LOGIN-02 — Verificar login com senha incorreta

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Autenticação › Verificação de login |
| **Tipo de teste** | Funcional – negativo |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que a API não autentica um e-mail cadastrado quando a senha está errada. |
| **Pré-condições** | Conta de teste. |
| **Dados de teste** | E-mail da conta de teste + senha incorreta ("senhaerrada"). |
| **Passos** | 1. Enviar POST /api/verifyLogin com o e-mail da conta de teste e a senha incorreta.<br>2. Verificar o corpo da resposta. |
| **Resultado esperado** | corpo = { responseCode: 404, message: "User not found!" }. |
| **Status** | Passou |
| **Observações** | Mesmo padrão do BUG-17 (404 para conta que existe), mas aqui não é bug: a resposta igual à de usuário inexistente impede descobrir e-mails cadastrados (CT-API-LOGIN-03). |

#### CT-API-LOGIN-03 — Verificar login com usuário não cadastrado

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Autenticação › Verificação de login |
| **Tipo de teste** | Segurança – enumeração de usuários |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que a resposta para e-mail inexistente é idêntica à de senha incorreta, para não revelar quais e-mails estão cadastrados. |
| **Dados de teste** | E-mail único, nunca cadastrado. |
| **Passos** | 1. Enviar POST /api/verifyLogin com o e-mail e a senha gerados.<br>2. Verificar o corpo da resposta.<br>3. Comparar com a resposta do CT-API-LOGIN-02. |
| **Resultado esperado** | corpo = { responseCode: 404, message: "User not found!" } — exatamente igual ao CT-API-LOGIN-02. |
| **Status** | Passou |

#### CT-API-LOGIN-04 — Verificar login sem o parâmetro e-mail

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Autenticação › Verificação de login |
| **Tipo de teste** | Funcional – negativo (validação) |
| **Prioridade** | Média |
| **Objetivo** | Garantir que a API rejeita a requisição quando o e-mail não é enviado. |
| **Pré-condições** | Conta de teste. |
| **Dados de teste** | E-mail não enviado; senha da conta de teste. |
| **Passos** | 1. Enviar POST /api/verifyLogin só com password.<br>2. Verificar o corpo da resposta. |
| **Resultado esperado** | corpo = { responseCode: 400, message: "Bad request, email or password parameter is missing in POST request." }. |
| **Status** | Passou |
| **Observações** | Sem caso próprio para e-mail vazio nem em formato inválido: no cadastro, esses casos são os BUG-19 e BUG-18. |

#### CT-API-LOGIN-05 — Verificar login sem o parâmetro senha

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Autenticação › Verificação de login |
| **Tipo de teste** | Funcional – negativo (validação) |
| **Prioridade** | Média |
| **Objetivo** | Garantir que a API rejeita a requisição quando a senha não é enviada. |
| **Pré-condições** | Conta de teste. |
| **Dados de teste** | E-mail da conta de teste; senha não enviada. |
| **Passos** | 1. Enviar POST /api/verifyLogin só com email.<br>2. Verificar o corpo da resposta. |
| **Resultado esperado** | corpo = { responseCode: 400, message: "Bad request, email or password parameter is missing in POST request." }. |
| **Status** | Passou |
| **Observações** | Mesma mensagem do CT-API-LOGIN-04: a resposta não diz qual parâmetro faltou.<br>Sem caso próprio para senha vazia: pelo BUG-19, uma conta criada com senha vazia faz login com a senha vazia. |

#### CT-API-LOGIN-06 — Rejeitar métodos diferentes de POST no endpoint de login

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Autenticação › Verificação de login |
| **Tipo de teste** | Contrato – método HTTP não suportado |
| **Prioridade** | Baixa |
| **Bug relacionado** | BUG-04 |
| **Objetivo** | Garantir que o endpoint aceita apenas POST e recusa os outros métodos. |
| **Dados de teste** | Métodos GET, PUT, DELETE e PATCH, sem corpo. |
| **Passos** | 1. Para cada método, enviar a requisição para /api/verifyLogin.<br>2. Verificar o status HTTP e o corpo de cada resposta. |
| **Resultado esperado** | Cada método é recusado com 405: no status HTTP ou no responseCode do corpo.<br>GET, PUT e DELETE: HTTP 200 com responseCode 405 ("This request method is not supported.").<br>PATCH: HTTP 405, corpo no formato do framework, sem responseCode. |
| **Status** | Passou |
| **Observações** | A asserção aceita qualquer um dos dois 405 e não confere a mensagem.<br>BUG-04: o 405 só no corpo e o formato diferente do PATCH são o bug; o formato correto e o cabeçalho Allow são cobertos nos bugs conhecidos. |

### api/products.api.cy.js

**Notas gerais**

- A API responde HTTP 200 até nos erros (BUG-04) e declara Content-Type text/html (BUG-05): os casos conferem body.responseCode, que cy.apiRequest extrai fazendo o parse do JSON.
- Nenhum caso precisa de conta, login ou fixture: são consultas públicas e somente leitura.

#### CT-API-PRODUCTS-01 — Lista de produtos com formato válido e IDs únicos

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Catálogo › Produto |
| **Tipo de teste** | Contrato – estrutura da resposta (positivo) |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que a lista de produtos responde com sucesso, que todo produto tem os campos esperados preenchidos no formato correto e que nenhum ID se repete. |
| **Dados de teste** | Não se aplica (consulta sem parâmetros). |
| **Passos** | 1. Enviar GET /api/productsList.<br>2. Verificar responseCode e a lista products.<br>3. Para cada produto, verificar os campos e o formato de cada um.<br>4. Verificar se os IDs dos produtos são únicos. |
| **Resultado esperado** | responseCode = 200 e products é uma lista não vazia.<br>Cada produto tem exatamente os campos id, name, price, brand e category.<br>id é número; name e brand são textos não vazios.<br>price segue o formato "Rs. &lt;número inteiro&gt;" (ex.: "Rs. 500").<br>category.category e category.usertype.usertype são textos não vazios.<br>Nenhum id se repete. |
| **Status** | Passou |
| **Observações** | Mutante M09.<br>É a base de comparação (catálogo) dos testes de filtro, busca e checkout, por isso a prioridade alta.<br>Não confere a quantidade de produtos: o catálogo pode mudar. Um preço com centavos ou separador de milhar (ex.: "Rs. 1,000") faria o caso falhar; hoje todos são inteiros. |

#### CT-API-PRODUCTS-02 — Rejeitar POST na lista de produtos

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Catálogo › Produto |
| **Tipo de teste** | Contrato – método HTTP não suportado |
| **Prioridade** | Baixa |
| **Bug relacionado** | BUG-04 |
| **Objetivo** | Garantir que a lista de produtos só aceita GET e recusa POST. |
| **Dados de teste** | Nenhum (POST sem corpo). |
| **Passos** | 1. Enviar POST /api/productsList.<br>2. Verificar o corpo da resposta. |
| **Resultado esperado** | corpo = { responseCode: 405, message: "This request method is not supported." }. |
| **Status** | Passou |
| **Observações** | BUG-04: o 405 vem só no corpo; o status HTTP é 200. O status correto é coberto em known-bugs/api-http-status.cy.js (CT-BUGS-API-HTTP-STATUS-01). |

#### CT-API-PRODUCTS-03 — Lista de marcas com formato válido

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Catálogo › Marca |
| **Tipo de teste** | Contrato – estrutura da resposta (positivo) |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-14 |
| **Objetivo** | Garantir que a lista de marcas responde com sucesso e que cada item tem id numérico e nome preenchido. |
| **Dados de teste** | Não se aplica (consulta sem parâmetros). |
| **Passos** | 1. Enviar GET /api/brandsList.<br>2. Verificar responseCode e a lista brands.<br>3. Para cada item, verificar os campos e o formato. |
| **Resultado esperado** | responseCode = 200 e brands é uma lista não vazia.<br>Cada item tem exatamente os campos id e brand; id é número e brand é texto não vazio. |
| **Status** | Passou |
| **Observações** | Não confere repetição: a lista devolve a marca de cada produto (34 itens para 8 marcas), que é o BUG-14, coberto em known-bugs/api-brands.cy.js. |

#### CT-API-PRODUCTS-04 — Lista de marcas igual às marcas dos produtos

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Catálogo › Marca |
| **Tipo de teste** | Funcional – consistência entre endpoints |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-14 |
| **Objetivo** | Garantir que a lista de marcas tem exatamente as marcas que aparecem no catálogo de produtos: nenhuma a mais e nenhuma faltando. |
| **Dados de teste** | Não se aplica. |
| **Passos** | 1. Enviar GET /api/productsList e montar o conjunto de marcas dos produtos.<br>2. Enviar GET /api/brandsList e montar o conjunto de nomes de marca.<br>3. Comparar os dois conjuntos. |
| **Resultado esperado** | Os dois conjuntos, sem repetição e em ordem alfabética, são iguais. |
| **Status** | Passou |
| **Observações** | Compara só o conjunto de nomes, então vale com ou sem o BUG-14 (marcas repetidas). |

### api/search.api.cy.js

#### CT-API-SEARCH-01 — Buscar produtos com termo válido

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Catálogo › Busca |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que a busca devolve só produtos que contêm o termo no nome ou na categoria, e não o catálogo inteiro. |
| **Dados de teste** | search.validTerm = "top" (apiData.json). |
| **Passos** | 1. Enviar GET /api/productsList e guardar o total do catálogo.<br>2. Enviar POST /api/searchProduct com search_product = "top".<br>3. Verificar responseCode, a lista e cada produto devolvido. |
| **Resultado esperado** | responseCode = 200; a lista não é vazia e tem menos itens que o catálogo.<br>Cada produto contém "top" no nome ou na categoria (sem diferenciar maiúsculas). |
| **Status** | Passou |
| **Observações** | A API procura também na categoria (ex.: "Tops &amp; Shirts"). Conferir cada item pega uma busca que ignora o termo e devolve tudo. |

#### CT-API-SEARCH-02 — Buscar produtos com termo sem correspondência

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Catálogo › Busca |
| **Tipo de teste** | Funcional – negativo |
| **Prioridade** | Média |
| **Objetivo** | Garantir que um termo que não existe devolve lista vazia, sem erro. |
| **Dados de teste** | search_product = "xyzprodutoquenaoexiste123". |
| **Passos** | 1. Enviar POST /api/searchProduct com o termo.<br>2. Verificar o corpo da resposta. |
| **Resultado esperado** | corpo = { responseCode: 200, products: [] }. |
| **Status** | Passou |

#### CT-API-SEARCH-03 — Buscar produtos sem o parâmetro search_product

| Campo | Descrição |
|---|---|
| **Módulo / Área** | API › Catálogo › Busca |
| **Tipo de teste** | Funcional – negativo (validação) |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-04 |
| **Objetivo** | Garantir que a API rejeita a busca quando o parâmetro não é enviado. |
| **Dados de teste** | Parâmetro search_product não enviado. |
| **Passos** | 1. Enviar POST /api/searchProduct sem o campo search_product.<br>2. Verificar o corpo da resposta. |
| **Resultado esperado** | corpo = { responseCode: 400, message: "Bad request, search_product parameter is missing in POST request." }. |
| **Status** | Passou |
| **Observações** | cy.apiSearchProduct omite o campo quando recebe undefined.<br>BUG-04: o 400 vem só no corpo (status HTTP 200); coberto em known-bugs/api-http-status.cy.js (CT-BUGS-API-HTTP-STATUS-04). |

## Autenticação

### auth/login.cy.js

#### CT-AUTH-LOGIN-01 — Login pela tela com credenciais válidas

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Autenticação › Login › Formulário |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que o login pela tela autentica o usuário certo. |
| **Pré-condições** | Conta de teste. |
| **Dados de teste** | E-mail e senha da conta de teste. |
| **Passos** | 1. Abrir /login.<br>2. Preencher e-mail e senha e clicar em "Login".<br>3. Ler o nome em "Logged in as" no menu. |
| **Resultado esperado** | O menu mostra "Logged in as &lt;nome da conta de teste&gt;". |
| **Status** | Passou |
| **Observações** | Tag @smoke.<br>Confere o nome exibido, e não só que algum usuário entrou (mutante M05 da análise de mutação). |

#### CT-AUTH-LOGIN-02 — Login pela tela com senha incorreta

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Autenticação › Login › Formulário |
| **Tipo de teste** | Funcional – negativo |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que a senha errada mostra erro e não autentica. |
| **Pré-condições** | Conta de teste. |
| **Dados de teste** | E-mail da conta de teste + senha incorreta ("senhaerrada"). |
| **Passos** | 1. Abrir /login.<br>2. Preencher o e-mail da conta e a senha incorreta e clicar em "Login".<br>3. Verificar a mensagem e o menu. |
| **Resultado esperado** | Aparece "Your email or password is incorrect!" no formulário.<br>O menu continua com "Signup / Login" e sem "Logout". |
| **Status** | Passou |
| **Observações** | O erro sozinho não basta: um defeito poderia mostrar a mensagem e logar mesmo assim, por isso o caso também confere que não houve login. |

#### CT-AUTH-LOGIN-03 — Login pela tela com e-mail não cadastrado

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Autenticação › Login › Formulário |
| **Tipo de teste** | Segurança – enumeração de usuários |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que e-mail inexistente recebe a mesma mensagem da senha incorreta, sem revelar quais e-mails estão cadastrados. |
| **Dados de teste** | E-mail e senha únicos, nunca cadastrados. |
| **Passos** | 1. Abrir /login.<br>2. Preencher o e-mail e a senha gerados e clicar em "Login".<br>3. Verificar a mensagem e o menu. |
| **Resultado esperado** | Aparece a mesma mensagem do CT-AUTH-LOGIN-02 ("Your email or password is incorrect!") e não há login. |
| **Status** | Passou |
| **Observações** | O e-mail é gerado a cada execução, então ninguém consegue cadastrá-lo antes e quebrar o caso. |

#### CT-AUTH-LOGIN-04 — Login pela tela com campos vazios

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Autenticação › Login › Formulário |
| **Tipo de teste** | Funcional – negativo (validação) |
| **Prioridade** | Média |
| **Objetivo** | Garantir que o navegador bloqueia o envio do login com e-mail e senha vazios. |
| **Dados de teste** | Campos e-mail e senha vazios. |
| **Passos** | 1. Abrir /login.<br>2. Clicar em "Login" sem preencher nada.<br>3. Verificar a validade dos dois campos e o menu. |
| **Resultado esperado** | Os dois campos ficam inválidos por estarem vazios (validity.valueMissing = true) e não há login. |
| **Status** | Passou |
| **Observações** | A barreira é o atributo required dos campos, aplicado pelo navegador. |

#### CT-AUTH-LOGIN-05 — Logout encerra a sessão

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Autenticação › Logout |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que o logout encerra a sessão e que ela não volta ao recarregar a página. |
| **Pré-condições** | 1. Conta de teste.<br>2. Usuário logado. |
| **Dados de teste** | Conta de teste. |
| **Passos** | 1. Abrir a página inicial logado.<br>2. Clicar em "Logout".<br>3. Verificar a URL.<br>4. Recarregar a página e verificar o menu. |
| **Resultado esperado** | Passo 3: a URL é /login.<br>Passo 4: o menu mostra "Signup / Login" e não mostra "Logout". |
| **Status** | Passou |

#### CT-AUTH-LOGIN-06 — Cookie de sessão antigo recusado após o logout

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Autenticação › Logout |
| **Tipo de teste** | Segurança – sessão |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que a sessão morre no servidor, e não só no navegador: o cookie de antes do logout não pode mais dar acesso. |
| **Pré-condições** | 1. Conta de teste.<br>2. Usuário logado. |
| **Dados de teste** | Valor do cookie sessionid antes do logout. |
| **Passos** | 1. Guardar o valor do cookie sessionid.<br>2. Controle: só com esse cookie, pedir a página inicial.<br>3. Fazer logout pela tela.<br>4. Restaurar só o cookie antigo e pedir a página inicial de novo. |
| **Resultado esperado** | Passo 2: a página mostra "Logged in as" (o cookie dá acesso).<br>Passo 4: a página não mostra "Logged in as" (o cookie foi invalidado). |
| **Status** | Passou |
| **Observações** | O passo 2 é o controle: sem ele, o caso passaria mesmo se o cookie nunca fosse usado. |

### auth/signup.cy.js

#### CT-AUTH-SIGNUP-01 — Cadastro completo pela tela

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Autenticação › Cadastro |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Alta |
| **Bug relacionado** | BUG-18, BUG-19 |
| **Objetivo** | Garantir que o cadastro pela tela cria a conta, faz login e grava os dados exatamente como digitados. |
| **Dados de teste** | Dados de apiData.newAccount, com country = "Canada" e address2 = "Apto 45"; e-mail e senha únicos. |
| **Passos** | 1. Abrir /login, preencher nome e e-mail em "New User Signup!" e clicar em "Signup".<br>2. Preencher o formulário completo (título, senha, nascimento, newsletter, ofertas e endereço) e clicar em "Create Account".<br>3. Clicar em "Continue" e ler o nome em "Logged in as".<br>4. Enviar POST /api/verifyLogin com e-mail e senha.<br>5. Consultar a conta. |
| **Resultado esperado** | Passo 2: aparece "Account Created!".<br>Passo 3: "Logged in as &lt;nome&gt;".<br>Passo 4: responseCode = 200.<br>Passo 5: os dados gravados são iguais aos digitados. |
| **Status** | Passou |
| **Observações** | Tag @smoke.<br>O país muda para "Canada" porque "Brazil" não existe no select da tela. A conta é removida no afterEach (aceita 200 ou 404).<br>O servidor não valida formato de e-mail (BUG-18) nem campos vazios (BUG-19); a tela barra os dois. |

#### CT-AUTH-SIGNUP-02 — Cadastro pela tela com e-mail já cadastrado

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Autenticação › Cadastro |
| **Tipo de teste** | Funcional – negativo (regra de negócio) |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que um e-mail já cadastrado é recusado antes do formulário completo. |
| **Pré-condições** | Conta de teste. |
| **Dados de teste** | E-mail da conta de teste + nome alternativo ("QA Nome Alternativo"). |
| **Passos** | 1. Abrir /login e preencher nome e e-mail existente em "New User Signup!".<br>2. Clicar em "Signup".<br>3. Verificar a mensagem e se o formulário completo apareceu. |
| **Resultado esperado** | Aparece "Email Address already exist!" e o botão "Create Account" não aparece. |
| **Status** | Passou |
| **Observações** | A conta é criada pela API, então o caso não depende do cadastro pela tela (CT-AUTH-SIGNUP-01). |

#### CT-AUTH-SIGNUP-03 — Cadastro pela tela com e-mail em formato inválido

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Autenticação › Cadastro |
| **Tipo de teste** | Funcional – negativo (validação) |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-18 |
| **Objetivo** | Garantir que o navegador recusa e-mails fora do formato e que nada é enviado ao servidor. |
| **Dados de teste** | E-mails inválidos de users.json &gt; invalidEmails: sem @, sem domínio (qa@), sem usuário (@dominio.com) e com @ duplo. |
| **Passos** | 1. Abrir /login e preencher o nome.<br>2. Para cada e-mail inválido, preenchê-lo e clicar em "Signup".<br>3. Verificar a validade do campo, a URL e as requisições enviadas. |
| **Resultado esperado** | Para cada e-mail: o campo fica inválido por formato (validity.typeMismatch = true).<br>A URL continua /login, "Create Account" não aparece e nenhum POST /signup é enviado. |
| **Status** | Passou |
| **Observações** | O e-mail com espaço fica de fora: o navegador remove o espaço ao digitar e o que sobra é válido.<br>BUG-18: o servidor não valida o formato; esta é a única barreira hoje. Coberto em known-bugs/email-format.cy.js. |

### auth/delete-account.cy.js

#### CT-AUTH-DELETE-ACCOUNT-01 — Excluir a conta pela tela

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Autenticação › Exclusão de conta |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Alta |
| **Bug relacionado** | BUG-06 |
| **Objetivo** | Garantir que excluir a conta pela tela encerra a sessão e que o login deixa de funcionar, na tela e na API. |
| **Pré-condições** | Conta descartável. |
| **Dados de teste** | E-mail e senha da conta descartável. |
| **Passos** | 1. Fazer login por HTTP e abrir a página inicial.<br>2. Clicar em "Delete Account".<br>3. Clicar em "Continue" e verificar o menu.<br>4. Tentar logar pela tela com as mesmas credenciais.<br>5. Enviar POST /api/verifyLogin e GET /api/getUserDetailByEmail. |
| **Resultado esperado** | Passo 2: aparece "Account Deleted!".<br>Passo 3: o menu mostra "Signup / Login" e não "Logout".<br>Passo 4: "Your email or password is incorrect!".<br>Passo 5: os dois respondem responseCode = 404. |
| **Status** | Passou |
| **Observações** | O login é por HTTP porque é só preparação; a exclusão é pela tela.<br>BUG-06: o link exclui por GET, sem confirmação nem token CSRF. Este caso confere o efeito; o bug é coberto em known-bugs/account-security.cy.js. |

## Carrinho

### cart/checkout.cy.js

**Notas gerais**

- Só o CT-CART-CHECKOUT-01 adiciona produto pela tela; os demais montam o carrinho por HTTP, para uma falha no botão não derrubar casos que verificam outra coisa.
- Nome e preço esperados vêm do catálogo da API, nunca da tela testada.

#### CT-CART-CHECKOUT-01 — Adicionar produto pela listagem

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Carrinho › Adicionar |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que o botão "Add to cart" da listagem leva o produto ao carrinho com nome, preço, quantidade e total certos. |
| **Pré-condições** | 1. Conta de teste.<br>2. Usuário logado, com o carrinho vazio. |
| **Dados de teste** | Produto 1 (nome e preço do catálogo da API). |
| **Passos** | 1. Abrir /products.<br>2. Clicar em "Add to cart" do produto 1 e esperar a resposta de /add_to_cart.<br>3. Clicar em "View Cart" no aviso.<br>4. Verificar as linhas do carrinho e os dados do produto. |
| **Resultado esperado** | Passo 2: /add_to_cart responde 200.<br>Passo 4: uma linha; nome, preço, quantidade 1 e total iguais aos do catálogo. |
| **Status** | Passou |
| **Observações** | É o único caso que adiciona pela tela; os outros montam o carrinho por HTTP. Mutante M01. |

#### CT-CART-CHECKOUT-02 — Adicionar o mesmo produto duas vezes

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Carrinho › Adicionar |
| **Tipo de teste** | Funcional – regra de negócio |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que o mesmo produto adicionado duas vezes soma a quantidade e o total, numa linha só. |
| **Pré-condições** | 1. Conta de teste.<br>2. Usuário logado, com o carrinho vazio. |
| **Dados de teste** | Produto 1, adicionado duas vezes por HTTP. |
| **Passos** | 1. Adicionar o produto 1 duas vezes.<br>2. Abrir /view_cart.<br>3. Verificar as linhas e os dados do produto. |
| **Resultado esperado** | Uma linha só; quantidade 2 e total = 2 × preço do catálogo. |
| **Status** | Passou |
| **Observações** | Pega linha duplicada, quantidade sobrescrita em vez de somada e total errado (mutante M02). |

#### CT-CART-CHECKOUT-03 — Remover um item mantendo os demais

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Carrinho › Remover |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que remover um item tira só ele do carrinho, no servidor. |
| **Pré-condições** | 1. Conta de teste.<br>2. Usuário logado, com o carrinho vazio. |
| **Dados de teste** | Produtos 1 e 2 no carrinho. |
| **Passos** | 1. Adicionar os produtos 1 e 2 e abrir /view_cart.<br>2. Remover o produto 1 e esperar a resposta de /delete_cart.<br>3. Recarregar a página.<br>4. Verificar as linhas e os dados do produto 2. |
| **Resultado esperado** | Passo 2: /delete_cart responde 200.<br>Passo 4: o produto 1 sumiu; resta uma linha, a do produto 2, com dados iguais aos do catálogo. |
| **Status** | Passou |
| **Observações** | O cart.js apaga a linha da tela com qualquer resposta 200; só o recarregamento prova que o servidor removeu o item. |

#### CT-CART-CHECKOUT-04 — Remover o último item do carrinho

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Carrinho › Remover |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Média |
| **Objetivo** | Garantir que remover o único item deixa o carrinho vazio, no servidor. |
| **Pré-condições** | 1. Conta de teste.<br>2. Usuário logado, com o carrinho vazio. |
| **Dados de teste** | Produto 1 no carrinho. |
| **Passos** | 1. Adicionar o produto 1 e abrir /view_cart.<br>2. Remover o produto e esperar a resposta de /delete_cart.<br>3. Recarregar a página. |
| **Resultado esperado** | Não há linhas no carrinho e aparece "Cart is empty!". |
| **Status** | Passou |

#### CT-CART-CHECKOUT-05 — Carrinho vazio sem botão de checkout

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Carrinho › Carrinho vazio |
| **Tipo de teste** | Funcional – negativo |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-13 |
| **Objetivo** | Garantir que o carrinho vazio não oferece "Proceed To Checkout". |
| **Pré-condições** | 1. Conta de teste.<br>2. Usuário logado, com o carrinho vazio. |
| **Dados de teste** | Carrinho vazio. |
| **Passos** | 1. Abrir /view_cart.<br>2. Verificar a mensagem e o botão de checkout. |
| **Resultado esperado** | Aparece "Cart is empty!" e o botão "Proceed To Checkout" não existe. |
| **Status** | Passou |
| **Observações** | BUG-13: abrindo /checkout pela URL, o pedido vazio passa; coberto em known-bugs/checkout-access.cy.js. |

#### CT-CART-CHECKOUT-06 — Ir do carrinho para o checkout

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Checkout › Navegação |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que "Proceed To Checkout" leva à página de checkout para quem está logado. |
| **Pré-condições** | 1. Conta de teste.<br>2. Usuário logado, com o carrinho vazio. |
| **Dados de teste** | Produto 1 no carrinho. |
| **Passos** | 1. Adicionar o produto 1 e abrir /view_cart.<br>2. Clicar em "Proceed To Checkout".<br>3. Verificar a URL e o endereço de entrega. |
| **Resultado esperado** | A URL é /checkout e o bloco de endereço de entrega está visível. |
| **Status** | Passou |

#### CT-CART-CHECKOUT-07 — Itens e total no checkout

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Checkout › Revisão do pedido |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que o checkout mostra cada item e o total do pedido corretos. |
| **Pré-condições** | 1. Conta de teste.<br>2. Usuário logado, com o carrinho vazio. |
| **Dados de teste** | Produtos 1 e 2 no carrinho. |
| **Passos** | 1. Adicionar os produtos 1 e 2.<br>2. Abrir /checkout.<br>3. Verificar os dados de cada item e o "Total Amount". |
| **Resultado esperado** | Nome, preço, quantidade 1 e total de cada item iguais aos do catálogo.<br>"Total Amount" = preço do produto 1 + preço do produto 2. |
| **Status** | Passou |

#### CT-CART-CHECKOUT-08 — Endereço cadastrado no checkout

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Checkout › Endereço |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que os endereços de entrega e de cobrança mostram os dados do cadastro, cada um no campo certo. |
| **Pré-condições** | 1. Conta de teste.<br>2. Usuário logado, com o carrinho vazio. |
| **Dados de teste** | Dados de apiData.newAccount (os mesmos da conta de teste). |
| **Passos** | 1. Adicionar o produto 1.<br>2. Abrir /checkout.<br>3. Em cada bloco (entrega e cobrança), verificar nome, endereço, cidade, estado, CEP, país e telefone. |
| **Resultado esperado** | Nos dois blocos: "Mr. QA Automatizado"; endereço "Rua de Teste, 123"; cidade, estado e CEP do cadastro; país "Brazil"; telefone do cadastro. |
| **Status** | Passou |
| **Observações** | Compara cada linha com o campo certo do cadastro (antes comparava com o nome, que só batia por coincidência). Mutante M06. |

#### CT-CART-CHECKOUT-09 — Compra completa com fatura

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Checkout › Pagamento |
| **Tipo de teste** | Funcional – ponta a ponta |
| **Prioridade** | Alta |
| **Bug relacionado** | BUG-20 |
| **Objetivo** | Garantir que o pagamento confirma o pedido, que a fatura traz o total e o nome da conta, e que o carrinho fica vazio. |
| **Pré-condições** | 1. Conta de teste.<br>2. Usuário logado, com o carrinho vazio. |
| **Dados de teste** | Produtos 1 e 2; cartão fictício users.json &gt; cards.valid (4111 1111 1111 1111). |
| **Passos** | 1. Adicionar os produtos 1 e 2 e abrir /checkout.<br>2. Clicar em "Place Order".<br>3. Preencher o cartão e clicar em "Pay and Confirm Order".<br>4. Verificar a confirmação e a URL.<br>5. Baixar a fatura do link "Download Invoice".<br>6. Abrir /view_cart. |
| **Resultado esperado** | Passo 2: a URL é /payment.<br>Passo 4: aparece "Order Placed!" e a URL é /payment_done/&lt;total&gt;.<br>Passo 5: "Hi QA Automatizado, Your total purchase amount is &lt;total&gt;. Thank you".<br>Passo 6: "Cart is empty!". |
| **Status** | Passou |
| **Observações** | Tags @smoke e @creates-order.<br>Cria 1 pedido no site, que não pode ser apagado. A fatura usa o nome da conta, não o do cartão. Mutante M07.<br>BUG-20: o servidor aceita qualquer dado de cartão; coberto em known-bugs/payment-validation.cy.js. |

#### CT-CART-CHECKOUT-10 — Checkout sem login pede login

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Checkout › Acesso |
| **Tipo de teste** | Segurança – autorização |
| **Prioridade** | Alta |
| **Bug relacionado** | BUG-12 |
| **Objetivo** | Garantir que um visitante não avança para o checkout pelo botão do carrinho. |
| **Pré-condições** | Sem login (sessão nova a cada teste). |
| **Dados de teste** | Produto 1 no carrinho do visitante. |
| **Passos** | 1. Adicionar o produto 1 sem login.<br>2. Abrir /view_cart e clicar em "Proceed To Checkout".<br>3. Verificar o aviso e a URL. |
| **Resultado esperado** | Aparece o aviso "Register / Login account to proceed on checkout." com o link para /login, e a URL continua /view_cart. |
| **Status** | Passou |
| **Observações** | BUG-12: pela URL direta, /checkout e /payment abrem sem login; coberto em known-bugs/checkout-access.cy.js. |

### cart/cart-session.cy.js

#### CT-CART-SESSION-01 — Carrinho do visitante passa para a conta no login

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Carrinho › Sessões |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Média |
| **Objetivo** | Garantir que os itens adicionados sem login continuam no carrinho depois do login. |
| **Pré-condições** | 1. Conta de teste.<br>2. Começa deslogado e com o carrinho da conta vazio. |
| **Dados de teste** | Produto 1. |
| **Passos** | 1. Sem login, adicionar o produto 1 e ler o carrinho.<br>2. Fazer login por HTTP.<br>3. Ler o carrinho de novo. |
| **Resultado esperado** | Passo 1: { 1: 1 }.<br>Passo 3: { 1: 1 }. |
| **Status** | Passou |
| **Observações** | Login e logout por HTTP: o assunto é o carrinho, não as telas de login. |

#### CT-CART-SESSION-02 — Carrinho some no logout e volta no login

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Carrinho › Sessões |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Média |
| **Objetivo** | Garantir que o logout tira o carrinho da tela e que os itens voltam ao entrar de novo. |
| **Pré-condições** | 1. Conta de teste.<br>2. Começa deslogado e com o carrinho da conta vazio. |
| **Dados de teste** | Produtos 1 e 2. |
| **Passos** | 1. Fazer login e adicionar os produtos 1 e 2.<br>2. Fazer logout e ler o carrinho.<br>3. Fazer login de novo e ler o carrinho. |
| **Resultado esperado** | Passo 2: {} (vazio).<br>Passo 3: { 1: 1, 2: 1 }. |
| **Status** | Passou |

#### CT-CART-SESSION-03 — Carrinho da conta em outro navegador

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Carrinho › Sessões |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Média |
| **Objetivo** | Garantir que o carrinho fica gravado na conta, e não na sessão do navegador. |
| **Pré-condições** | 1. Conta de teste.<br>2. Começa deslogado e com o carrinho da conta vazio. |
| **Dados de teste** | Produto 3. |
| **Passos** | 1. Fazer login e adicionar o produto 3.<br>2. Apagar os cookies (outro navegador) e ler o carrinho.<br>3. Fazer login de novo e ler o carrinho. |
| **Resultado esperado** | Passo 2: {} (vazio).<br>Passo 3: { 3: 1 }. |
| **Status** | Passou |
| **Observações** | Apagar os cookies simula outro navegador. |

#### CT-CART-SESSION-04 — Carrinho do visitante somado ao da conta

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Carrinho › Sessões |
| **Tipo de teste** | Funcional – regra de negócio |
| **Prioridade** | Média |
| **Objetivo** | Garantir que, ao entrar, os itens do visitante são somados ao carrinho que a conta já tinha, sem descartar nem sobrescrever. |
| **Pré-condições** | 1. Conta de teste.<br>2. Começa deslogado e com o carrinho da conta vazio. |
| **Dados de teste** | Produto 2 na conta; produtos 2 e 4 no visitante. |
| **Passos** | 1. Fazer login, adicionar o produto 2 e fazer logout.<br>2. Como visitante, adicionar os produtos 2 e 4.<br>3. Fazer login e ler o carrinho. |
| **Resultado esperado** | { 2: 2, 4: 1 }: o produto 2 somou as duas unidades. |
| **Status** | Passou |
| **Observações** | Mutante M10. |

## Produtos

### products/filter.cy.js

#### CT-PRODUCTS-FILTER-01 — Filtrar por categoria Women > Dress

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Produtos › Filtro › Categoria |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que o filtro de categoria mostra exatamente os produtos dessa categoria no catálogo. |
| **Pré-condições** | Catálogo da API como referência. |
| **Dados de teste** | Categoria Women &gt; Dress (/category_products/1). |
| **Passos** | 1. Abrir /products.<br>2. Abrir o painel "Women" e clicar em "Dress".<br>3. Verificar o título da lista e os IDs exibidos. |
| **Resultado esperado** | Título "Women - Dress Products".<br>Os IDs na tela são exatamente os do catálogo com usertype Women e categoria Dress. |
| **Status** | Passou |
| **Observações** | Mutante M04.<br>Compara o conjunto exato, não só "contém": pega produto faltando e produto de outra categoria. |

#### CT-PRODUCTS-FILTER-02 — Filtrar por categoria Men > Jeans

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Produtos › Filtro › Categoria |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que o filtro de categoria funciona também no painel masculino. |
| **Pré-condições** | Catálogo da API como referência. |
| **Dados de teste** | Categoria Men &gt; Jeans (/category_products/6). |
| **Passos** | 1. Abrir /products.<br>2. Abrir o painel "Men" e clicar em "Jeans".<br>3. Verificar o título da lista e os IDs exibidos. |
| **Resultado esperado** | Título "Men - Jeans Products".<br>Os IDs na tela são exatamente os do catálogo com usertype Men e categoria Jeans. |
| **Status** | Passou |

#### CT-PRODUCTS-FILTER-03 — Filtrar por marca Polo

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Produtos › Filtro › Marca |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Média |
| **Objetivo** | Garantir que o filtro de marca mostra exatamente os produtos dessa marca. |
| **Pré-condições** | Catálogo da API como referência. |
| **Dados de teste** | Marca Polo (/brand_products/Polo). |
| **Passos** | 1. Abrir /products.<br>2. Clicar em "Polo" na lista de marcas.<br>3. Verificar o título da lista e os IDs exibidos. |
| **Resultado esperado** | Título "Brand - Polo Products".<br>Os IDs na tela são exatamente os do catálogo com marca Polo. |
| **Status** | Passou |

#### CT-PRODUCTS-FILTER-04 — Contagem de cada marca na lateral

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Produtos › Filtro › Marca |
| **Tipo de teste** | Funcional – consistência |
| **Prioridade** | Baixa |
| **Objetivo** | Garantir que o número ao lado de cada marca na lateral bate com o catálogo. |
| **Pré-condições** | Catálogo da API como referência. |
| **Dados de teste** | Todas as marcas da lateral. |
| **Passos** | 1. Abrir /products.<br>2. Para cada marca da lateral, ler o número entre parênteses.<br>3. Comparar com a quantidade de produtos dessa marca no catálogo. |
| **Resultado esperado** | Para cada marca, o número da lateral = quantidade de produtos da marca no catálogo. |
| **Status** | Passou |
| **Observações** | Pega contador desatualizado ou calculado errado. |

### products/search.cy.js

#### CT-PRODUCTS-SEARCH-01 — Buscar pela tela com termo existente

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Produtos › Busca |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que a busca mostra exatamente os produtos que contêm o termo, comparados ao catálogo. |
| **Pré-condições** | Catálogo da API como referência. |
| **Dados de teste** | Termo "jeans". |
| **Passos** | 1. Abrir /products, digitar "jeans" na busca e clicar no botão.<br>2. Verificar o título "Searched Products".<br>3. Verificar os IDs exibidos. |
| **Resultado esperado** | Os IDs na tela são exatamente os do catálogo que contêm "jeans" no nome ou na categoria, e a lista não é vazia. |
| **Status** | Passou |
| **Observações** | Tag @smoke. Mutante M03. |

#### CT-PRODUCTS-SEARCH-02 — Busca sem diferenciar maiúsculas

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Produtos › Busca |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Média |
| **Objetivo** | Garantir que a busca encontra os mesmos produtos com o termo em maiúsculas. |
| **Pré-condições** | Catálogo da API como referência. |
| **Dados de teste** | Termo "JEANS". |
| **Passos** | 1. Buscar "JEANS" pela tela.<br>2. Verificar os IDs exibidos. |
| **Resultado esperado** | Os mesmos IDs do CT-PRODUCTS-SEARCH-01 (produtos com "jeans"), e a lista não é vazia. |
| **Status** | Passou |

#### CT-PRODUCTS-SEARCH-03 — Busca com espaço no fim do termo

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Produtos › Busca |
| **Tipo de teste** | Funcional – borda |
| **Prioridade** | Baixa |
| **Bug relacionado** | BUG-15 |
| **Objetivo** | Garantir que um espaço no fim do termo não muda o resultado. |
| **Pré-condições** | Catálogo da API como referência. |
| **Dados de teste** | Termo "jeans " (com espaço no fim). |
| **Passos** | 1. Buscar "jeans " pela tela.<br>2. Verificar os IDs exibidos. |
| **Resultado esperado** | Os mesmos IDs do CT-PRODUCTS-SEARCH-01, e a lista não é vazia. |
| **Status** | Passou |
| **Observações** | O navegador remove o espaço do fim da URL.<br>BUG-15: espaço duplo e "&amp;" no termo não têm a mesma sorte; coberto em known-bugs/search-input.cy.js. |

#### CT-PRODUCTS-SEARCH-04 — Busca pela tela sem correspondência

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Produtos › Busca |
| **Tipo de teste** | Funcional – negativo |
| **Prioridade** | Média |
| **Objetivo** | Garantir que um termo inexistente mostra a lista vazia. |
| **Dados de teste** | Termo "xyzprodutoquenaoexiste123". |
| **Passos** | 1. Buscar o termo pela tela.<br>2. Verificar os IDs exibidos. |
| **Resultado esperado** | Nenhum produto na lista. |
| **Status** | Passou |

### products/product-details.cy.js

#### CT-PRODUCTS-DETAILS-01 — Detalhes do produto iguais aos da API

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Produtos › Detalhes |
| **Tipo de teste** | Funcional – consistência (partição de equivalência) |
| **Prioridade** | Alta |
| **Objetivo** | Garantir que a página de detalhes mostra nome, preço, categoria e marca iguais aos da API, numa amostra que cobre cada classe de produto. |
| **Pré-condições** | Catálogo da API como referência. |
| **Dados de teste** | Um representante de cada classe (cada categoria, cada marca, menor e maior preço, nome mais longo, último ID, "&amp;" na marca e na categoria) + 1 produto sorteado. |
| **Passos** | 1. Montar a amostra (catalog.representatives + catalog.pickRandom).<br>2. Para cada produto, pedir /product_details/&lt;id&gt; e ler nome, preço, categoria e marca.<br>3. Comparar com a API. |
| **Resultado esperado** | Para cada produto da amostra, os quatro campos são iguais aos da API. |
| **Status** | Passou |
| **Observações** | Tag @smoke. Mutante M08.<br>O sorteio muda a cada execução; para repetir um: --expose sampledProduct=&lt;id&gt;. O formato de todo o catálogo é conferido pela API (CT-API-PRODUCTS-01). |

#### CT-PRODUCTS-DETAILS-02 — Link "View Product" abre o produto certo

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Produtos › Detalhes |
| **Tipo de teste** | Funcional – navegação |
| **Prioridade** | Média |
| **Objetivo** | Garantir que o link "View Product" de cada card aponta para o produto do próprio card. |
| **Pré-condições** | Catálogo da API como referência. |
| **Dados de teste** | Todos os cards de /products; clique no produto 2. |
| **Passos** | 1. Abrir /products.<br>2. Para cada card, comparar o link "View Product" com o ID do card.<br>3. Clicar em "View Product" do produto 2.<br>4. Verificar a URL e o nome. |
| **Resultado esperado** | Passo 2: cada link é /product_details/&lt;ID do card&gt;.<br>Passo 4: URL /product_details/2 e nome igual ao do catálogo. |
| **Status** | Passou |
| **Observações** | Pega link apontando para o card ao lado. |

#### CT-PRODUCTS-DETAILS-03 — Adicionar ao carrinho com quantidade 3

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Produtos › Detalhes |
| **Tipo de teste** | Funcional – positivo |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-01, BUG-02, BUG-09 |
| **Objetivo** | Garantir que a quantidade escolhida na página de detalhes vai para o carrinho, com o total certo. |
| **Pré-condições** | Catálogo da API como referência. |
| **Dados de teste** | Produto 1, quantidade 3. |
| **Passos** | 1. Abrir /product_details/1.<br>2. Trocar a quantidade para 3 e clicar em "Add to cart".<br>3. Clicar em "View Cart".<br>4. Verificar a linha do produto. |
| **Resultado esperado** | Nome do catálogo, quantidade 3 e total = 3 × preço. |
| **Status** | Passou |
| **Observações** | Quantidades inválidas (negativa, zero, vazia, decimal) são os BUG-01, 02 e 09; cobertas em known-bugs/cart-quantity.cy.js. |

#### CT-PRODUCTS-DETAILS-04 — Imagem do produto carrega

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Produtos › Detalhes |
| **Tipo de teste** | Funcional – recurso |
| **Prioridade** | Baixa |
| **Objetivo** | Garantir que a imagem do produto aponta para o produto certo e de fato carrega. |
| **Dados de teste** | Produto 1. |
| **Passos** | 1. Abrir /product_details/1.<br>2. Verificar o endereço da imagem e se ela carregou. |
| **Resultado esperado** | O endereço é /get_product_picture/1 e a imagem tem largura maior que zero (carregou). |
| **Status** | Passou |

## Bugs conhecidos
- Cada caso descreve o comportamento CORRETO: o teste falha enquanto o bug existir e passa a passar quando for corrigido.
- Resultado obtido = o que o site faz hoje; Status = "Falhou (bug conhecido)". Detalhes de cada bug em BUGS.md.
- Ficam fora da suíte principal: rodam com npm run test:bugs e na execução diária do CI. Os de @creates-order ficam fora dos PRs.

### known-bugs/account-security.cy.js

#### CT-BUGS-ACCOUNT-SECURITY-01 — Exclusão de conta por GET sem confirmação

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Conta |
| **Tipo de teste** | Segurança – CSRF / ação destrutiva por GET |
| **Prioridade** | Alta |
| **Bug relacionado** | BUG-06 |
| **Objetivo** | Garantir que um simples GET em /delete_account não exclui a conta de quem está logado. |
| **Pré-condições** | 1. Conta descartável.<br>2. Usuário logado. |
| **Dados de teste** | Conta descartável. |
| **Passos** | 1. Com a sessão logada, pedir GET /delete_account.<br>2. Enviar POST /api/verifyLogin com e-mail e senha. |
| **Resultado esperado** | responseCode = 200: a conta continua existindo, porque a exclusão exige confirmação (e POST com token CSRF). |
| **Resultado obtido** | responseCode = 404: a conta foi excluída pelo GET, sem confirmação. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Uma ação destrutiva por GET pode ser disparada por um link: quem estiver logado perde a conta. |

#### CT-BUGS-ACCOUNT-SECURITY-02 — Dados pessoais expostos sem autenticação

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Conta |
| **Tipo de teste** | Segurança – exposição de dados pessoais |
| **Prioridade** | Alta |
| **Bug relacionado** | BUG-07 |
| **Objetivo** | Garantir que a API não devolve dados pessoais de uma conta a quem não está autenticado. |
| **Pré-condições** | Conta descartável. |
| **Dados de teste** | E-mail da conta descartável. |
| **Passos** | 1. Sem autenticação, enviar GET /api/getUserDetailByEmail?email=&lt;e-mail&gt;.<br>2. Verificar o corpo da resposta. |
| **Resultado esperado** | O corpo não traz o objeto user (a API exige autenticação). |
| **Resultado obtido** | responseCode = 200 com user: nome, endereço, nascimento e demais dados de qualquer e-mail. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | A suíte principal usa este endpoint como contrato (CT-API-ACCOUNT-05); se o site exigir login, os dois casos mudam juntos. |

#### CT-BUGS-ACCOUNT-SECURITY-03 — Senha errada respondida como conta inexistente

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Conta |
| **Tipo de teste** | Contrato – código de erro |
| **Prioridade** | Baixa |
| **Bug relacionado** | BUG-17 |
| **Objetivo** | Garantir que uma atualização com senha errada responde 401 (credencial inválida), e não "conta não encontrada". |
| **Pré-condições** | Conta descartável. |
| **Dados de teste** | Senha incorreta ("senhaerrada"); city = "Alterada Indevidamente". |
| **Passos** | 1. Enviar PUT /api/updateAccount com o e-mail da conta e a senha errada.<br>2. Verificar o corpo.<br>3. Consultar a conta. |
| **Resultado esperado** | Passo 2: responseCode = 401 e a mensagem não é "Account not found!".<br>Passo 3: dados iguais aos do cadastro (a correção não pode passar a aceitar a alteração). |
| **Resultado obtido** | { responseCode: 404, message: "Account not found!" }, embora a conta exista; os dados não mudam. |
| **Status** | Falhou (bug conhecido) |

### known-bugs/api-brands.cy.js

#### CT-BUGS-API-BRANDS-01 — Lista de marcas sem repetição

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Catálogo |
| **Tipo de teste** | Contrato – conteúdo da resposta |
| **Prioridade** | Baixa |
| **Bug relacionado** | BUG-14 |
| **Objetivo** | Garantir que a lista de marcas tem cada marca uma vez só, como a documentação promete ("All brands list"). |
| **Dados de teste** | Não se aplica. |
| **Passos** | 1. Enviar GET /api/brandsList.<br>2. Procurar nomes de marca repetidos. |
| **Resultado esperado** | responseCode = 200 e nenhuma marca repetida. |
| **Resultado obtido** | 34 itens para 8 marcas: a lista traz a marca de cada produto, e os "id" são IDs de produto. |
| **Status** | Falhou (bug conhecido) |

### known-bugs/api-http-status.cy.js

#### CT-BUGS-API-HTTP-STATUS-01 — POST na lista de produtos com status HTTP 405

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Protocolo HTTP |
| **Tipo de teste** | Contrato – status HTTP |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-04 |
| **Objetivo** | Garantir que POST /api/productsList responde com o status HTTP 405, o mesmo do responseCode do corpo. |
| **Dados de teste** | Nenhum. |
| **Passos** | 1. Enviar POST /api/productsList.<br>2. Verificar o responseCode do corpo e o status HTTP. |
| **Resultado esperado** | responseCode = 405 e status HTTP = 405. |
| **Resultado obtido** | Status HTTP 200, com responseCode = 405 só no corpo. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Confere antes o responseCode, para o caso falhar só pelo status HTTP. |

#### CT-BUGS-API-HTTP-STATUS-02 — PUT na lista de marcas com status HTTP 405

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Protocolo HTTP |
| **Tipo de teste** | Contrato – status HTTP |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-04 |
| **Objetivo** | Garantir que PUT /api/brandsList responde com o status HTTP 405, o mesmo do responseCode do corpo. |
| **Dados de teste** | Nenhum. |
| **Passos** | 1. Enviar PUT /api/brandsList.<br>2. Verificar o responseCode do corpo e o status HTTP. |
| **Resultado esperado** | responseCode = 405 e status HTTP = 405. |
| **Resultado obtido** | Status HTTP 200, com responseCode = 405 só no corpo. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Confere antes o responseCode, para o caso falhar só pelo status HTTP. |

#### CT-BUGS-API-HTTP-STATUS-03 — DELETE no login com status HTTP 405

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Protocolo HTTP |
| **Tipo de teste** | Contrato – status HTTP |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-04 |
| **Objetivo** | Garantir que DELETE /api/verifyLogin responde com o status HTTP 405, o mesmo do responseCode do corpo. |
| **Dados de teste** | Nenhum. |
| **Passos** | 1. Enviar DELETE /api/verifyLogin.<br>2. Verificar o responseCode do corpo e o status HTTP. |
| **Resultado esperado** | responseCode = 405 e status HTTP = 405. |
| **Resultado obtido** | Status HTTP 200, com responseCode = 405 só no corpo. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Confere antes o responseCode, para o caso falhar só pelo status HTTP. |

#### CT-BUGS-API-HTTP-STATUS-04 — Busca sem parâmetro com status HTTP 400

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Protocolo HTTP |
| **Tipo de teste** | Contrato – status HTTP |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-04 |
| **Objetivo** | Garantir que POST /api/searchProduct sem search_product responde com o status HTTP 400, o mesmo do responseCode do corpo. |
| **Dados de teste** | Parâmetro não enviado. |
| **Passos** | 1. Enviar POST /api/searchProduct sem search_product.<br>2. Verificar o responseCode do corpo e o status HTTP. |
| **Resultado esperado** | responseCode = 400 e status HTTP = 400. |
| **Resultado obtido** | Status HTTP 200, com responseCode = 400 só no corpo. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Confere antes o responseCode, para o caso falhar só pelo status HTTP. |

#### CT-BUGS-API-HTTP-STATUS-05 — Login com parâmetros na query string com status HTTP 400

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Protocolo HTTP |
| **Tipo de teste** | Contrato – status HTTP |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-04 |
| **Objetivo** | Garantir que POST /api/verifyLogin com e-mail e senha na query string responde com o status HTTP 400, o mesmo do responseCode do corpo. |
| **Dados de teste** | E-mail e senha gerados, enviados na URL e não no corpo. |
| **Passos** | 1. Enviar POST /api/verifyLogin com e-mail e senha na query string.<br>2. Verificar o responseCode do corpo e o status HTTP. |
| **Resultado esperado** | responseCode = 400 e status HTTP = 400. |
| **Resultado obtido** | Status HTTP 200, com responseCode = 400 só no corpo. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Confere antes o responseCode, para o caso falhar só pelo status HTTP.<br>A API só lê os campos do corpo do formulário; na query string eles são ignorados. |

#### CT-BUGS-API-HTTP-STATUS-06 — Erro do PATCH no formato da API

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Protocolo HTTP |
| **Tipo de teste** | Contrato – formato da resposta |
| **Prioridade** | Baixa |
| **Bug relacionado** | BUG-04 |
| **Objetivo** | Garantir que a recusa do PATCH segue o mesmo formato das outras respostas da API (com responseCode). |
| **Dados de teste** | Nenhum. |
| **Passos** | 1. Enviar PATCH /api/verifyLogin.<br>2. Verificar o status HTTP e o corpo. |
| **Resultado esperado** | Status HTTP 405 e corpo com responseCode = 405. |
| **Resultado obtido** | Status 405 correto, mas o corpo é {"detail": "Method \"PATCH\" not allowed."}, sem responseCode. |
| **Status** | Falhou (bug conhecido) |

#### CT-BUGS-API-HTTP-STATUS-07 — Cabeçalho Allow só com os métodos aceitos

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Protocolo HTTP |
| **Tipo de teste** | Contrato – cabeçalho HTTP |
| **Prioridade** | Baixa |
| **Bug relacionado** | BUG-04 |
| **Objetivo** | Garantir que o cabeçalho Allow anuncia só os métodos que o endpoint aceita. |
| **Dados de teste** | Nenhum. |
| **Passos** | 1. Enviar OPTIONS /api/verifyLogin.<br>2. Ler o cabeçalho Allow. |
| **Resultado esperado** | Allow = OPTIONS, POST. |
| **Resultado obtido** | Allow = POST, PUT, DELETE, GET, OPTIONS: anuncia métodos que o endpoint recusa. |
| **Status** | Falhou (bug conhecido) |

#### CT-BUGS-API-HTTP-STATUS-08 — Content-Type JSON na lista de produtos

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Protocolo HTTP |
| **Tipo de teste** | Contrato – cabeçalho HTTP |
| **Prioridade** | Baixa |
| **Bug relacionado** | BUG-05 |
| **Objetivo** | Garantir que a API declara JSON no Content-Type, para os clientes fazerem o parse automático. |
| **Dados de teste** | Nenhum. |
| **Passos** | 1. Enviar GET /api/productsList.<br>2. Verificar o cabeçalho Content-Type. |
| **Resultado esperado** | responseCode = 200 e Content-Type contém application/json. |
| **Resultado obtido** | Content-Type: text/html; charset=utf-8. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Por causa deste bug, todos os comandos de API passam pelo cy.apiRequest, que faz o parse do corpo. |

### known-bugs/cart-quantity.cy.js

#### CT-BUGS-CART-QUANTITY-01 — Carrinho recusa quantidade negativa

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Carrinho › Quantidade |
| **Tipo de teste** | Funcional – validação (valor-limite) |
| **Prioridade** | Alta |
| **Bug relacionado** | BUG-01 |
| **Objetivo** | Garantir que uma quantidade negativa não entra no carrinho nem gera total negativo. |
| **Pré-condições** | Sem login (sessão nova, carrinho vazio). |
| **Dados de teste** | Produto 1, quantidade -3. |
| **Passos** | 1. Abrir /product_details/1, trocar a quantidade para -3 e clicar em "Add to cart".<br>2. Abrir /view_cart.<br>3. Verificar quantidades e totais. |
| **Resultado esperado** | Nenhuma quantidade menor ou igual a zero e nenhum total negativo (recusar o item ou ajustar para 1 são correções válidas). |
| **Resultado obtido** | O item entra com quantidade -3 e total negativo (Rs. -1500). |
| **Status** | Falhou (bug conhecido) |
| **Observações** | O campo declara min="1", mas nem a tela nem o servidor aplicam a regra. |

#### CT-BUGS-CART-QUANTITY-02 — Carrinho recusa quantidade zero

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Carrinho › Quantidade |
| **Tipo de teste** | Funcional – validação (valor-limite) |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-02 |
| **Objetivo** | Garantir que a quantidade zero não cria um item sem valor no carrinho. |
| **Pré-condições** | Sem login (sessão nova, carrinho vazio). |
| **Dados de teste** | Produto 1, quantidade 0. |
| **Passos** | 1. Adicionar o produto 1 com quantidade 0 pela página de detalhes.<br>2. Abrir /view_cart.<br>3. Verificar quantidades e totais. |
| **Resultado esperado** | Nenhuma quantidade menor ou igual a zero no carrinho. |
| **Resultado obtido** | O item entra com quantidade 0 e total Rs. 0. |
| **Status** | Falhou (bug conhecido) |

#### CT-BUGS-CART-QUANTITY-03 — Quantidade vazia não gera erro 500

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Carrinho › Quantidade |
| **Tipo de teste** | Robustez – entrada inválida |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-09 |
| **Objetivo** | Garantir que a quantidade vazia não derruba o servidor. |
| **Pré-condições** | Sem login (sessão nova). |
| **Dados de teste** | Produto 5, quantidade vazia. |
| **Passos** | 1. Abrir /product_details/5 e apagar a quantidade.<br>2. Deixar o campo vazio e clicar em "Add to cart".<br>3. Verificar o status de /add_to_cart. |
| **Resultado esperado** | Status HTTP de /add_to_cart menor que 500 (o servidor recusa ou ajusta a entrada). |
| **Resultado obtido** | HTTP 500 com a página de debug do Django; a tela não mostra aviso nenhum. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | O campo é type="number" sem step: o navegador aceita vazio, decimal e notação científica. |

#### CT-BUGS-CART-QUANTITY-04 — Quantidade decimal não gera erro 500

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Carrinho › Quantidade |
| **Tipo de teste** | Robustez – entrada inválida |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-09 |
| **Objetivo** | Garantir que a quantidade 2.5 não derruba o servidor. |
| **Pré-condições** | Sem login (sessão nova). |
| **Dados de teste** | Produto 5, quantidade 2.5. |
| **Passos** | 1. Abrir /product_details/5 e apagar a quantidade.<br>2. Digitar 2.5 e clicar em "Add to cart".<br>3. Verificar o status de /add_to_cart. |
| **Resultado esperado** | Status HTTP de /add_to_cart menor que 500 (o servidor recusa ou ajusta a entrada). |
| **Resultado obtido** | HTTP 500 com a página de debug do Django; a tela não mostra aviso nenhum. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | O campo é type="number" sem step: o navegador aceita vazio, decimal e notação científica. |

#### CT-BUGS-CART-QUANTITY-05 — Quantidade em notação científica não gera erro 500

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Carrinho › Quantidade |
| **Tipo de teste** | Robustez – entrada inválida |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-09 |
| **Objetivo** | Garantir que a quantidade 1e2 não derruba o servidor. |
| **Pré-condições** | Sem login (sessão nova). |
| **Dados de teste** | Produto 5, quantidade 1e2. |
| **Passos** | 1. Abrir /product_details/5 e apagar a quantidade.<br>2. Digitar 1e2 e clicar em "Add to cart".<br>3. Verificar o status de /add_to_cart. |
| **Resultado esperado** | Status HTTP de /add_to_cart menor que 500 (o servidor recusa ou ajusta a entrada). |
| **Resultado obtido** | HTTP 500 com a página de debug do Django; a tela não mostra aviso nenhum. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | O campo é type="number" sem step: o navegador aceita vazio, decimal e notação científica. |

### known-bugs/checkout-access.cy.js

#### CT-BUGS-CHECKOUT-ACCESS-01 — Pagamento inacessível sem login

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Checkout › Acesso |
| **Tipo de teste** | Segurança – autorização |
| **Prioridade** | Alta |
| **Bug relacionado** | BUG-12 |
| **Objetivo** | Garantir que /payment, aberto direto pela URL, não mostra o formulário de pagamento a quem não está logado. |
| **Pré-condições** | Sem login. |
| **Dados de teste** | Nenhum. |
| **Passos** | 1. Abrir /payment pela URL.<br>2. Procurar o botão "Pay and Confirm Order". |
| **Resultado esperado** | O botão de pagamento não aparece (a página exige login). |
| **Resultado obtido** | O formulário completo de cartão aparece, e o pagamento sem login é aceito. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | O bloqueio existe só no aviso do botão do carrinho (CT-CART-CHECKOUT-10). |

#### CT-BUGS-CHECKOUT-ACCESS-02 — Checkout sem "Place Order" para visitante

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Checkout › Acesso |
| **Tipo de teste** | Segurança – autorização |
| **Prioridade** | Alta |
| **Bug relacionado** | BUG-12 |
| **Objetivo** | Garantir que /checkout, aberto direto pela URL, não oferece "Place Order" a quem não está logado. |
| **Pré-condições** | Sem login. |
| **Dados de teste** | Nenhum. |
| **Passos** | 1. Abrir /checkout pela URL.<br>2. Procurar o link para /payment ("Place Order"). |
| **Resultado esperado** | O link "Place Order" não aparece. |
| **Resultado obtido** | A página abre com endereço vazio, total e o botão "Place Order". |
| **Status** | Falhou (bug conhecido) |

#### CT-BUGS-CHECKOUT-ACCESS-03 — Checkout sem "Place Order" com carrinho vazio

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Checkout › Carrinho vazio |
| **Tipo de teste** | Funcional – regra de negócio |
| **Prioridade** | Baixa |
| **Bug relacionado** | BUG-13 |
| **Objetivo** | Garantir que, com o carrinho vazio, /checkout não oferece "Place Order". |
| **Pré-condições** | 1. Conta de teste.<br>2. Usuário logado, com o carrinho vazio. |
| **Dados de teste** | Carrinho vazio. |
| **Passos** | 1. Abrir /checkout pela URL.<br>2. Procurar o link "Place Order". |
| **Resultado esperado** | O link "Place Order" não aparece. |
| **Resultado obtido** | A página mostra Total "Rs. 0" e o botão "Place Order". |
| **Status** | Falhou (bug conhecido) |

#### CT-BUGS-CHECKOUT-ACCESS-04 — Pagamento com carrinho vazio não confirma pedido

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Checkout › Carrinho vazio |
| **Tipo de teste** | Funcional – regra de negócio |
| **Prioridade** | Baixa |
| **Bug relacionado** | BUG-13 |
| **Objetivo** | Garantir que pagar com o carrinho vazio não confirma um pedido. |
| **Pré-condições** | 1. Conta de teste.<br>2. Usuário logado, com o carrinho vazio. |
| **Dados de teste** | Cartão fictício users.json &gt; cards.valid. |
| **Passos** | 1. Abrir /payment.<br>2. Preencher o cartão e clicar em "Pay and Confirm Order".<br>3. Verificar para onde o POST /payment redireciona. |
| **Resultado esperado** | O POST /payment não redireciona para /payment_done (o pedido vazio é recusado). |
| **Resultado obtido** | Redireciona para /payment_done/0 com "Order Placed!": um pedido de Rs. 0 é confirmado. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Tag @creates-order: fica fora dos PRs. |

### known-bugs/email-format.cy.js

#### CT-BUGS-EMAIL-FORMAT-01 — Cadastro pela API recusa e-mail sem @

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Cadastro |
| **Tipo de teste** | Funcional – validação de formato |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-18 |
| **Objetivo** | Garantir que a API recusa um cadastro com e-mail sem @. |
| **Dados de teste** | E-mail "qa.&lt;id&gt;" (users.json &gt; invalidEmails, com ID único). |
| **Passos** | 1. Enviar POST /api/createAccount com todos os campos e o e-mail inválido.<br>2. Verificar o responseCode. |
| **Resultado esperado** | responseCode = 400 e a conta não é criada. |
| **Resultado obtido** | { responseCode: 201, message: "User created!" }: a conta é criada e faz login. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Enquanto o bug existir a conta é criada de fato; o afterEach a apaga. |

#### CT-BUGS-EMAIL-FORMAT-02 — Cadastro pela API recusa e-mail sem domínio

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Cadastro |
| **Tipo de teste** | Funcional – validação de formato |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-18 |
| **Objetivo** | Garantir que a API recusa um cadastro com e-mail sem domínio. |
| **Dados de teste** | E-mail "qa.&lt;id&gt;@" (users.json &gt; invalidEmails, com ID único). |
| **Passos** | 1. Enviar POST /api/createAccount com todos os campos e o e-mail inválido.<br>2. Verificar o responseCode. |
| **Resultado esperado** | responseCode = 400 e a conta não é criada. |
| **Resultado obtido** | { responseCode: 201, message: "User created!" }: a conta é criada e faz login. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Enquanto o bug existir a conta é criada de fato; o afterEach a apaga. |

#### CT-BUGS-EMAIL-FORMAT-03 — Cadastro pela API recusa e-mail sem usuário

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Cadastro |
| **Tipo de teste** | Funcional – validação de formato |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-18 |
| **Objetivo** | Garantir que a API recusa um cadastro com e-mail sem usuário. |
| **Dados de teste** | E-mail "@qa&lt;id&gt;.com" (users.json &gt; invalidEmails, com ID único). |
| **Passos** | 1. Enviar POST /api/createAccount com todos os campos e o e-mail inválido.<br>2. Verificar o responseCode. |
| **Resultado esperado** | responseCode = 400 e a conta não é criada. |
| **Resultado obtido** | { responseCode: 201, message: "User created!" }: a conta é criada e faz login. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Enquanto o bug existir a conta é criada de fato; o afterEach a apaga. |

#### CT-BUGS-EMAIL-FORMAT-04 — Cadastro pela API recusa e-mail com espaço

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Cadastro |
| **Tipo de teste** | Funcional – validação de formato |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-18 |
| **Objetivo** | Garantir que a API recusa um cadastro com e-mail com espaço. |
| **Dados de teste** | E-mail "qa &lt;id&gt;@teste.com" (users.json &gt; invalidEmails, com ID único). |
| **Passos** | 1. Enviar POST /api/createAccount com todos os campos e o e-mail inválido.<br>2. Verificar o responseCode. |
| **Resultado esperado** | responseCode = 400 e a conta não é criada. |
| **Resultado obtido** | { responseCode: 201, message: "User created!" }: a conta é criada e faz login. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Enquanto o bug existir a conta é criada de fato; o afterEach a apaga. |

#### CT-BUGS-EMAIL-FORMAT-05 — Cadastro pela API recusa e-mail com @ duplo

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Cadastro |
| **Tipo de teste** | Funcional – validação de formato |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-18 |
| **Objetivo** | Garantir que a API recusa um cadastro com e-mail com @ duplo. |
| **Dados de teste** | E-mail "qa.&lt;id&gt;@@teste.com" (users.json &gt; invalidEmails, com ID único). |
| **Passos** | 1. Enviar POST /api/createAccount com todos os campos e o e-mail inválido.<br>2. Verificar o responseCode. |
| **Resultado esperado** | responseCode = 400 e a conta não é criada. |
| **Resultado obtido** | { responseCode: 201, message: "User created!" }: a conta é criada e faz login. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Enquanto o bug existir a conta é criada de fato; o afterEach a apaga. |

#### CT-BUGS-EMAIL-FORMAT-06 — Formulário de cadastro recusa e-mail sem @ no servidor

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Cadastro |
| **Tipo de teste** | Funcional – validação no servidor |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-18 |
| **Objetivo** | Garantir que o servidor recusa e-mail sem @ mesmo quando o formulário é enviado sem a validação do navegador. |
| **Dados de teste** | E-mail sem @ e nome alternativo. |
| **Passos** | 1. Pegar o token CSRF de /login e enviar a 1ª etapa do cadastro por HTTP.<br>2. Verificar a página devolvida. |
| **Resultado esperado** | A resposta é uma página do site e não avança para "Enter Account Information". |
| **Resultado obtido** | O servidor avança para "Enter Account Information"; concluindo, a conta é criada. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Só a 1ª etapa: nenhuma conta é criada.<br>Na tela, o type="email" barra o formato (CT-AUTH-SIGNUP-03); o servidor não confere. |

### known-bugs/forms-not-submitted.cy.js

#### CT-BUGS-FORMS-NOT-SUBMITTED-01 — Contact Us envia a mensagem

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Formulários |
| **Tipo de teste** | Funcional – efeito no servidor |
| **Prioridade** | Alta |
| **Bug relacionado** | BUG-08 |
| **Objetivo** | Garantir que o formulário Contact Us envia a mensagem ao servidor, e não só mostra "Success!". |
| **Dados de teste** | users.json &gt; forms.contact (marcado como teste: "[QA automatizado] ..."). |
| **Passos** | 1. Abrir /contact_us e registrar as requisições enviadas ao site.<br>2. Preencher nome, e-mail, assunto e mensagem e clicar em "Submit" (confirmando o diálogo).<br>3. Verificar a mensagem e as requisições. |
| **Resultado esperado** | Aparece "Success! Your details have been submitted successfully." e pelo menos uma requisição (não GET) chega ao site. |
| **Resultado obtido** | "Success!" aparece, mas o JavaScript cancela o envio: nenhuma requisição chega ao site. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Quando o bug for corrigido, o caso passa a enviar mensagens reais a cada execução (ver o aviso no arquivo). |

#### CT-BUGS-FORMS-NOT-SUBMITTED-02 — Newsletter registra a assinatura

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Formulários |
| **Tipo de teste** | Funcional – efeito no servidor |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-10 |
| **Objetivo** | Garantir que a assinatura da newsletter é enviada ao servidor. |
| **Dados de teste** | users.json &gt; forms.newsletter.email. |
| **Passos** | 1. Abrir a página inicial e registrar as requisições.<br>2. Preencher o e-mail no rodapé e clicar no botão.<br>3. Verificar a mensagem e as requisições. |
| **Resultado esperado** | Aparece "You have been successfully subscribed!" e pelo menos uma requisição chega ao site. |
| **Resultado obtido** | A mensagem de sucesso aparece, mas nada é enviado ao servidor. |
| **Status** | Falhou (bug conhecido) |

#### CT-BUGS-FORMS-NOT-SUBMITTED-03 — Avaliação de produto é enviada

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Formulários |
| **Tipo de teste** | Funcional – efeito no servidor |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-11 |
| **Objetivo** | Garantir que a avaliação de produto é enviada ao servidor. |
| **Dados de teste** | users.json &gt; forms.review. |
| **Passos** | 1. Abrir /product_details/1 e registrar as requisições.<br>2. Preencher nome, e-mail e avaliação e clicar em "Submit".<br>3. Verificar a mensagem e as requisições. |
| **Resultado esperado** | Aparece "Thank you for your review." e pelo menos uma requisição chega ao site. |
| **Resultado obtido** | O agradecimento aparece, mas nada é enviado ao servidor. |
| **Status** | Falhou (bug conhecido) |

### known-bugs/mixed-content.cy.js

#### CT-BUGS-MIXED-CONTENT-01 — Folhas de estilo sem recursos via http://

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Front-end |
| **Tipo de teste** | Compatibilidade – conteúdo misto (Mixed Content) |
| **Prioridade** | Baixa |
| **Bug relacionado** | BUG-03 |
| **Objetivo** | Garantir que nenhuma folha de estilo do site importa recursos por http:// numa página https://. |
| **Dados de teste** | Folhas de estilo do próprio site carregadas na página inicial. |
| **Passos** | 1. Abrir a página inicial e listar as folhas de estilo do site.<br>2. Baixar cada uma e procurar @import com http://. |
| **Resultado esperado** | Nenhum @import url(http://...). |
| **Resultado obtido** | O main.css tem 3 @import via http:// (fontes Roboto, Open Sans e Abel), bloqueados pelo navegador. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Conferir só os &lt;link&gt; do HTML não pega o bug: o recurso inseguro vem de um @import dentro do CSS. |

### known-bugs/order-confirmation.cy.js

#### CT-BUGS-ORDER-CONFIRMATION-01 — Fatura não é emitida pela URL

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Pedido |
| **Tipo de teste** | Segurança – integridade (documento forjado) |
| **Prioridade** | Alta |
| **Bug relacionado** | BUG-16 |
| **Objetivo** | Garantir que /download_invoice/&lt;valor&gt; não emite fatura sem um pedido real da sessão. |
| **Pré-condições** | Sem login e sem pedido. |
| **Dados de teste** | Valor forjado 999999. |
| **Passos** | 1. Pedir GET /download_invoice/999999.<br>2. Verificar o conteúdo. |
| **Resultado esperado** | A resposta não traz "Your total purchase amount is 999999". |
| **Resultado obtido** | Baixa a fatura "Your total purchase amount is 999999", com o valor da URL. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Só GET: nenhum pedido é enviado. |

#### CT-BUGS-ORDER-CONFIRMATION-02 — Confirmação de pedido não é gerada pela URL

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Pedido |
| **Tipo de teste** | Segurança – integridade (documento forjado) |
| **Prioridade** | Alta |
| **Bug relacionado** | BUG-16 |
| **Objetivo** | Garantir que /payment_done/&lt;valor&gt; não confirma um pedido sem pagamento. |
| **Pré-condições** | Sem login e sem pedido. |
| **Dados de teste** | Valor forjado 999999. |
| **Passos** | 1. Abrir /payment_done/999999.<br>2. Procurar a confirmação "Order Placed!". |
| **Resultado esperado** | A confirmação não aparece. |
| **Resultado obtido** | "Order Placed! Congratulations! Your order has been confirmed!" aparece. |
| **Status** | Falhou (bug conhecido) |

### known-bugs/payment-validation.cy.js

#### CT-BUGS-PAYMENT-VALIDATION-01 — Pagamento recusa cartão: número do cartão com letras

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Checkout › Pagamento |
| **Tipo de teste** | Funcional – validação de dados de pagamento |
| **Prioridade** | Alta |
| **Bug relacionado** | BUG-20 |
| **Objetivo** | Garantir que um cartão com número do cartão com letras não confirma o pedido. |
| **Pré-condições** | 1. Conta de teste.<br>2. Usuário logado, com o produto 1 no carrinho. |
| **Dados de teste** | users.json &gt; cards.numberWithLetters: número "abcd efgh ijkl". |
| **Passos** | 1. Abrir /payment.<br>2. Preencher o cartão e clicar em "Pay and Confirm Order".<br>3. Verificar para onde o POST /payment redireciona. |
| **Resultado esperado** | O POST /payment não redireciona para /payment_done (o cartão é recusado). |
| **Resultado obtido** | Redireciona para /payment_done/500 com "Order Placed!" e esvazia o carrinho. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Tag @creates-order: fica fora dos PRs.<br>O formulário só tem required nos campos; nem a tela nem o servidor conferem o cartão. |

#### CT-BUGS-PAYMENT-VALIDATION-02 — Pagamento recusa cartão: cartão vencido (01/2000)

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Checkout › Pagamento |
| **Tipo de teste** | Funcional – validação de dados de pagamento |
| **Prioridade** | Alta |
| **Bug relacionado** | BUG-20 |
| **Objetivo** | Garantir que um cartão com cartão vencido (01/2000) não confirma o pedido. |
| **Pré-condições** | 1. Conta de teste.<br>2. Usuário logado, com o produto 1 no carrinho. |
| **Dados de teste** | users.json &gt; cards.expired: validade 01/2000. |
| **Passos** | 1. Abrir /payment.<br>2. Preencher o cartão e clicar em "Pay and Confirm Order".<br>3. Verificar para onde o POST /payment redireciona. |
| **Resultado esperado** | O POST /payment não redireciona para /payment_done (o cartão é recusado). |
| **Resultado obtido** | Redireciona para /payment_done/500 com "Order Placed!" e esvazia o carrinho. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Tag @creates-order: fica fora dos PRs.<br>O formulário só tem required nos campos; nem a tela nem o servidor conferem o cartão. |

#### CT-BUGS-PAYMENT-VALIDATION-03 — Pagamento recusa cartão: mês 13 e CVC com letras

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Checkout › Pagamento |
| **Tipo de teste** | Funcional – validação de dados de pagamento |
| **Prioridade** | Alta |
| **Bug relacionado** | BUG-20 |
| **Objetivo** | Garantir que um cartão com mês 13 e CVC com letras não confirma o pedido. |
| **Pré-condições** | 1. Conta de teste.<br>2. Usuário logado, com o produto 1 no carrinho. |
| **Dados de teste** | users.json &gt; cards.invalidFormat: mês 13 e CVC "xyz". |
| **Passos** | 1. Abrir /payment.<br>2. Preencher o cartão e clicar em "Pay and Confirm Order".<br>3. Verificar para onde o POST /payment redireciona. |
| **Resultado esperado** | O POST /payment não redireciona para /payment_done (o cartão é recusado). |
| **Resultado obtido** | Redireciona para /payment_done/500 com "Order Placed!" e esvazia o carrinho. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Tag @creates-order: fica fora dos PRs.<br>O formulário só tem required nos campos; nem a tela nem o servidor conferem o cartão. |

#### CT-BUGS-PAYMENT-VALIDATION-04 — Pagamento recusa campos vazios enviados sem o navegador

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Checkout › Pagamento |
| **Tipo de teste** | Funcional – validação no servidor |
| **Prioridade** | Alta |
| **Bug relacionado** | BUG-20 |
| **Objetivo** | Garantir que o servidor recusa o pagamento com todos os campos do cartão vazios. |
| **Pré-condições** | 1. Conta de teste.<br>2. Usuário logado, com o produto 1 no carrinho. |
| **Dados de teste** | users.json &gt; cards.empty (todos os campos vazios). |
| **Passos** | 1. Pegar o token CSRF de /payment e enviar o formulário por HTTP.<br>2. Verificar para onde o POST redireciona. |
| **Resultado esperado** | O POST /payment não redireciona para /payment_done. |
| **Resultado obtido** | Redireciona para /payment_done/500: o pedido é confirmado. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Tag @creates-order.<br>Na tela, o required impede o envio vazio; o servidor não confere. |

### known-bugs/product-not-found.cy.js

#### CT-BUGS-PRODUCT-NOT-FOUND-01 — Produto inexistente responde 404

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Produtos |
| **Tipo de teste** | Funcional – recurso inexistente |
| **Prioridade** | Baixa |
| **Bug relacionado** | BUG-21 |
| **Objetivo** | Garantir que a página de um produto que não existe responde 404. |
| **Pré-condições** | Catálogo da API como referência (o ID 9999 não existe nele). |
| **Dados de teste** | ID 9999. |
| **Passos** | 1. Pedir GET /product_details/9999.<br>2. Verificar o status HTTP. |
| **Resultado esperado** | Status HTTP 404. |
| **Resultado obtido** | HTTP 200 com uma página de produto vazia (sem nome, preço nem marca), mas com "In Stock" e "Add to cart". |
| **Status** | Falhou (bug conhecido) |

#### CT-BUGS-PRODUCT-NOT-FOUND-02 — Carrinho recusa produto inexistente

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Produtos |
| **Tipo de teste** | Funcional – recurso inexistente |
| **Prioridade** | Baixa |
| **Bug relacionado** | BUG-21 |
| **Objetivo** | Garantir que adicionar um produto inexistente ao carrinho responde erro, e não sucesso. |
| **Pré-condições** | Catálogo da API como referência (o ID 9999 não existe nele). |
| **Dados de teste** | ID 9999. |
| **Passos** | 1. Pedir GET /add_to_cart/9999.<br>2. Verificar o status e o corpo.<br>3. Ler o carrinho. |
| **Resultado esperado** | Status HTTP 404, a resposta não é "Added To Cart" e o carrinho continua vazio. |
| **Resultado obtido** | Responde "Added To Cart" com HTTP 200, embora nada entre no carrinho. |
| **Status** | Falhou (bug conhecido) |

### known-bugs/required-fields.cy.js

#### CT-BUGS-REQUIRED-FIELDS-01 — Cadastro pela API recusa "password" vazio

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Cadastro |
| **Tipo de teste** | Funcional – validação de campo obrigatório |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-19 |
| **Objetivo** | Garantir que a API recusa o cadastro com o campo obrigatório "password" enviado vazio. |
| **Dados de teste** | Conta padrão com e-mail único e password = "". |
| **Passos** | 1. Enviar POST /api/createAccount com o campo vazio.<br>2. Verificar o responseCode. |
| **Resultado esperado** | responseCode = 400 e a conta não é criada. |
| **Resultado obtido** | { responseCode: 201, message: "User created!" }: a conta é criada. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Sem o campo, a API responde 400 (CT-API-ACCOUNT-02 e 03); vazio, ela aceita.<br>A conta criada com senha vazia faz login com a senha vazia. |

#### CT-BUGS-REQUIRED-FIELDS-02 — Cadastro pela API recusa "name" vazio

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Cadastro |
| **Tipo de teste** | Funcional – validação de campo obrigatório |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-19 |
| **Objetivo** | Garantir que a API recusa o cadastro com o campo obrigatório "name" enviado vazio. |
| **Dados de teste** | Conta padrão com e-mail único e name = "". |
| **Passos** | 1. Enviar POST /api/createAccount com o campo vazio.<br>2. Verificar o responseCode. |
| **Resultado esperado** | responseCode = 400 e a conta não é criada. |
| **Resultado obtido** | { responseCode: 201, message: "User created!" }: a conta é criada. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Sem o campo, a API responde 400 (CT-API-ACCOUNT-02 e 03); vazio, ela aceita. |

#### CT-BUGS-REQUIRED-FIELDS-03 — Cadastro pela API recusa "firstname" vazio

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Cadastro |
| **Tipo de teste** | Funcional – validação de campo obrigatório |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-19 |
| **Objetivo** | Garantir que a API recusa o cadastro com o campo obrigatório "firstname" enviado vazio. |
| **Dados de teste** | Conta padrão com e-mail único e firstname = "". |
| **Passos** | 1. Enviar POST /api/createAccount com o campo vazio.<br>2. Verificar o responseCode. |
| **Resultado esperado** | responseCode = 400 e a conta não é criada. |
| **Resultado obtido** | { responseCode: 201, message: "User created!" }: a conta é criada. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Sem o campo, a API responde 400 (CT-API-ACCOUNT-02 e 03); vazio, ela aceita. |

#### CT-BUGS-REQUIRED-FIELDS-04 — Cadastro pela API recusa "city" vazio

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › API › Cadastro |
| **Tipo de teste** | Funcional – validação de campo obrigatório |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-19 |
| **Objetivo** | Garantir que a API recusa o cadastro com o campo obrigatório "city" enviado vazio. |
| **Dados de teste** | Conta padrão com e-mail único e city = "". |
| **Passos** | 1. Enviar POST /api/createAccount com o campo vazio.<br>2. Verificar o responseCode. |
| **Resultado esperado** | responseCode = 400 e a conta não é criada. |
| **Resultado obtido** | { responseCode: 201, message: "User created!" }: a conta é criada. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Sem o campo, a API responde 400 (CT-API-ACCOUNT-02 e 03); vazio, ela aceita. |

#### CT-BUGS-REQUIRED-FIELDS-05 — Formulário de cadastro recusa nome vazio no servidor

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Cadastro |
| **Tipo de teste** | Funcional – validação no servidor |
| **Prioridade** | Média |
| **Bug relacionado** | BUG-19 |
| **Objetivo** | Garantir que o servidor recusa nome vazio mesmo quando o formulário é enviado sem a validação do navegador. |
| **Dados de teste** | Nome vazio e e-mail único. |
| **Passos** | 1. Enviar a 1ª etapa do cadastro por HTTP com nome vazio.<br>2. Verificar a página devolvida. |
| **Resultado esperado** | A resposta é uma página do site e não avança para "Enter Account Information". |
| **Resultado obtido** | O servidor aceita e avança para "Enter Account Information". |
| **Status** | Falhou (bug conhecido) |
| **Observações** | Só a 1ª etapa: nenhuma conta é criada. |

### known-bugs/search-input.cy.js

#### CT-BUGS-SEARCH-INPUT-01 — Busca com espaço duplo entre as palavras

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Produtos › Busca |
| **Tipo de teste** | Funcional – entrada com caracteres especiais |
| **Prioridade** | Baixa |
| **Bug relacionado** | BUG-15 |
| **Objetivo** | Garantir que dois espaços entre as palavras não impedem a busca de encontrar o produto. |
| **Pré-condições** | Catálogo da API como referência. |
| **Dados de teste** | Digitado: "blue  top"; equivalente: "blue top". |
| **Passos** | 1. Buscar "blue  top" pela tela.<br>2. Verificar os IDs exibidos. |
| **Resultado esperado** | Os IDs na tela são exatamente os do catálogo que contêm "blue top". |
| **Resultado obtido** | Nenhum produto encontrado (lista vazia). |
| **Status** | Falhou (bug conhecido) |
| **Observações** | O script da busca monta a URL concatenando o texto, sem trim nem encodeURIComponent. |

#### CT-BUGS-SEARCH-INPUT-02 — Busca com "&" no termo

| Campo | Descrição |
|---|---|
| **Módulo / Área** | Bugs conhecidos › Produtos › Busca |
| **Tipo de teste** | Funcional – entrada com caracteres especiais |
| **Prioridade** | Baixa |
| **Bug relacionado** | BUG-15 |
| **Objetivo** | Garantir que um "&amp;" no termo é buscado como texto, e não corta a busca. |
| **Pré-condições** | Catálogo da API como referência. |
| **Dados de teste** | Digitado: "Blue &amp; Pink"; equivalente: "Blue &amp; Pink". |
| **Passos** | 1. Buscar "Blue &amp; Pink" pela tela.<br>2. Verificar os IDs exibidos. |
| **Resultado esperado** | Os IDs na tela são exatamente os do catálogo que contêm "Blue &amp; Pink". |
| **Resultado obtido** | O "&amp;" corta o termo: aparecem os produtos de "Blue" ([1, 16, 21, 37, 41]) em vez de só [16]. |
| **Status** | Falhou (bug conhecido) |
| **Observações** | O script da busca monta a URL concatenando o texto, sem trim nem encodeURIComponent. |
