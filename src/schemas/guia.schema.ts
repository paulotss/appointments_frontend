import { z } from 'zod'
import { INSURANCE_GUIDE_STATUSES } from '../types/guia'
import { hojeLocalISO } from '../utils/dataISO'

const procedimentoGuiaSchema = z.object({
  procedureId: z.number({ error: 'Selecione o procedimento' }).int().positive('Selecione o procedimento'),
  authorizedQuantity: z.coerce
    .number({ error: 'Informe a quantidade autorizada' })
    .int('Informe um número inteiro')
    .min(1, 'Quantidade autorizada deve ser no mínimo 1'),
  value: z.number({ error: 'Informe o valor' }).min(0, 'Informe o valor'),
  sessionDates: z.array(z.string()).optional(),
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
  authorizationPassword: z.string().trim().max(20, 'A senha deve ter no máximo 20 caracteres').optional(),
  authorizationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de autorização'),
  expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de validade'),
  registrarSessoes: z.boolean().optional(),
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
  if (!values.registrarSessoes) return
  const hoje = hojeLocalISO()
  values.procedures.forEach((item, index) => {
    const dates = item.sessionDates ?? []
    if (dates.length < 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe ao menos uma sessão',
        path: ['procedures', index, 'sessionDates'],
      })
      return
    }
    if (dates.length > item.authorizedQuantity) {
      ctx.addIssue({
        code: 'custom',
        message: 'A quantidade de sessões não pode passar da autorizada',
        path: ['procedures', index, 'sessionDates'],
      })
    }
    if (dates.some((date) => !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < values.authorizationDate || date > hoje)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Cada sessão deve estar entre a autorização e hoje',
        path: ['procedures', index, 'sessionDates'],
      })
    }
  })
})

export type GuiaFormInput = z.input<typeof guiaSchema>
export type GuiaFormValues = z.infer<typeof guiaSchema>
