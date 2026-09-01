import { z } from 'zod'

const optionalText = z
  .union([z.string(), z.undefined()])
  .transform((str) => {
    if (str === undefined || str === null) return null
    const t = String(str).trim()
    return t === '' ? null : t
  })

const optionalEmail = optionalText.refine((v) => v === null || z.string().email().safeParse(v).success, {
  message: 'E-mail invalido',
})

const carteirinhaSchema = z.object({
  cardId: z.number().int().positive().optional(),
  healthPlanId: z.number({ error: 'Selecione o plano de saúde' }).int().positive('Selecione o plano de saúde'),
  cardNumber: z.string().trim().min(1, 'Informe o número da carteirinha'),
  expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a validade da carteirinha'),
})

export const pacienteSchema = z.object({
  name: z.string().min(3, 'Informe o nome'),
  phone: z.string().min(1, 'Informe o telefone'),
  email: optionalEmail,
  birthDate: optionalText.refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), {
    message: 'Informe a data de nascimento',
  }),
  cpf: z
    .union([z.string(), z.undefined()])
    .transform((v) => {
      if (v === undefined || v === null) return null
      const digits = String(v).replace(/\D/g, '')
      return digits === '' ? null : digits
    })
    .refine((v) => v === null || v.length === 11, { message: 'CPF deve ter 11 digitos' }),
  insuranceCards: z
    .array(carteirinhaSchema)
    .superRefine((items, ctx) => {
      const ids = items.map((item) => item.healthPlanId)
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({
          code: 'custom',
          message: 'Já existe uma carteirinha para este plano',
          path: [],
        })
      }
    }),
})

export type PacienteFormInput = z.input<typeof pacienteSchema>
export type PacienteFormValues = z.infer<typeof pacienteSchema>
