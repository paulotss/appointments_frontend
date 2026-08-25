import { z } from 'zod'
import { PAYABLE_KINDS, PAYMENT_METHODS } from '../types/financeiro'

export const pagamentoSchema = z.object({
  supplierId: z.number({ error: 'Selecione o fornecedor' }).int().positive('Selecione o fornecedor'),
  kind: z.enum(PAYABLE_KINDS, { error: 'Selecione o tipo' }),
  description: z.string().trim().min(1, 'Informe a descrição').max(255, 'Descrição muito longa'),
  amount: z.number({ error: 'Informe o valor' }).positive('Informe o valor'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de vencimento'),
  invoiceNumber: z.string().max(60, 'Número da nota muito longo').optional(),
  notes: z.string().optional(),
})

export type PagamentoFormInput = z.input<typeof pagamentoSchema>
export type PagamentoFormValues = z.infer<typeof pagamentoSchema>

export const faturarPagamentoSchema = z.object({
  paymentMethod: z.enum(PAYMENT_METHODS, { error: 'Selecione a forma de pagamento' }),
  paidAt: z.string().optional(),
})

export type FaturarPagamentoFormValues = z.infer<typeof faturarPagamentoSchema>

export const entradaParticularSchema = z.object({
  paymentMethod: z.enum(PAYMENT_METHODS, { error: 'Selecione a forma de pagamento' }),
  paidAt: z.string().optional(),
  discountAmount: z.number().min(0, 'Desconto não pode ser negativo').optional(),
  surchargeAmount: z.number().min(0, 'Acréscimo não pode ser negativo').optional(),
  notes: z.string().optional(),
})

export const receberLoteItemSchema = z
  .object({
    insuranceGuideId: z.number().int().positive(),
    billedAmount: z.number(),
    receivedAmount: z
      .number({ error: 'Informe o valor recebido' })
      .min(0, 'Valor recebido não pode ser negativo'),
    glosaReason: z.string().optional(),
  })
  .superRefine((item, ctx) => {
    if (item.receivedAmount < item.billedAmount && !item.glosaReason?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe o motivo da glosa',
        path: ['glosaReason'],
      })
    }
  })

export const receberLoteSchema = z.object({
  paymentMethod: z.enum(PAYMENT_METHODS, { error: 'Selecione a forma de pagamento' }),
  paidAt: z.string().optional(),
  items: z.array(receberLoteItemSchema).min(1, 'O lote não possui guias'),
})

export type ReceberLoteFormInput = z.input<typeof receberLoteSchema>
export type ReceberLoteFormValues = z.infer<typeof receberLoteSchema>

export type EntradaParticularFormInput = z.input<typeof entradaParticularSchema>
export type EntradaParticularFormValues = z.infer<typeof entradaParticularSchema>
