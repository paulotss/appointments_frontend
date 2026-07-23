import { z } from 'zod'

export const fornecedorSchema = z.object({
  legalName: z.string().min(2, 'Informe a razão social'),
  tradeName: z.string().min(2, 'Informe o nome fantasia'),
  cnpj: z
    .string()
    .min(1, 'Informe o CNPJ')
    .refine((value) => value.replace(/\D/g, '').length === 14, {
      message: 'O CNPJ deve ter 14 digitos',
    }),
  phone: z.string().min(8, 'Informe o telefone'),
  email: z.string().email('Informe um e-mail valido'),
  website: z
    .string()
    .optional()
    .refine((value) => !value || /^https?:\/\//i.test(value) || value.length === 0, {
      message: 'Informe uma URL valida (http:// ou https://)',
    }),
})

export type FornecedorFormValues = z.infer<typeof fornecedorSchema>
