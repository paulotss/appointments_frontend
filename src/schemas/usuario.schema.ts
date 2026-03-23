import { z } from 'zod'

export const usuarioSchema = z.object({
  name: z.string().min(3, 'Informe o nome'),
  usernameLogin: z.string().min(3, 'Informe o usuario de login'),
  passwordHash: z.string().min(6, 'A senha deve ter no minimo 6 caracteres'),
  isAdmin: z.boolean(),
})

export type UsuarioFormValues = z.infer<typeof usuarioSchema>
