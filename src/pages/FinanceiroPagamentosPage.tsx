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
import { PagamentosTable } from '../components/PagamentosTable'
import { listarPagamentos } from '../services/payables.service'
import { listarFornecedores } from '../services/suppliers.service'
import type { Fornecedor } from '../types/estoque'
import {
  PAYABLE_STATUSES,
  PAYABLE_STATUS_LABELS,
  type Payable,
  type PayableStatus,
} from '../types/financeiro'
import type { ListMeta } from '../types/listEnvelope'
import { mensagemErroApi } from '../utils/apiError'

const PAGE_SIZE_OPTIONS = [25, 50, 100]
const META_VAZIA: ListMeta = { page: 1, limit: 50, total: 0, totalPages: 1 }

export function FinanceiroPagamentosPage() {
  const navigate = useNavigate()
  const [pagamentos, setPagamentos] = useState<Payable[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [meta, setMeta] = useState<ListMeta>(META_VAZIA)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [statusFiltro, setStatusFiltro] = useState<PayableStatus | ''>('')
  const [fornecedorFiltro, setFornecedorFiltro] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const resultado = await listarPagamentos({
        page: page + 1,
        limit: rowsPerPage,
        ...(statusFiltro ? { status: statusFiltro } : {}),
        ...(fornecedorFiltro === '' ? {} : { supplierId: fornecedorFiltro }),
      })
      setPagamentos(resultado.data)
      setMeta(resultado.meta)
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível carregar os pagamentos.'))
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, statusFiltro, fornecedorFiltro])

  useEffect(() => {
    void carregar()
  }, [carregar])

  useEffect(() => {
    setPage(0)
  }, [statusFiltro, fornecedorFiltro])

  useEffect(() => {
    async function carregarFornecedores() {
      try {
        setFornecedores(await listarFornecedores())
      } catch {
        /* filtro fica vazio */
      }
    }
    void carregarFornecedores()
  }, [])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Pagamentos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/financeiro/pagamentos/novo')}
        >
          Novo pagamento
        </Button>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          select
          label="Status"
          size="small"
          value={statusFiltro}
          onChange={(event) => setStatusFiltro(event.target.value as PayableStatus | '')}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {PAYABLE_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {PAYABLE_STATUS_LABELS[status]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Fornecedor"
          size="small"
          value={fornecedorFiltro}
          onChange={(event) =>
            setFornecedorFiltro(event.target.value === '' ? '' : Number(event.target.value))
          }
          sx={{ minWidth: 240 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {fornecedores.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.tradeName}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando pagamentos...</Typography>
        </Paper>
      ) : null}

      {!loading && !error && pagamentos.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum pagamento encontrado.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && pagamentos.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <PagamentosTable
            pagamentos={pagamentos}
            onEditar={(item) =>
              navigate(`/financeiro/pagamentos/${item.id}`, { state: { editar: true } })
            }
          />
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
