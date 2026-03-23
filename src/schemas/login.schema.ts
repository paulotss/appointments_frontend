import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(3, 'Informe o nome de usuario'),
  password: z.string().min(6, 'A senha precisa ter no minimo 6 caracteres'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
