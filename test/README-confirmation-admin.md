# Testes da confirmação administrativa

```sh
npm ci
npm run test:contact-status
npm run build
npx playwright install chromium
```

O teste de situação da autorização executa a função TypeScript existente,
transpilada com a dependência TypeScript do projeto. Distingue autorização
expirada, futura, inválida, ausente, revogada e vigente.

`npm run test:confirmation-admin` é a etapa de navegador de uma homologação
integrada. Ela exige os serviços fictícios preparados pelo runner do backend;
não deve ser executada apontando para o ambiente de trabalho da clínica.

O roteiro completo está em
`appointments_backend/test/README-confirmation-admin.md`, no repositório irmão.
O runner cria banco e usuários descartáveis, inicia o backend real, o
classificador Python e o Vite, executa este teste Playwright e remove os serviços
temporários em `finally`.

Os endpoints do teste são fixos e locais: frontend 5178, backend 3105 e
classificador 8877. As referências usam o namespace `fixture`, e o navegador
bloqueia requisições fora da origem local do frontend. O teste exercita controles
da interface; as verificações HTTP complementares cobrem permissões, estados
persistidos e auditoria. Nenhum serviço de envio ou sistema legado é iniciado.

As evidências ficam em `/tmp/higia-admin-homologation`: captura da campanha
aprovada e `result.json`; em falha, captura e árvore de acessibilidade fictícias.
Arquivos de sessão, credenciais e tokens não fazem parte das evidências nem do Git.

A suíte cobre o fluxo administrativo. Leitura real da agenda, envio WhatsApp,
confirmação no legado, dispatcher e deploy continuam fora desta homologação.

## Respostas e pendências (4B)

A homologação específica usa `test/confirmation-replies.homologation.mjs`, iniciada
pelo runner `appointments_backend/test/run-confirmation-replies.py --browser`.
Ela usa frontend 5181, API 3111 e banco descartável 5551, sem carregar o `.env` local.
Valida prazo de São Paulo com navegador em UTC, edição bloqueada após aprovação,
assunção, conclusão obrigatória da mesma pendência, filtros e ausência de referências
sensíveis na página. Evidências fictícias ficam em `/tmp/higia-replies-browser`.
Não executar o teste apontando para serviços da clínica.

## Resultado da confirmação no Saúde Vianet

`test/confirmation-legacy.homologation.mjs` é executado pelo runner descartável
`appointments_backend/test/run-confirmation-legacy.py`, com `--frontend-root`
e `--playwright-module`. Usa Vite 5183, API 3113, Python 8879 e PostgreSQL 5553.
O teste distingue a manifestação do paciente do resultado confirmado no legado,
com autenticação real sobre fixtures e sem requisições externas. O legado usa
somente HTTP simulado. O runner remove os serviços e as sessões ao terminar.

Contratos, resultados e pendências de ativação estão em
`appointments_backend/docs/confirmacao-legado.md`. A nova coluna também distingue
confirmação bloqueada, recusada e desconhecida; não habilita escrita ou envio real.


## Política de contato da confirmação

A autorização de contato deixou de ser requisito da confirmação por decisão
explícita da clínica. O formulário e o aviso de autorização pendente foram
retirados. Nenhuma autorização é criada para contornar a ausência desse registro.
Histórico e revogações continuam preservados. Verificação do número e da pessoa,
responsável legal para menores, idade conhecida e revalidação independente continuam
obrigatórios. A mudança não aprova campanhas nem habilita dispatcher ou escrita.

`Reavaliar contato` envia uma ação administrativa autenticada, com a referência
do paciente selecionado, para atualizar a classificação das campanhas existentes.
A seleção do paciente e as consultas não executam essa ação automaticamente.
Campanhas aprovadas continuam sujeitas ao snapshot aprovado e à sua revalidação;
a reavaliação não cria aprovação nem altera esse snapshot.

`npm run test:confirmation-contact-policy` usa Vite somente em
`127.0.0.1:5186`, sem `.env`, API simulada e bloqueio de acesso externo. Cobre
remoção do formulário, histórico de revogações, reavaliação explícita e falha
técnica sem promoção local. Requer Chromium/Playwright; `PLAYWRIGHT_MODULE` pode
apontar para uma instalação temporária da versão fixada no lockfile.

A homologação administrativa completa continua em
`test/confirmation-admin.homologation.mjs`, com banco descartável e APIs reais
sobre fixtures. Seus casos refletem a política: ausência/expiração não bloqueiam
adulto com um único celular válido no cadastro, mas revogação, número divergente e responsável não verificado
continuam bloqueando. Nenhum serviço de envio é iniciado.


## Resolução em lote e recuperação do formulário

Na campanha editável, `Resolver pendências automaticamente` consulta novamente a
origem e reavalia seus agendamentos, sem adicionar novos horários. Somente dados
conclusivos da origem podem resolver pendências: para adultos, um único celular
válido no cadastro dispensa verificação manual de titularidade.
A operação não cria verificações, vínculo de responsável, aprovação ou envio.
Revogações, conflitos de número, ausência de responsável legal verificado para
menores e falhas técnicas continuam bloqueando.
Campanha aprovada exige reabertura. Mudança concorrente aborta a atualização.

Adultos com pendência antiga usam `Atualizar contato`, sem abrir formulário.
O formulário individual de responsável legal permite clicar em Salvar e mostra a causa específica de
um bloqueio. Telefone visível sem referência não é reconstruído pela máscara:
`Atualizar dados do agendamento` busca os dados do mesmo item na origem. Uma
mudança de paciente/destinatário é bloqueada e não faz associação automática.
Após troca de referência, o formulário é reiniciado para nova conferência.

Leituras do formulário têm limite de 20 segundos; escritas, de 30 segundos.
Resultado incerto exige `Conferir registro` por leitura, sem repetir a gravação.
Se o registro foi concluído e só a atualização da tela falhou, `Atualizar campanha`
repete apenas a consulta. Um contato já verificado é reaproveitado, sem outra
declaração. O andamento de uma campanha não substitui outra após navegação.

`npm run test:confirmation-pending` usa Vite somente em `127.0.0.1:5187`, página
e formulário reais e API inteiramente fictícia. Bloqueia chamadas externas.
Cobre lote, referência ausente, recuperação, resultado incerto, clique repetido,
campanha aprovada e navegação durante a operação. Usa Playwright/Chromium da
versão do lockfile, com `PLAYWRIGHT_MODULE` opcional para ferramentas em `/tmp`.

A homologação administrativa completa também cobre esses fluxos com Nest,
PostgreSQL descartável e classificador Python reais sobre fixtures, iniciados
por `appointments_backend/test/run-confirmation-contact-policy.py`.

## Recuperação da primeira coleta

Uma campanha editável com consulta FAILED e nenhum item pode usar
`Tentar consultar agenda novamente`. A consulta usa a origem configurada e
carrega os agendamentos na mesma campanha somente quando agenda e registro
estão disponíveis, com auditoria e proteção contra mudança concorrente.
Nova falha ou resultado parcial preserva a campanha anterior. Campanhas
aprovadas não são alteradas. O fluxo não cria verificações nem envia mensagens.

## Liberação explícita dos envios

`npm run test:confirmation-send-release` valida o componente real com API
inteiramente fictícia em 127.0.0.1:5188 e bloqueia requisições externas. Cobre
seleção apenas de aptos, ausência de gravação na abertura, diálogo de autorização,
cancelamento, liberação, pausa e conflito de versão entre operadores.
A criação da campanha permanece manual. Aprovação e liberação são etapas distintas.
Pausar novos envios não desfaz chamadas externas em andamento nem interrompe o
tratamento das respostas já recebidas. A habilitação técnica da rotina é separada.

## Inclusão de agendamentos novos

Na campanha editável, `Consultar novos agendamentos` apresenta somente horários
que ainda não fazem parte dela. A consulta não grava. Selecione os horários e use
`Incluir selecionados`; os itens e identificadores existentes não são substituídos.
A operação exige fonte completa, conferência da versão da campanha e dos dados
consultados, transação e auditoria. Mudança de identidade, contato ou classificação
entre conferência e inclusão exige nova consulta. Campanha aprovada exige reabertura.

Não há envio, aprovação nem nova autorização de contato automática. Depois da
inclusão, confira o prazo e aprove novamente; a nova revisão exige atualizar a
seleção técnica e liberar explicitamente os envios. Identidade visual indisponível
não é substituída por dados digitados. Resultado incerto exige `Conferir campanha`
por leitura, sem repetir automaticamente a gravação.

`npm run test:confirmation-new-appointments` usa a página real em 127.0.0.1:5189,
API fictícia e bloqueio de tráfego externo. Cobre aprovação, seleção, preservação
da linha antiga, erro, conflito, resultado incerto, clique repetido e navegação.
A homologação administrativa completa também inclui o fluxo novo com Nest e
PostgreSQL descartáveis, preservando IDs, histórico e restrição dos tokens de leitura.


## Diagnóstico de revalidação

`npm run test:confirmation-revalidation` usa o componente real de respostas em Vite isolado na porta 5188, sem `.env`, com API fictícia e bloqueio de acesso externo. Confere as descrições distintas de demora na consulta, telefone repetido e paciente divergente, preserva a descrição histórica genérica e não expõe códigos desconhecidos. A navegação não realiza mutações.

As operações que consultam a fonte aguardam até cinco minutos, cobrindo a coleta e a identificação independentes de até dois minutos cada. Recuperação por consulta e prevenção de repetição das ações administrativas continuam cobertas por `npm run test:confirmation-pending`.
