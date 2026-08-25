import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { FinanceiroSaidasTable } from '../components/FinanceiroSaidasTable'
import { listarSaidasFinanceiras } from '../services/financial-exits.service'
import type { FinancialExit, FinancialExitListCounts } from '../types/financeiro'
import type { ListMeta } from '../types/listEnvelope'
import { mensagemErroApi } from '../utils/apiError'
import { hojeLocalISO, primeiroDiaDoMesLocalISO } from '../utils/dataISO'
import { formatarMoedaBRL } from '../utils/moedaBRL'

const PAGE_SIZE_OPTIONS = [25, 50, 100]
const META_VAZIA: ListMeta = { page: 1, limit: 50, total: 0, totalPages: 1 }
const COUNTS_VAZIOS: FinancialExitListCounts = { amount: 0 }

function normalizarPeriodo(dataInicio: string, dataFim: string) {
  return {
    from: dataInicio <= dataFim ? dataInicio : dataFim,
    to: dataFim >= dataInicio ? dataFim : dataInicio,
  }
}

export function FinanceiroSaidasPage() {
  const [saidas, setSaidas] = useState<FinancialExit[]>([])
  const [meta, setMeta] = useState<ListMeta>(META_VAZIA)
  const [counts, setCounts] = useState<FinancialExitListCounts>(COUNTS_VAZIOS)
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
      const resultado = await listarSaidasFinanceiras({
        from,
        to,
        page: page + 1,
        limit: rowsPerPage,
      })
      setSaidas(resultado.data)
      setMeta(resultado.meta)
      setCounts(resultado.counts)
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível carregar as saídas.'))
      setSaidas([])
      setMeta(META_VAZIA)
      setCounts(COUNTS_VAZIOS)
    } finally {
      setLoading(false)
    }
  }, [dataInicio, dataFim, page, rowsPerPage])

  useEffect(() => {
    void carregar()
  }, [carregar])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Saídas
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
        <TextField
          label="Data início"
          type="date"
          size="small"
          value={dataInicio}
          onChange={(event) => {
            setDataInicio(event.target.value)
            setPage(0)
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 220 } }}
        />
        <TextField
          label="Data fim"
          type="date"
          size="small"
          value={dataFim}
          onChange={(event) => {
            setDataFim(event.target.value)
            setPage(0)
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 220 } }}
        />
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando saídas...</Typography>
        </Paper>
      ) : null}

      {!loading && !error ? (
        <>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={`Valor total: ${formatarMoedaBRL(counts.amount)}`}
              size="small"
              sx={{ bgcolor: '#000', color: '#fff' }}
            />
          </Stack>

          {saidas.length === 0 ? (
            <Paper sx={{ p: 3 }}>
              <Typography>Nenhuma saída encontrada no período.</Typography>
            </Paper>
          ) : (
            <Paper sx={{ p: 0 }}>
              <FinanceiroSaidasTable saidas={saidas} />
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
          )}
        </>
      ) : null}
    </Stack>
  )
}
