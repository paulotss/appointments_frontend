import { z } from 'zod'
import { INSURANCE_GUIDE_STATUSES } from '../types/guia'

const procedimentoGuiaSchema = z.object({
  procedureId: z.number({ error: 'Selecione o procedimento' }).int().positive('Selecione o procedimento'),
  authorizedQuantity: z.coerce
    .number({ error: 'Informe a quantidade autorizada' })
    .int('Informe um número inteiro')
    .min(1, 'Quantidade autorizada deve ser no mínimo 1'),
  value: z.number({ error: 'Informe o valor' }).min(0, 'Informe o valor'),
  usedQuantity: z.number().int().optional(),
})

export const guiaSchema = z.object({
  healthPlanId: z.number({ error: 'Selecione o plano de saúde' }).int().positive('Selecione o plano de saúde'),
  patientId: z.number({ error: 'Selecione o paciente' }).int().positive('Selecione o paciente'),
  healthProfessionalId: z
    .number({ error: 'Selecione o profissional' })
    .int()
    .positive('Selecione o profissional'),
  status: z.enum(INSURANCE_GUIDE_STATUSES),
  guideNumber: z
    .string()
    .trim()
    .min(1, 'Informe o número da guia'),
  authorizationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de autorização'),
  expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de validade'),
  usarQuantidade: z.boolean().optional(),
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
}).superRefine((values, ctx) => {
  if (!values.usarQuantidade) return
  values.procedures.forEach((item, index) => {
    const used = item.usedQuantity
    if (used == null || !Number.isInteger(used) || used < 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe a quantidade utilizada',
        path: ['procedures', index, 'usedQuantity'],
      })
      return
    }
    if (used > item.authorizedQuantity) {
      ctx.addIssue({
        code: 'custom',
        message: 'A quantidade utilizada não pode passar da autorizada',
        path: ['procedures', index, 'usedQuantity'],
      })
    }
  })
})

export type GuiaFormInput = z.input<typeof guiaSchema>
export type GuiaFormValues = z.infer<typeof guiaSchema>
