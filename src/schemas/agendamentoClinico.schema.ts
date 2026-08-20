import { z } from 'zod'
import {
  CLINICAL_APPOINTMENT_STATUSES,
  CLINICAL_APPOINTMENT_TYPES,
} from '../types/agendamentoClinico'

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
  type: z.enum(CLINICAL_APPOINTMENT_TYPES),
  procedureIds: z.array(z.number().int().positive()).default([]),
  insuranceGuideIds: z.array(z.number().int().positive()).default([]),
})

export const agendamentoClinicoSchema = baseSchema.superRefine((values, ctx) => {
  if (values.type === 'private') {
    if (values.procedureIds.length < 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Selecione ao menos um procedimento',
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
  }
  if (values.type === 'health_plan') {
    if (values.insuranceGuideIds.length < 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Selecione ao menos uma guia',
        path: ['insuranceGuideIds'],
      })
    }
    if (new Set(values.insuranceGuideIds).size !== values.insuranceGuideIds.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'Guias duplicadas não são permitidas',
        path: ['insuranceGuideIds'],
      })
    }
  }
})

export type AgendamentoClinicoFormInput = z.input<typeof agendamentoClinicoSchema>
export type AgendamentoClinicoFormValues = z.infer<typeof agendamentoClinicoSchema>
