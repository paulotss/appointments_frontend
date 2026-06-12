import { z } from 'zod'

export const categoriaSchema = z.object({
  name: z.string().min(2, 'Informe o nome da categoria'),
})

export type CategoriaFormValues = z.infer<typeof categoriaSchema>
