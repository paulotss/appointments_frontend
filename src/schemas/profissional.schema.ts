import { z } from 'zod'

const optionalText = z
  .union([z.string(), z.undefined()])
  .transform((str) => {
    if (str === undefined || str === null) return null
    const t = String(str).trim()
    return t === '' ? null : t
  })

export const profissionalSchema = z.object({
  name: z.string().min(3, 'Informe o nome'),
  specialtyId: z.number().int().positive('Selecione uma especialidade'),
  councilType: z.enum(['CRM', 'CRO', 'CRP', 'COREN', 'OTHER'], {
    required_error: 'Selecione o tipo de conselho',
  }),
  councilNumber: z.string().min(1, 'Informe o numero do conselho'),
  cpf: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length === 11, { message: 'CPF deve ter 11 digitos' }),
  phone: optionalText,
  email: optionalText.refine(
    (v) => v === null || z.string().email().safeParse(v).success,
    { message: 'E-mail invalido' },
  ),
  isActive: z.boolean(),
})

export type ProfissionalFormInput = z.input<typeof profissionalSchema>
export type ProfissionalFormValues = z.infer<typeof profissionalSchema>
