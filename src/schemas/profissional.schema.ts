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
})

export type ProfissionalFormInput = z.input<typeof profissionalSchema>
export type ProfissionalFormValues = z.infer<typeof profissionalSchema>
