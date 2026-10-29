export const TISS_VERSIONS = ['4.01.00', '4.02.00', '4.03.00'] as const
export type TissVersion = (typeof TISS_VERSIONS)[number]
export const DEFAULT_TISS_VERSION: TissVersion = '4.03.00'

export const TISS_GUIDE_TYPES = ['consulta', 'sp_sadt'] as const
export type TissGuideType = (typeof TISS_GUIDE_TYPES)[number]

export const TISS_GUIDE_TYPE_LABELS: Record<TissGuideType, string> = {
  consulta: 'Consulta',
  sp_sadt: 'SP/SADT',
}

/** Tabela 35 da ANS (dm_grauPart). */
export const TISS_PARTICIPATION_DEGREE_CODES = [
  '00',
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
  '13',
] as const

export type TissParticipationDegree = (typeof TISS_PARTICIPATION_DEGREE_CODES)[number]

export const TISS_PARTICIPATION_DEGREE_DEFAULT: TissParticipationDegree = '12'

export const TISS_PARTICIPATION_DEGREE_LABELS: Record<TissParticipationDegree, string> = {
  '00': 'Cirurgião',
  '01': 'Primeiro auxiliar',
  '02': 'Segundo auxiliar',
  '03': 'Terceiro auxiliar',
  '04': 'Quarto auxiliar',
  '05': 'Instrumentador',
  '06': 'Anestesista',
  '07': 'Auxiliar de anestesista',
  '08': 'Consultor',
  '09': 'Perfusionista',
  '10': 'Pediatra na sala de parto',
  '11': 'Auxiliar SADT',
  '12': 'Clínico',
  '13': 'Intensivista',
}

export function sugerirTipoGuiaTiss(tissCodes: string[]): TissGuideType {
  const codes = tissCodes.map((code) => code.trim()).filter(Boolean)
  if (codes.length > 0 && codes.every((code) => code.startsWith('1010'))) {
    return 'consulta'
  }
  return 'sp_sadt'
}
