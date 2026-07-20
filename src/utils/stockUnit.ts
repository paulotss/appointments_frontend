import type { StockUnit } from '../types/estoque'

export function podeUsarCaixa(unitsPerPackage: number | undefined | null): boolean {
  return (unitsPerPackage ?? 1) > 1
}

export function paraUnidadesBase(
  quantity: number,
  unit: StockUnit,
  unitsPerPackage: number,
): number {
  if (unit === 'BOX') {
    return quantity * unitsPerPackage
  }
  return quantity
}

export function labelUnidade(unit: StockUnit): string {
  return unit === 'BOX' ? 'caixa' : 'unidade'
}

export function labelUnidadePlural(unit: StockUnit): string {
  return unit === 'BOX' ? 'caixas' : 'unidades'
}

export function labelBaseUnit(baseUnit: StockUnit | undefined | null): string {
  return baseUnit === 'BOX' ? 'Caixa' : 'Unidade'
}
