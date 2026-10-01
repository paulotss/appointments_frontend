import { z } from 'zod'

const itemSchema = z.object({
  procedureId: z
    .number({ error: 'Selecione o procedimento' })
    .int()
    .positive('Selecione o procedimento'),
  quantity: z
    .number({ error: 'Informe a quantidade' })
    .int('Informe um número inteiro')
    .min(1, 'Quantidade deve ser no mínimo 1'),
})

export const pacoteSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do pacote'),
  discountPercent: z
    .number({ error: 'Informe o desconto' })
    .min(0, 'Desconto não pode ser negativo')
    .max(100, 'Desconto não pode ser maior que 100'),
  isActive: z.boolean(),
  items: z
    .array(itemSchema)
    .min(1, 'Inclua ao menos um procedimento')
    .superRefine((items, ctx) => {
      const ids = items.map((item) => item.procedureId)
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({
          code: 'custom',
          message: 'Procedimentos duplicados não são permitidos',
          path: [],
        })
      }
    }),
})

export type PacoteFormInput = z.input<typeof pacoteSchema>
export type PacoteFormValues = z.infer<typeof pacoteSchema>
