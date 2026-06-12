import { z } from 'zod'

export const produtoSchema = z.object({
  name: z.string().min(2, 'Informe o nome do produto'),
  sku: z.string().min(1, 'Informe o SKU'),
  categoryId: z.number().int().positive('Selecione uma categoria'),
  minimumStock: z.number().int().min(0, 'Informe um valor maior ou igual a zero'),
  isActive: z.boolean(),
})

export type ProdutoFormValues = z.infer<typeof produtoSchema>
