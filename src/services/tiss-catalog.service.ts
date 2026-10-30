import { apiClient } from './apiClient'

export interface TissCbos {
  code: string
  name: string
}

let catalogoCbos: Promise<TissCbos[]> | null = null

export function listarCbos(q = ''): Promise<TissCbos[]> {
  const term = q.trim()
  if (!term) {
    catalogoCbos ??= apiClient
      .get<TissCbos[]>('/tiss-catalog/cbos')
      .then((response) => response.data)
      .catch((error: unknown) => {
        catalogoCbos = null
        throw error
      })
    return catalogoCbos
  }
  return apiClient
    .get<TissCbos[]>('/tiss-catalog/cbos', { params: { q: term } })
    .then((response) => response.data)
}

export function rotuloCbos(item: { code: string; name?: string | null }): string {
  return item.name ? `${item.code} - ${item.name}` : item.code
}
