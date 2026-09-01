import { z } from 'zod'
import { TISS_VERSIONS } from '../types/tiss'

export const planoSaudeSchema = z.object({
  name: z.string().min(2, 'Informe o nome'),
  submissionDeadlineDays: z.coerce
    .number({ error: 'Informe o prazo em dias' })
    .int('Informe um numero inteiro')
    .positive('Informe um prazo maior que zero'),
  registroAns: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value.replace(/\D/g, '') : undefined))
    .refine((value) => value == null || value.length === 6, {
      message: 'Registro ANS deve ter 6 dígitos',
    }),
  providerCode: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  tissVersion: z.enum(TISS_VERSIONS),
})

export type PlanoSaudeFormInput = z.input<typeof planoSaudeSchema>
export type PlanoSaudeFormValues = z.infer<typeof planoSaudeSchema>
