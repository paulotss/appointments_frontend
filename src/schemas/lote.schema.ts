import { z } from 'zod'

const optionalPositiveInt = z
  .union([z.number(), z.nan()])
  .optional()
  .transform((value) => (value == null || Number.isNaN(value) ? undefined : value))
  .pipe(z.number().int().positive().optional())

const optionalNonNegativeNumber = z
  .union([z.number(), z.nan()])
  .optional()
  .transform((value) => (value == null || Number.isNaN(value) ? undefined : value))
  .pipe(z.number().min(0).optional())

export const loteSchema = z.object({
  productId: z.number().int().positive('Selecione um produto'),
  sectorId: z.number().int().positive('Selecione um setor'),
  initialQuantity: z.number().int().positive('Informe uma quantidade maior que zero'),
  movementDate: z.string().min(1, 'Informe a data de inclusao'),
  userId: z.number().int().positive('Selecione um usuario'),
  locationId: z.number().int().positive('Selecione um local'),
  currentQuantity: optionalPositiveInt,
  value: optionalNonNegativeNumber,
  expirationDate: z.string().optional(),
  notes: z.string().optional(),
  invoiceAccessKey: z
    .string()
    .optional()
    .refine((value) => !value || /^\d{44}$/.test(value), {
      message: 'A chave NF-e deve ter 44 digitos',
    }),
})

export type LoteFormValues = z.infer<typeof loteSchema>
