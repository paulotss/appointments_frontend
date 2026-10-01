import { z } from 'zod'
import { BENEFIT_KINDS } from '../types/cartao'

const benefitSchema = z
  .object({
    title: z.string().trim().min(1, 'Informe o título').max(150),
    description: z.string().optional(),
    kind: z.enum(BENEFIT_KINDS),
    quantity: z.coerce.number().optional(),
    discountPercent: z.coerce.number().optional(),
    procedureIds: z.array(z.number().int().positive()).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.kind === 'quota') {
      if (value.quantity == null || !Number.isInteger(value.quantity) || value.quantity < 1) {
        ctx.addIssue({
          code: 'custom',
          message: 'Informe a quantidade da cota',
          path: ['quantity'],
        })
      }
      if (value.procedureIds.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Selecione ao menos um procedimento',
          path: ['procedureIds'],
        })
      }
    }
    if (value.kind === 'discount') {
      if (
        value.discountPercent == null ||
        Number.isNaN(value.discountPercent) ||
        value.discountPercent < 0 ||
        value.discountPercent > 100
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Informe um desconto entre 0 e 100',
          path: ['discountPercent'],
        })
      }
    }
  })

export const planoCartaoSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(150),
  annualPrice: z.coerce.number({ error: 'Informe o preço anual' }).positive('Informe o preço anual'),
  adhesionFee: z.coerce.number({ error: 'Informe a taxa de adesão' }).min(0, 'Taxa não pode ser negativa'),
  dependentFee: z.coerce
    .number({ error: 'Informe a taxa por dependente' })
    .min(0, 'Taxa não pode ser negativa'),
  isActive: z.boolean(),
  benefits: z.array(benefitSchema).min(1, 'Inclua ao menos um benefício'),
})

export type PlanoCartaoFormInput = z.input<typeof planoCartaoSchema>
export type PlanoCartaoFormValues = z.infer<typeof planoCartaoSchema>

export const adesaoCartaoSchema = z.object({
  planId: z.number({ error: 'Selecione o plano' }).int().positive('Selecione o plano'),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de início'),
  billingDay: z.coerce
    .number({ error: 'Informe o dia de vencimento' })
    .int('Informe um dia inteiro')
    .min(1, 'Dia entre 1 e 31')
    .max(31, 'Dia entre 1 e 31'),
  installmentCount: z.coerce
    .number({ error: 'Informe o número de parcelas' })
    .int('Informe um número inteiro')
    .min(1, 'No mínimo 1 parcela')
    .max(36, 'No máximo 36 parcelas'),
})

export type AdesaoCartaoFormInput = z.input<typeof adesaoCartaoSchema>
export type AdesaoCartaoFormValues = z.infer<typeof adesaoCartaoSchema>
