import { z } from 'zod'

export const especialidadeSchema = z.object({
  name: z.string().min(2, 'Informe o nome da especialidade'),
})

export type EspecialidadeFormValues = z.infer<typeof especialidadeSchema>
