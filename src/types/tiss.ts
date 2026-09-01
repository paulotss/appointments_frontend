export const TISS_VERSIONS = ['4.01.00', '4.02.00', '4.03.00'] as const
export type TissVersion = (typeof TISS_VERSIONS)[number]
export const DEFAULT_TISS_VERSION: TissVersion = '4.03.00'

export const TISS_GUIDE_TYPES = ['consulta', 'sp_sadt'] as const
export type TissGuideType = (typeof TISS_GUIDE_TYPES)[number]

export const TISS_GUIDE_TYPE_LABELS: Record<TissGuideType, string> = {
  consulta: 'Consulta',
  sp_sadt: 'SP/SADT',
}

export function sugerirTipoGuiaTiss(tissCodes: string[]): TissGuideType {
  const codes = tissCodes.map((code) => code.trim()).filter(Boolean)
  if (codes.length > 0 && codes.every((code) => code.startsWith('1010'))) {
    return 'consulta'
  }
  return 'sp_sadt'
}
