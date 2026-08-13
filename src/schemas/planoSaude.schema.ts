import { z } from 'zod'

export const planoSaudeSchema = z.object({
  name: z.string().min(2, 'Informe o nome'),
  submissionDeadlineDays: z.coerce
    .number({ error: 'Informe o prazo em dias' })
    .int('Informe um numero inteiro')
    .positive('Informe um prazo maior que zero'),
})

export type PlanoSaudeFormInput = z.input<typeof planoSaudeSchema>
export type PlanoSaudeFormValues = z.infer<typeof planoSaudeSchema>
