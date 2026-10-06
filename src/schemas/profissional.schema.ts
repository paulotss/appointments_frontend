import { z } from 'zod'
import { intervalosSobrepostos, paraIntervalo } from '../utils/bloqueioHorario'
import { UFS_BRASIL } from '../utils/ufBrasil'

const optionalText = z
  .union([z.string(), z.undefined()])
  .transform((str) => {
    if (str === undefined || str === null) return null
    const t = String(str).trim()
    return t === '' ? null : t
  })

const specialtyItemSchema = z.object({
  specialtyId: z.number({ error: 'Selecione uma especialidade' }).int().positive('Selecione uma especialidade'),
})

const bloqueioSemanalItemSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Informe um horário válido'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$|^24:00$/, 'Informe um horário válido'),
  })
  .superRefine((item, ctx) => {
    if (!paraIntervalo(item)) {
      ctx.addIssue({
        code: 'custom',
        message: 'O horário final deve ser depois do início',
        path: ['endTime'],
      })
    }
  })

export const bloqueiosSemanaisSchema = z.array(bloqueioSemanalItemSchema).superRefine((items, ctx) => {
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    const doDia = items
      .filter((item) => item.weekday === weekday)
      .map((item) => paraIntervalo(item))
      .filter((item): item is NonNullable<typeof item> => item != null)
    if (intervalosSobrepostos(doDia)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Há períodos bloqueados sobrepostos no mesmo dia da semana',
        path: [],
      })
      return
    }
  }
})

export function mensagemBloqueiosSemanais(
  blocks: z.input<typeof bloqueiosSemanaisSchema>,
): string | null {
  const parsed = bloqueiosSemanaisSchema.safeParse(blocks)
  if (parsed.success) return null
  return parsed.error.issues[0]?.message ?? 'Horários bloqueados inválidos'
}

const janelaAtendimentoSchema = bloqueioSemanalItemSchema

export const regrasAtendimentoSchema = z
  .array(
    z
      .object({
        procedureId: z
          .number({ error: 'Selecione o procedimento' })
          .int()
          .positive('Selecione o procedimento'),
        maxConcurrentAppointments: z
          .number({ error: 'Informe as vagas' })
          .int()
          .min(1, 'Informe ao menos uma vaga'),
        durationMinutes: z
          .number({ error: 'Informe a duração' })
          .int()
          .min(1, 'A duração deve ser de ao menos 1 minuto'),
        slotIntervalMinutes: z
          .number({ error: 'Informe o intervalo' })
          .int()
          .min(1, 'O intervalo deve ser de ao menos 1 minuto'),
        allowOverbooking: z.boolean(),
        notes: z
          .string()
          .max(500, 'Observações devem ter no máximo 500 caracteres')
          .optional()
          .nullable(),
        windows: z
          .array(janelaAtendimentoSchema)
          .min(1, 'Informe ao menos um horário de atendimento'),
      })
      .superRefine((rule, ctx) => {
        for (let weekday = 0; weekday <= 6; weekday += 1) {
          const doDia = rule.windows
            .filter((item) => item.weekday === weekday)
            .map((item) => paraIntervalo(item))
            .filter((item): item is NonNullable<typeof item> => item != null)
          if (intervalosSobrepostos(doDia)) {
            ctx.addIssue({
              code: 'custom',
              message: 'Há horários sobrepostos para o mesmo procedimento',
              path: ['windows'],
            })
            return
          }
        }
        const cabe = rule.windows.some((item) => {
          const intervalo = paraIntervalo(item)
          return (
            intervalo != null &&
            intervalo.endMinute - intervalo.startMinute >= rule.durationMinutes
          )
        })
        if (!cabe) {
          ctx.addIssue({
            code: 'custom',
            message: 'A duração não cabe em nenhum horário de atendimento',
            path: ['durationMinutes'],
          })
        }
      }),
  )
  .superRefine((rules, ctx) => {
    const ids = rules.map((item) => item.procedureId).filter((id) => id > 0)
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'O mesmo procedimento não pode ter duas regras',
        path: [],
      })
    }
  })

export function mensagemRegrasAtendimento(rules: unknown): string | null {
  const parsed = regrasAtendimentoSchema.safeParse(rules)
  if (parsed.success) return null
  return parsed.error.issues[0]?.message ?? 'Regras de atendimento inválidas'
}

export const profissionalSchema = z.object({
  name: z.string().min(3, 'Informe o nome'),
  specialties: z
    .array(specialtyItemSchema)
    .min(1, 'Informe ao menos uma especialidade')
    .superRefine((items, ctx) => {
      const ids = items.map((item) => item.specialtyId)
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({
          code: 'custom',
          message: 'Especialidades duplicadas nao sao permitidas',
          path: [],
        })
      }
    }),
  councilType: z.enum(['CRM', 'CRO', 'CRP', 'COREN', 'OTHER'], {
    error: 'Selecione o tipo de conselho',
  }),
  councilNumber: z.string().min(1, 'Informe o numero do conselho'),
  councilUf: z.enum(UFS_BRASIL, { error: 'Selecione a UF do conselho' }),
  cbosCode: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length === 6, { message: 'CBO-S deve ter 6 dígitos' }),
  cpf: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length === 11, { message: 'CPF deve ter 11 digitos' }),
  phone: optionalText,
  email: optionalText.refine(
    (v) => v === null || z.string().email().safeParse(v).success,
    { message: 'E-mail invalido' },
  ),
  isActive: z.boolean(),
  weeklyBlocks: bloqueiosSemanaisSchema,
  scheduleRules: regrasAtendimentoSchema,
})

export type ProfissionalFormInput = z.input<typeof profissionalSchema>
export type ProfissionalFormValues = z.infer<typeof profissionalSchema>
