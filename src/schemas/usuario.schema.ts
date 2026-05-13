import { z } from 'zod'

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

export const usuarioSchema = z.object({
  name: z.string().min(3, 'Informe o nome'),
  usernameLogin: z.string().min(3, 'Informe o usuario de login'),
  passwordHash: z.string().min(6, 'A senha deve ter no minimo 6 caracteres'),
  isAdmin: z.boolean(),
  extension: optionalRamal,
})

export type UsuarioFormInput = z.input<typeof usuarioSchema>
export type UsuarioFormValues = z.infer<typeof usuarioSchema>
