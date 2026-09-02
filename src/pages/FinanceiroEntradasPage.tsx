import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TablePagination,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { FinanceiroEntradasTable } from '../components/FinanceiroEntradasTable'
import { CampoData } from '../components/CampoData'
import { listarEntradasFinanceiras } from '../services/financial-entries.service'
import type {
  FiltroStatusEntrada,
  FinancialEntry,
  FinancialEntryListCounts,
} from '../types/financeiro'
import { FINANCIAL_ENTRY_STATUS_LABELS } from '../types/financeiro'
import type { ListMeta } from '../types/listEnvelope'
import { mensagemErroApi } from '../utils/apiError'
import { hojeLocalISO, primeiroDiaDoMesLocalISO } from '../utils/dataISO'
import { formatarMoedaBRL } from '../utils/moedaBRL'

const PAGE_SIZE_OPTIONS = [25, 50, 100]
const META_VAZIA: ListMeta = { page: 1, limit: 50, total: 0, totalPages: 1 }
const COUNTS_VAZIOS: FinancialEntryListCounts = { amount: 0, receivedAmount: 0 }

function normalizarPeriodo(dataInicio: string, dataFim: string) {
  return {
    from: dataInicio <= dataFim ? dataInicio : dataFim,
    to: dataFim >= dataInicio ? dataFim : dataInicio,
  }
}

export function FinanceiroEntradasPage() {
  const [entradas, setEntradas] = useState<FinancialEntry[]>([])
  const [meta, setMeta] = useState<ListMeta>(META_VAZIA)
  const [counts, setCounts] = useState<FinancialEntryListCounts>(COUNTS_VAZIOS)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [dataInicio, setDataInicio] = useState(primeiroDiaDoMesLocalISO())
  const [dataFim, setDataFim] = useState(hojeLocalISO())
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatusEntrada>('all')
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
        ...(filtroStatus !== 'all' ? { status: filtroStatus } : {}),
        page: page + 1,
        limit: rowsPerPage,
      })
      setEntradas(resultado.data)
      setMeta(resultado.meta)
      setCounts(resultado.counts)
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível carregar as entradas.'))
      setEntradas([])
      setMeta(META_VAZIA)
      setCounts(COUNTS_VAZIOS)
    } finally {
      setLoading(false)
    }
  }, [dataInicio, dataFim, filtroStatus, page, rowsPerPage])

  useEffect(() => {
    void carregar()
  }, [carregar])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Entradas
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
        <CampoData
          label="Data início"
          size="small"
          value={dataInicio}
          onChange={(next) => {
            setDataInicio(next)
            setPage(0)
          }}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 220 } }}
        />
        <CampoData
          label="Data fim"
          size="small"
          value={dataFim}
          onChange={(next) => {
            setDataFim(next)
            setPage(0)
          }}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 220 } }}
        />
        <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 200 } }}>
          <InputLabel id="filtro-status-entrada-label">Status</InputLabel>
          <Select
            labelId="filtro-status-entrada-label"
            label="Status"
            value={filtroStatus}
            onChange={(event) => {
              setFiltroStatus(event.target.value as FiltroStatusEntrada)
              setPage(0)
            }}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="pending">{FINANCIAL_ENTRY_STATUS_LABELS.pending}</MenuItem>
            <MenuItem value="paid">{FINANCIAL_ENTRY_STATUS_LABELS.paid}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando entradas...</Typography>
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
            <Chip
              label={`Valor total recebido: ${formatarMoedaBRL(counts.receivedAmount)}`}
              size="small"
              sx={{ bgcolor: '#2e7d32', color: '#fff' }}
            />
          </Stack>

          {entradas.length === 0 ? (
            <Paper sx={{ p: 3 }}>
              <Typography>Nenhuma entrada encontrada no período.</Typography>
            </Paper>
          ) : (
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
          )}
        </>
      ) : null}
    </Stack>
  )
}
