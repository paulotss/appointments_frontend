import { z } from 'zod'

export const registroSchema = z
  .object({
    nome: z.string().trim().min(3, 'Informe o nome completo'),
    telefone: z.string().trim().min(1, 'Informe o telefone'),
    atendimento: z
      .string()
      .min(1, 'Selecione uma opcao de atendimento')
      .pipe(z.enum(['whatsapp', 'telefone', 'outro'])),
    primeira_vez: z
      .string()
      .min(1, 'Selecione uma opcao')
      .pipe(z.enum(['sim', 'nao'])),
    agendamento: z
      .string()
      .min(1, 'Selecione uma opcao')
      .pipe(z.enum(['sim', 'nao'])),
    motivo: z.string().nullable(),
    especialidade_id: z
      .number({ error: 'Selecione uma especialidade' })
      .int('Especialidade invalida')
      .positive('Especialidade invalida')
      ,
    observacoes: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.agendamento === 'nao') {
      const motivoTrim = values.motivo?.trim() ?? ''
      if (!motivoTrim) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Motivo e obrigatorio quando nao houve agendamento',
          path: ['motivo'],
        })
      }
    }
  })

export type RegistroFormInput = z.input<typeof registroSchema>
export type RegistroFormValues = z.output<typeof registroSchema>
