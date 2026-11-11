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
