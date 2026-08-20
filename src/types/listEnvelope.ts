export type ListMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type RecordStatusCounts = {
  pending: number
  registered: number
  cancelled: number
  total: number
}

export type AppointmentListCounts = {
  scheduledYes: number
  scheduledNo: number
  firstTimeYes: number
  firstTimeNo: number
  total: number
}

export type PagedList<T> = {
  data: T[]
  meta: ListMeta
}

export type ListEnvelope<T, C = RecordStatusCounts> = PagedList<T> & {
  counts: C
}
