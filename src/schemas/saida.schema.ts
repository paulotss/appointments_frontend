import { z } from 'zod'

export const saidaSchema = z.object({
  batchId: z.number().int().positive('Selecione um lote'),
  quantity: z.number().int().positive('Informe uma quantidade maior que zero'),
  userId: z.number().int().positive('Selecione um usuario'),
  exitDate: z.string().min(1, 'Informe a data da saida'),
})

export type SaidaFormValues = z.infer<typeof saidaSchema>
