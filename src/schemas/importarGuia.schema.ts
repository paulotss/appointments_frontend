import { z } from 'zod'

const procedimentoImportadoSchema = z.object({
  procedureId: z.number({ error: 'Selecione o procedimento' }).int().positive('Selecione o procedimento'),
  authorizedQuantity: z
    .number({ error: 'Informe a quantidade autorizada' })
    .int('Informe um número inteiro')
    .min(1, 'Quantidade autorizada deve ser no mínimo 1'),
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
    authorizationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de autorização'),
    expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de validade'),
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
        message: 'Informe o número da carteirinha',
        path: ['cardNumber'],
      })
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.cardExpirationDate)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe a validade da carteirinha',
        path: ['cardExpirationDate'],
      })
    }
  })

export type ImportarGuiaFormInput = z.input<typeof importarGuiaSchema>
export type ImportarGuiaFormValues = z.infer<typeof importarGuiaSchema>
