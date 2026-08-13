import { z } from 'zod'

export const guiaSchema = z.object({
  healthPlanId: z.number({ error: 'Selecione o plano de saude' }).int().positive('Selecione o plano de saude'),
  patientId: z.number({ error: 'Selecione o paciente' }).int().positive('Selecione o paciente'),
  healthProfessionalId: z
    .number({ error: 'Selecione o profissional' })
    .int()
    .positive('Selecione o profissional'),
  specialtyId: z.number({ error: 'Selecione a especialidade' }).int().positive('Selecione a especialidade'),
  quantity: z.coerce
    .number({ error: 'Informe a quantidade' })
    .int('Informe um numero inteiro')
    .min(1, 'Quantidade deve ser no minimo 1'),
  expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de validade'),
})

export type GuiaFormInput = z.input<typeof guiaSchema>
export type GuiaFormValues = z.infer<typeof guiaSchema>
