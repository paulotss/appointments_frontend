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

  const totalQuantity = batchesWithStock.reduce((sum, batch) => sum + batch.currentQuantity, 0)

  let residualValueSum = 0
  let hasResidualValue = false

  for (const batch of batchesWithStock) {
    const unitCost = normalizarValorLote(batch.unitCost)
    if (unitCost == null) continue
    residualValueSum += batch.currentQuantity * unitCost
    hasResidualValue = true
  }

  const totalValue = hasResidualValue ? residualValueSum : null
  const averagePrice =
    hasResidualValue && totalQuantity > 0 ? residualValueSum / totalQuantity : null

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
    totalValue,
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
