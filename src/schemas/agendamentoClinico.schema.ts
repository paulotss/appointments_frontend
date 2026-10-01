import { z } from 'zod'
import { CLINICAL_APPOINTMENT_STATUSES } from '../types/agendamentoClinico'

const baseSchema = z.object({
  patientId: z.number({ error: 'Selecione o paciente' }).int().positive('Selecione o paciente'),
  healthProfessionalId: z
    .number({ error: 'Selecione o profissional' })
    .int()
    .positive('Selecione o profissional'),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data'),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, 'Informe o horário'),
  durationMinutes: z.coerce
    .number({ error: 'Informe a duração' })
    .int('Informe um número inteiro')
    .min(1, 'Duração deve ser no mínimo 1 minuto'),
  status: z.enum(CLINICAL_APPOINTMENT_STATUSES),
  procedureIds: z.array(z.number().int().positive()).default([]),
  patientPackageItemIds: z.array(z.number().int().positive()).default([]),
  benefitUses: z
    .array(
      z.object({
        entitlementId: z.number().int().positive(),
        procedureId: z.number().int().positive(),
      }),
    )
    .default([]),
  insuranceGuideIds: z.array(z.number().int().positive()).default([]),
  notes: z.string().optional(),
})

export const agendamentoClinicoSchema = baseSchema.superRefine((values, ctx) => {
  if (
    values.procedureIds.length === 0 &&
    values.patientPackageItemIds.length === 0 &&
    values.benefitUses.length === 0 &&
    values.insuranceGuideIds.length === 0
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'Selecione ao menos um procedimento avulso, de pacote, do cartão ou uma guia',
      path: ['procedureIds'],
    })
  }
  if (new Set(values.procedureIds).size !== values.procedureIds.length) {
    ctx.addIssue({
      code: 'custom',
      message: 'Procedimentos duplicados não são permitidos',
      path: ['procedureIds'],
    })
  }
  if (new Set(values.patientPackageItemIds).size !== values.patientPackageItemIds.length) {
    ctx.addIssue({
      code: 'custom',
      message: 'Itens de pacote duplicados não são permitidos',
      path: ['patientPackageItemIds'],
    })
  }
  if (new Set(values.benefitUses.map((item) => `${item.entitlementId}:${item.procedureId}`)).size !== values.benefitUses.length) {
    ctx.addIssue({
      code: 'custom',
      message: 'Cotas duplicadas não são permitidas',
      path: ['benefitUses'],
    })
  }
  if (new Set(values.insuranceGuideIds).size !== values.insuranceGuideIds.length) {
    ctx.addIssue({
      code: 'custom',
      message: 'Guias duplicadas não são permitidas',
      path: ['insuranceGuideIds'],
    })
  }
})

export type AgendamentoClinicoFormInput = z.input<typeof agendamentoClinicoSchema>
export type AgendamentoClinicoFormValues = z.infer<typeof agendamentoClinicoSchema>
