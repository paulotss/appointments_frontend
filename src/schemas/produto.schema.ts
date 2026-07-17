import { z } from 'zod'

export const produtoSchema = z.object({
  name: z.string().min(2, 'Informe o nome do produto'),
  sku: z.string().min(1, 'Informe o SKU'),
  categoryId: z.number().int().positive('Selecione uma categoria'),
  minimumStock: z.number().int().min(0, 'Informe um valor maior ou igual a zero'),
  unitsPerPackage: z.number().int().min(1, 'Informe um valor maior ou igual a 1'),
})

export type ProdutoFormValues = z.infer<typeof produtoSchema>
