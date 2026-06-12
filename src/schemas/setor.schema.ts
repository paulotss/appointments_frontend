import { z } from 'zod'

export const setorSchema = z.object({
  name: z.string().min(2, 'Informe o nome do setor'),
  isActive: z.boolean(),
})

export type SetorFormValues = z.infer<typeof setorSchema>
