import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { FinanceiroEntradasTable } from '../components/FinanceiroEntradasTable'
import { listarEntradasFinanceiras } from '../services/financial-entries.service'
import type { FinancialEntry } from '../types/financeiro'
import type { ListMeta } from '../types/listEnvelope'
import { mensagemErroApi } from '../utils/apiError'
import { hojeLocalISO, primeiroDiaDoMesLocalISO } from '../utils/dataISO'

const PAGE_SIZE_OPTIONS = [25, 50, 100]
const META_VAZIA: ListMeta = { page: 1, limit: 50, total: 0, totalPages: 1 }

function normalizarPeriodo(dataInicio: string, dataFim: string) {
  return {
    from: dataInicio <= dataFim ? dataInicio : dataFim,
    to: dataFim >= dataInicio ? dataFim : dataInicio,
  }
}

export function FinanceiroEntradasPage() {
  const [entradas, setEntradas] = useState<FinancialEntry[]>([])
  const [meta, setMeta] = useState<ListMeta>(META_VAZIA)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [dataInicio, setDataInicio] = useState(primeiroDiaDoMesLocalISO())
  const [dataFim, setDataFim] = useState(hojeLocalISO())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { from, to } = normalizarPeriodo(dataInicio, dataFim)
    try {
      const resultado = await listarEntradasFinanceiras({
        from,
        to,
        page: page + 1,
        limit: rowsPerPage,
      })
      setEntradas(resultado.data)
      setMeta(resultado.meta)
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível carregar as entradas.'))
    } finally {
      setLoading(false)
    }
  }, [dataInicio, dataFim, page, rowsPerPage])

  useEffect(() => {
    void carregar()
  }, [carregar])

  useEffect(() => {
    setPage(0)
  }, [dataInicio, dataFim])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Entradas
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          label="Data início"
          type="date"
          size="small"
          value={dataInicio}
          onChange={(event) => setDataInicio(event.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Data fim"
          type="date"
          size="small"
          value={dataFim}
          onChange={(event) => setDataFim(event.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Stack>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando entradas...</Typography>
        </Paper>
      ) : null}

      {!loading && !error && entradas.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhuma entrada encontrada no período.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && entradas.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <FinanceiroEntradasTable entradas={entradas} />
          <TablePagination
            component="div"
            count={meta.total}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value))
              setPage(0)
            }}
            rowsPerPageOptions={PAGE_SIZE_OPTIONS}
            labelRowsPerPage="Linhas por página"
          />
        </Paper>
      ) : null}
    </Stack>
  )
}
