import { z } from 'zod'

export const registroSchema = z
  .object({
    nome: z.string().min(3, 'Informe o nome completo'),
    telefone: z.string().optional(),
    atendimento: z.enum(['whatsapp', 'telefone', 'outro']),
    primeira_vez: z.enum(['sim', 'nao']),
    agendamento: z.enum(['sim', 'nao']),
    motivo: z.string().nullable(),
    especialidade_id: z
      .number({ error: 'Selecione uma especialidade' })
      .int('Especialidade invalida')
      .positive('Especialidade invalida')
      .nullable(),
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

export type RegistroFormValues = z.infer<typeof registroSchema>
