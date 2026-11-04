# Regras de trabalho

## Ambiente e Git

- Utilizar o Fedora WSL como ambiente de desenvolvimento.
- Antes de modificar arquivos, inspecionar a branch, o HEAD, o estado do
  Git e as diferenças locais.
- Preservar alterações locais existentes. Não descartá-las, sobrescrevê-las
  ou incluí-las no commit da tarefa sem autorização.
- Partir da main sincronizada com origin/main e criar uma branch de
  feature, preferencialmente com prefixo codex/.
- Sincronizar main somente quando seguro, utilizando fast-forward.
  Se houver divergência ou alterações que impeçam a operação, informar
  o problema antes de prosseguir.
- Criar um único commit de consolidação por repositório modificado,
  incluindo somente alterações da tarefa.
- Não executar push, criar PR, realizar merge ou executar deploy sem
  autorização do usuário para a ação correspondente. Autorizações
  anteriores não constituem autorização permanente para novas tarefas.

## Validação e entrega

- Executar os testes relevantes e o typecheck antes de concluir.
- Isolar os testes de serviços externos, credenciais e dados reais.
  Utilizar registros fictícios nas validações de integração.
- Se testes ou typecheck estiverem indisponíveis ou falharem, informar
  a limitação e não apresentar a validação como concluída.
- Ao finalizar, resumir as alterações, os testes e typechecks executados,
  os resultados e as pendências. Informar branch e commit, quando houver.
- Preservar e respeitar as instruções existentes aplicáveis ao trabalho.

## Privacidade e segurança

- Não expor dados pessoais ou credenciais em logs, saídas de comandos,
  testes, documentação, commits ou PRs. Ao verificar configurações,
  informar apenas presença e validade, sem revelar os valores.
- Não modificar dados de pacientes reais sem autorização explícita.
  Consultas a dados reais devem limitar-se à necessidade e ao escopo
  autorizado.
- Não confirmar agendamentos no Saúde Vianet.
- Não enviar WhatsApp real nem habilitar o dispatcher sem aprovação
  explícita. A aprovação administrativa de uma campanha não autoriza
  o envio real.
- Manter a separação entre validade do número, titularidade verificada,
  autorização de contato e revogação.
- Número informado, formulário preenchido ou campanha aprovada não
  tornam um destinatário automaticamente apto.
- Para menores, exigir a verificação do responsável legal.
- Respeitar revogações e validade das autorizações. Falhas técnicas,
  ausência de evidências ou configuração incompleta devem bloquear
  a elegibilidade.
- Não inventar fundamento jurídico nem criar autorizações reais a partir
  de dados fictícios ou de uma simples marcação na interface.
- Preservar a revalidação independente imediatamente antes de qualquer
  futura tentativa de envio.
- Não rotacionar ou reutilizar chaves HMAC e tokens de finalidades
  distintas sem avaliar o impacto nas referências e registros existentes.

## Escopo deste repositório

- Interface administrativa do Higia para campanhas e contatos.
- Não promover contatos a aptos por decisões locais da interface.
  Respeitar os estados e validações retornados pelo backend.
- Manter referências técnicas preenchidas automaticamente nos fluxos
  da recepção e telefones mascarados nas exibições administrativas.

## Verificação específica

- Executar npm run build, que inclui a verificação TypeScript.
- Validar os fluxos afetados com dados fictícios.
- Executar npm run test:contact-status para alterações na situação da autorização.
- Para o fluxo administrativo, executar a homologação isolada de navegador
  conforme test/README-confirmation-admin.md. Informar limitações e descrever
  a validação funcional realizada.
