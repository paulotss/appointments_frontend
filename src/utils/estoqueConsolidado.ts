import { normalizarValorLote } from '../services/stock-batches.service'
import type { LoteEstoque, ProdutoEstoqueConsolidado } from '../types/estoque'

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function parseExpirationDate(value: string): Date {
  const datePart = value.includes('T') ? value.split('T')[0] : value.split(' ')[0]
  return startOfDay(new Date(`${datePart}T00:00:00`))
}

export function consolidarEstoquePorLotes(
  produto: ProdutoEstoqueConsolidado,
  lotes: LoteEstoque[],
): ProdutoEstoqueConsolidado {
  const today = startOfDay(new Date())
  const in30Days = addDays(today, 30)

  const batchesWithStock = lotes.filter((batch) => !batch.isClosed && batch.currentQuantity > 0)

  const totalQuantity = lotes.reduce((sum, batch) => sum + batch.currentQuantity, 0)

  const recentWithValue = lotes
    .filter((batch) => normalizarValorLote(batch.value) != null)
    .slice(0, 3)

  const averagePrice = recentWithValue.length
    ? recentWithValue.reduce((sum, batch) => sum + (normalizarValorLote(batch.value) ?? 0), 0) /
      recentWithValue.length
    : 0

  let expiringBatchesCount = 0
  let expiredBatchesCount = 0

  for (const batch of batchesWithStock) {
    if (!batch.expirationDate) {
      continue
    }

    const expirationDate = parseExpirationDate(batch.expirationDate)

    if (expirationDate < today) {
      expiredBatchesCount++
    } else if (expirationDate <= in30Days) {
      expiringBatchesCount++
    }
  }

  return {
    ...produto,
    totalQuantity,
    averagePrice,
    expiringBatchesCount,
    expiredBatchesCount,
    stockBatches: batchesWithStock,
  }
}

export function filtrarProdutoPorLocal(
  produto: ProdutoEstoqueConsolidado,
  localId: number,
): ProdutoEstoqueConsolidado {
  const lotesDoLocal = produto.stockBatches.filter((batch) => batch.locationId === localId)
  return consolidarEstoquePorLotes(produto, lotesDoLocal)
}
