import { z } from 'zod'
import { TISS_GUIDE_TYPES } from '../types/tiss'

const healthPlanPriceSchema = z.object({
  healthPlanId: z.number({ error: 'Selecione o plano de saúde' }).int().positive('Selecione o plano de saúde'),
  tissCode: z.string().trim().min(1, 'Informe o código TISS'),
  value: z.number({ error: 'Informe o valor do convênio' }).positive('Informe o valor do convênio'),
})

export const procedimentoSchema = z.object({
  specialtyId: z.number({ error: 'Selecione a especialidade' }).int().positive('Selecione a especialidade'),
  name: z.string().trim().min(2, 'Informe o nome do procedimento'),
  value: z.number({ error: 'Informe o valor particular' }).positive('Informe o valor particular'),
  tissGuideType: z.enum(TISS_GUIDE_TYPES, { error: 'Selecione o tipo da guia TISS' }),
  healthPlanPrices: z
    .array(healthPlanPriceSchema)
    .superRefine((items, ctx) => {
      const ids = items.map((item) => item.healthPlanId)
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({
          code: 'custom',
          message: 'Planos duplicados não são permitidos',
          path: [],
        })
      }
    }),
})

export type ProcedimentoFormInput = z.input<typeof procedimentoSchema>
export type ProcedimentoFormValues = z.infer<typeof procedimentoSchema>
