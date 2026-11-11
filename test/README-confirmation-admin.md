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


## Registro de autorização de contato

`npm run test:confirmation-authorization` inicia Vite somente em
`127.0.0.1:5186`, sem arquivo `.env` ou configuração local. Renderiza a página
real de contatos com a API inteiramente simulada no navegador e bloqueia
requisições externas. Não depende de tokens, banco ou pacientes reais. Requer
Chromium do Playwright instalado. `PLAYWRIGHT_MODULE` pode apontar para uma
instalação temporária da versão do lockfile.

Cobre o destinatário vinculado à verificação selecionada, evidência e fundamento
sem preenchimento automático, validade no fuso do dispositivo, clique repetido,
evidência já registrada (inclusive revogada), falha de consulta, recusa de
permissão, atualização da tela após sucesso e resultado de escrita incerto.
Atualizar a consulta não repete o POST. Resultado incerto bloqueia a repetição
naquele formulário e exige conferir o histórico. A consulta prévia da evidência
reduz duplicações, mas não substitui idempotência transacional no backend.

O formulário registra uma autorização já obtida; não solicita uma nova autorização
ao paciente, não escolhe fundamento jurídico nem define validade automaticamente.
As referências da evidência e do fundamento devem corresponder a registros reais
mantidos pela clínica, sem dados pessoais ou texto de conversas. Reutilizar a
mesma evidência não renova uma autorização revogada. O backend continua responsável
pela elegibilidade, vínculo do responsável legal e revalidação antes de envio.

Este teste de interface usa mocks; a integração autenticada backend → Python →
legado fictício → Higia foi executada separadamente com o runner de legado.
Nenhuma autorização ou verificação clínica real é criada pelos testes.
