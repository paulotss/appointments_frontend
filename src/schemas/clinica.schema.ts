import { z } from 'zod'

function digits(value: string): string {
  return value.replace(/\D/g, '')
}

export const clinicaSchema = z.object({
  legalName: z.string().trim().min(2, 'Informe a razão social'),
  cnpj: z
    .string()
    .transform(digits)
    .refine((value) => value.length === 14, { message: 'O CNPJ deve ter 14 dígitos' }),
  cnes: z
    .string()
    .transform(digits)
    .refine((value) => value.length === 7, { message: 'O CNES deve ter 7 dígitos' }),
})

export type ClinicaFormInput = z.input<typeof clinicaSchema>
export type ClinicaFormValues = z.infer<typeof clinicaSchema>
