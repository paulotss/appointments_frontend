import { z } from 'zod'

const optionalEmail = z
  .union([z.string(), z.undefined()])
  .transform((str) => {
    if (str === undefined || str === null) return null
    const t = String(str).trim()
    return t === '' ? null : t
  })
  .refine((v) => v === null || z.string().email().safeParse(v).success, {
    message: 'E-mail invalido',
  })

export const pacienteSchema = z.object({
  name: z.string().min(3, 'Informe o nome'),
  phone: z.string().min(1, 'Informe o telefone'),
  email: optionalEmail,
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de nascimento'),
  cpf: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length === 11, { message: 'CPF deve ter 11 digitos' }),
})

export type PacienteFormInput = z.input<typeof pacienteSchema>
export type PacienteFormValues = z.infer<typeof pacienteSchema>
