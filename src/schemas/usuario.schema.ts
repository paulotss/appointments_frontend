import { z } from 'zod'
import { USER_ROLES } from '../routes/access'

const optionalRamal = z
  .union([z.string(), z.undefined()])
  .transform((str) => {
    if (str === undefined || str === null) {
      return null
    }
    const t = String(str).trim()
    if (t === '') {
      return null
    }
    const n = Number(t)
    return Number.isFinite(n) ? n : Number.NaN
  })
  .refine((v) => v === null || (Number.isInteger(v) && v > 0), {
    message: 'Ramal deve ser um numero inteiro positivo ou ficar em branco',
  })

const optionalEmail = z
  .union([z.string(), z.undefined()])
  .transform((str) => {
    if (str === undefined || str === null) {
      return null
    }
    const t = String(str).trim()
    return t === '' ? null : t
  })
  .refine((v) => v === null || z.string().email().safeParse(v).success, {
    message: 'E-mail invalido',
  })

export const usuarioSchema = z
  .object({
    name: z.string().min(3, 'Informe o nome'),
    usernameLogin: z.string().min(3, 'Informe o usuario de login'),
    email: optionalEmail,
    passwordHash: z.string().min(6, 'A senha deve ter no minimo 6 caracteres'),
    role: z.enum(USER_ROLES),
    patientId: z.number().int().positive().nullable(),
    healthProfessionalId: z.number().int().positive().nullable(),
    extension: optionalRamal,
  })
  .superRefine((value, ctx) => {
    if (value.role === 'PATIENT' && value.patientId == null) {
      ctx.addIssue({ code: 'custom', path: ['patientId'], message: 'Selecione o paciente' })
    }
    if (value.role === 'PROFESSIONAL' && value.healthProfessionalId == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['healthProfessionalId'],
        message: 'Selecione o profissional',
      })
    }
  })

export type UsuarioFormInput = z.input<typeof usuarioSchema>
export type UsuarioFormValues = z.infer<typeof usuarioSchema>
