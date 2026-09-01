import { z } from 'zod'
import { UFS_BRASIL } from '../utils/ufBrasil'

const optionalText = z
  .union([z.string(), z.undefined()])
  .transform((str) => {
    if (str === undefined || str === null) return null
    const t = String(str).trim()
    return t === '' ? null : t
  })

const specialtyItemSchema = z.object({
  specialtyId: z.number({ error: 'Selecione uma especialidade' }).int().positive('Selecione uma especialidade'),
})

export const profissionalSchema = z.object({
  name: z.string().min(3, 'Informe o nome'),
  specialties: z
    .array(specialtyItemSchema)
    .min(1, 'Informe ao menos uma especialidade')
    .superRefine((items, ctx) => {
      const ids = items.map((item) => item.specialtyId)
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({
          code: 'custom',
          message: 'Especialidades duplicadas nao sao permitidas',
          path: [],
        })
      }
    }),
  councilType: z.enum(['CRM', 'CRO', 'CRP', 'COREN', 'OTHER'], {
    error: 'Selecione o tipo de conselho',
  }),
  councilNumber: z.string().min(1, 'Informe o numero do conselho'),
  councilUf: z.enum(UFS_BRASIL, { error: 'Selecione a UF do conselho' }),
  cbosCode: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length === 6, { message: 'CBO-S deve ter 6 dígitos' }),
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
