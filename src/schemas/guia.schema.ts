import { z } from 'zod'
import { INSURANCE_GUIDE_STATUSES } from '../types/guia'

const procedimentoGuiaSchema = z.object({
  procedureId: z.number({ error: 'Selecione o procedimento' }).int().positive('Selecione o procedimento'),
  authorizedQuantity: z.coerce
    .number({ error: 'Informe a quantidade autorizada' })
    .int('Informe um número inteiro')
    .min(1, 'Quantidade autorizada deve ser no mínimo 1'),
})

export const guiaSchema = z.object({
  healthPlanId: z.number({ error: 'Selecione o plano de saúde' }).int().positive('Selecione o plano de saúde'),
  patientId: z.number({ error: 'Selecione o paciente' }).int().positive('Selecione o paciente'),
  healthProfessionalId: z
    .number({ error: 'Selecione o profissional' })
    .int()
    .positive('Selecione o profissional'),
  status: z.enum(INSURANCE_GUIDE_STATUSES),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de início'),
  expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de validade'),
  procedures: z
    .array(procedimentoGuiaSchema)
    .min(1, 'Informe ao menos um procedimento')
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

export type GuiaFormInput = z.input<typeof guiaSchema>
export type GuiaFormValues = z.infer<typeof guiaSchema>
