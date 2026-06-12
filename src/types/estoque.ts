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
  isActive?: boolean
}

export interface UpdateProductRequest {
  name?: string
  sku?: string
  categoryId?: number
  minimumStock?: number
  isActive?: boolean
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
