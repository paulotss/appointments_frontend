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

export type ListEnvelope<T, C = RecordStatusCounts> = {
  data: T[]
  meta: ListMeta
  counts: C
}
