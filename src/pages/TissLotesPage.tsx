import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TissLotesTable } from '../components/TissLotesTable'
import { listarLotesTiss } from '../services/billing-batches.service'
import { listarPlanosSaude } from '../services/health-plans.service'
import type { BillingBatch, BillingBatchStatus } from '../types/financeiro'
import { BILLING_BATCH_STATUSES, BILLING_BATCH_STATUS_LABELS } from '../types/financeiro'
import type { ListMeta } from '../types/listEnvelope'
import type { HealthPlan } from '../types/planoSaude'
import { mensagemErroApi } from '../utils/apiError'

const PAGE_SIZE_OPTIONS = [25, 50, 100]
const META_VAZIA: ListMeta = { page: 1, limit: 50, total: 0, totalPages: 1 }

export function TissLotesPage() {
  const navigate = useNavigate()
  const [lotes, setLotes] = useState<BillingBatch[]>([])
  const [planos, setPlanos] = useState<HealthPlan[]>([])
  const [meta, setMeta] = useState<ListMeta>(META_VAZIA)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [planoFiltro, setPlanoFiltro] = useState<number | ''>('')
  const [statusFiltro, setStatusFiltro] = useState<BillingBatchStatus | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const resultado = await listarLotesTiss({
        page: page + 1,
        limit: rowsPerPage,
        ...(planoFiltro === '' ? {} : { healthPlanId: planoFiltro }),
        ...(statusFiltro ? { status: statusFiltro } : {}),
      })
      setLotes(resultado.data)
      setMeta(resultado.meta)
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível carregar os lotes.'))
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, planoFiltro, statusFiltro])

  useEffect(() => {
    void carregar()
  }, [carregar])

  useEffect(() => {
    setPage(0)
  }, [planoFiltro, statusFiltro])

  useEffect(() => {
    async function carregarPlanos() {
      try {
        setPlanos(await listarPlanosSaude())
      } catch {
        /* filtro fica vazio */
      }
    }
    void carregarPlanos()
  }, [])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Lotes
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/tiss/lotes/novo')}>
          Novo lote
        </Button>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          select
          label="Plano de saúde"
          size="small"
          value={planoFiltro}
          onChange={(event) => setPlanoFiltro(event.target.value === '' ? '' : Number(event.target.value))}
          sx={{ minWidth: 240 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {planos.map((plano) => (
            <MenuItem key={plano.id} value={plano.id}>
              {plano.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Status"
          size="small"
          value={statusFiltro}
          onChange={(event) => setStatusFiltro(event.target.value as BillingBatchStatus | '')}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {BILLING_BATCH_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {BILLING_BATCH_STATUS_LABELS[status]}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando lotes...</Typography>
        </Paper>
      ) : null}

      {!loading && !error && lotes.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum lote encontrado.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && lotes.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <TissLotesTable lotes={lotes} />
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
