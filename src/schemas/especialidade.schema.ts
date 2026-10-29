import { z } from 'zod'

export const especialidadeSchema = z.object({
  name: z.string().min(2, 'Informe o nome da especialidade'),
  cbosCode: z
    .string()
    .transform((value) => value.replace(/\D/g, ''))
    .refine((value) => value.length === 6, { message: 'CBO-S deve ter 6 dígitos' }),
})

export type EspecialidadeFormValues = z.infer<typeof especialidadeSchema>
