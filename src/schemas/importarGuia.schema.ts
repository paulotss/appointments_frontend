import { z } from 'zod'
import { hojeLocalISO } from '../utils/dataISO'

const procedimentoImportadoSchema = z.object({
  procedureId: z.number({ error: 'Selecione o procedimento' }).int().positive('Selecione o procedimento'),
  authorizedQuantity: z
    .number({ error: 'Informe a quantidade autorizada' })
    .int('Informe um número inteiro')
    .min(1, 'Quantidade autorizada deve ser no mínimo 1'),
  sessionDates: z.array(z.string()).optional(),
})

export const importarGuiaSchema = z
  .object({
    healthPlanId: z.number({ error: 'Selecione o plano de saúde' }).int().positive('Selecione o plano de saúde'),
    healthProfessionalId: z
      .number({ error: 'Selecione o profissional' })
      .int()
      .positive('Selecione o profissional'),
    procedures: z.array(procedimentoImportadoSchema).min(1, 'Informe ao menos um procedimento'),
    patientMode: z.enum(['existing', 'create']),
    patientId: z.number().int().positive().optional().nullable(),
    patientName: z.string(),
    phone: z.string(),
    email: z.string().optional(),
    birthDate: z.string().optional(),
    cpf: z.string().optional(),
    cardNumber: z.string(),
    cardExpirationDate: z.string(),
    guideNumber: z.string().trim().min(1, 'Informe o número da guia'),
    authorizationPassword: z.string().trim().max(20, 'A senha deve ter no máximo 20 caracteres').optional(),
    authorizationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de autorização'),
    expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de validade'),
    registrarSessoes: z.boolean().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.patientMode === 'existing' && (values.patientId == null || values.patientId < 1)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Selecione o paciente',
        path: ['patientId'],
      })
    }
    if (values.patientMode === 'create') {
      if (values.patientName.trim().length < 3) {
        ctx.addIssue({
          code: 'custom',
          message: 'Informe o nome',
          path: ['patientName'],
        })
      }
      if (!values.phone.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Informe o telefone',
          path: ['phone'],
        })
      }
    }
    if (!values.cardNumber.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe o número do cartão',
        path: ['cardNumber'],
      })
    }
    const validadeCartao = values.cardExpirationDate.trim()
    if (validadeCartao && !/^\d{4}-\d{2}-\d{2}$/.test(validadeCartao)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe uma validade válida',
        path: ['cardExpirationDate'],
      })
    }
    if (values.registrarSessoes) {
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
        if (
          dates.some(
            (date) => !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < values.authorizationDate || date > hoje,
          )
        ) {
          ctx.addIssue({
            code: 'custom',
            message: 'Cada sessão deve estar entre a autorização e hoje',
            path: ['procedures', index, 'sessionDates'],
          })
        }
      })
    }
  })

export type ImportarGuiaFormInput = z.input<typeof importarGuiaSchema>
export type ImportarGuiaFormValues = z.infer<typeof importarGuiaSchema>
