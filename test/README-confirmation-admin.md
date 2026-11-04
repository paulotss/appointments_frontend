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
