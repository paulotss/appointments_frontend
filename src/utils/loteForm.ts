import type { CreateStockBatchRequest, UpdateStockBatchRequest } from '../types/estoque'
import type { LoteFormValues } from '../schemas/lote.schema'

export function toDataInputISO(value: string | null | undefined): string {
  if (!value) return ''
  return value.includes('T') ? value.split('T')[0] : value.split(' ')[0]
}

export function dataHojeISO(): string {
  return toDataInputISO(new Date().toISOString())
}

function limparOpcionais(values: LoteFormValues) {
  const currentQuantity =
    values.currentQuantity != null && !Number.isNaN(values.currentQuantity)
      ? values.currentQuantity
      : undefined
  const value =
    values.value != null && !Number.isNaN(values.value) ? values.value : undefined
  const expirationDate = values.expirationDate?.trim() || undefined
  const notes = values.notes?.trim() || undefined
  const invoiceAccessKey = values.invoiceAccessKey?.trim() || undefined

  return { currentQuantity, value, expirationDate, notes, invoiceAccessKey }
}

export function montarPayloadCriacao(values: LoteFormValues): CreateStockBatchRequest {
  const opcionais = limparOpcionais(values)

  return {
    productId: values.productId,
    sectorId: values.sectorId,
    initialQuantity: values.initialQuantity,
    movementDate: dataHojeISO(),
    userId: values.userId,
    locationId: values.locationId,
    ...opcionais,
    currentQuantity: opcionais.currentQuantity ?? values.initialQuantity,
  }
}

export function montarPayloadAtualizacao(values: LoteFormValues): UpdateStockBatchRequest {
  const opcionais = limparOpcionais(values)

  return {
    productId: values.productId,
    sectorId: values.sectorId,
    value: opcionais.value,
    expirationDate: opcionais.expirationDate,
    notes: opcionais.notes,
    invoiceAccessKey: opcionais.invoiceAccessKey,
    locationId: values.locationId,
  }
}
