import { z } from 'zod'

export const saidaSchema = z.object({
  productId: z.number().int().positive('Selecione um produto'),
  locationId: z.number().int().positive('Selecione um local'),
  batchId: z.number().int().positive('Selecione um lote'),
  quantity: z.number().int().positive('Informe uma quantidade maior que zero'),
})

export type SaidaFormValues = z.infer<typeof saidaSchema>
