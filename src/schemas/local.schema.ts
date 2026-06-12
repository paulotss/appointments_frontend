import { z } from 'zod'

export const localSchema = z.object({
  name: z.string().min(2, 'Informe o nome do local'),
})

export type LocalFormValues = z.infer<typeof localSchema>
