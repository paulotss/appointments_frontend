export interface Categoria {
  id: number
  nome: string
}

export interface CreateCategoryRequest {
  name: string
}

export interface UpdateCategoryRequest {
  name?: string
}

export interface ProdutoConfig {
  id: number
  nome: string
  sku: string
  categoryId: number
  minimumStock: number
  isActive: boolean
}

export interface CreateProductRequest {
  name: string
  sku: string
  categoryId: number
  minimumStock: number
}

export interface UpdateProductRequest {
  name?: string
  sku?: string
  categoryId?: number
  minimumStock?: number
}

export interface Setor {
  id: number
  nome: string
  isActive: boolean
}

export interface CreateSectorRequest {
  name: string
  isActive?: boolean
}

export interface UpdateSectorRequest {
  name?: string
  isActive?: boolean
}

export interface LocalArmazenamento {
  id: number
  nome: string
}

export interface CreateStorageLocationRequest {
  name: string
}

export interface UpdateStorageLocationRequest {
  name?: string
}

export interface LoteEstoqueSetor {
  id: number
  name: string
  isActive: boolean
  registeredAt: string
}

export interface LoteEstoqueLocal {
  id: number
  name: string
}

export interface LoteEstoqueProduto {
  id: number
  name: string
}

export interface LoteEstoqueUsuario {
  id: number
  name: string
}

export interface LoteEstoque {
  id: number
  productId: number
  sectorId: number
  initialQuantity: number
  currentQuantity: number
  value: number | string | null
  movementDate: string
  expirationDate: string | null
  notes: string | null
  userId: number
  invoiceAccessKey: string | number | null
  locationId: number
  sector: LoteEstoqueSetor
  location: LoteEstoqueLocal
  product?: LoteEstoqueProduto
  user?: LoteEstoqueUsuario
}

export interface CreateStockBatchRequest {
  productId: number
  sectorId: number
  initialQuantity: number
  movementDate: string
  userId: number
  locationId: number
  currentQuantity?: number
  value?: number
  expirationDate?: string
  notes?: string
  invoiceAccessKey?: string
}

export interface UpdateStockBatchRequest {
  productId?: number
  sectorId?: number
  initialQuantity?: number
  currentQuantity?: number
  value?: number
  movementDate?: string
  expirationDate?: string
  notes?: string
  userId?: number
  invoiceAccessKey?: string
  locationId?: number
}

export interface ProdutoEstoqueConsolidado {
  name: string
  sku: string
  totalQuantity: number
  averagePrice: number
  expiringBatchesCount: number
  expiredBatchesCount: number
  minimumStock: number
  stockBatches: LoteEstoque[]
}

export interface SaidaEstoqueBatchProduto {
  id: number
  name: string
}

export interface SaidaEstoqueBatch {
  id: number
  productId: number
  locationId: number
  product?: SaidaEstoqueBatchProduto
}

export interface SaidaEstoqueUsuario {
  id: number
  name: string
}

export interface SaidaEstoque {
  id: number
  batchId: number
  quantity: number
  userId: number
  exitDate: string
  batch: SaidaEstoqueBatch
  user: SaidaEstoqueUsuario
}

export interface CreateStockExitRequest {
  batchId: number
  quantity: number
  userId: number
  exitDate: string
}
