import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Autocomplete,
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
import { CampoData } from '../components/CampoData'
import { listarPagamentos } from '../services/payables.service'
import { listarFornecedores } from '../services/suppliers.service'
import type { Fornecedor } from '../types/estoque'
import {
  PAYABLE_STATUSES,
  PAYABLE_STATUS_LABELS,
  type Payable,
  type PayableSortField,
  type PayableSortOrder,
  type PayableStatus,
} from '../types/financeiro'
import type { ListMeta } from '../types/listEnvelope'
import { mensagemErroApi } from '../utils/apiError'

const PAGE_SIZE_OPTIONS = [25, 50, 100]
const META_VAZIA: ListMeta = { page: 1, limit: 50, total: 0, totalPages: 1 }

function periodoVencimento(inicio: string, fim: string) {
  if (inicio && fim && inicio > fim) {
    return { from: fim, to: inicio }
  }
  return {
    ...(inicio ? { from: inicio } : {}),
    ...(fim ? { to: fim } : {}),
  }
}

export function FinanceiroPagamentosPage() {
  const navigate = useNavigate()
  const [pagamentos, setPagamentos] = useState<Payable[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [meta, setMeta] = useState<ListMeta>(META_VAZIA)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [statusFiltro, setStatusFiltro] = useState<PayableStatus | ''>('')
  const [fornecedorFiltro, setFornecedorFiltro] = useState<Fornecedor | null>(null)
  const [vencimentoInicio, setVencimentoInicio] = useState('')
  const [vencimentoFim, setVencimentoFim] = useState('')
  const [colunaOrdenacao, setColunaOrdenacao] = useState<PayableSortField | null>(null)
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<PayableSortOrder>('asc')
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
        ...(fornecedorFiltro ? { supplierId: fornecedorFiltro.id } : {}),
        ...periodoVencimento(vencimentoInicio, vencimentoFim),
        ...(colunaOrdenacao
          ? { sortBy: colunaOrdenacao, sortOrder: direcaoOrdenacao }
          : {}),
      })
      setPagamentos(resultado.data)
      setMeta(resultado.meta)
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível carregar os pagamentos.'))
    } finally {
      setLoading(false)
    }
  }, [
    page,
    rowsPerPage,
    statusFiltro,
    fornecedorFiltro,
    vencimentoInicio,
    vencimentoFim,
    colunaOrdenacao,
    direcaoOrdenacao,
  ])

  useEffect(() => {
    void carregar()
  }, [carregar])

  useEffect(() => {
    setPage(0)
  }, [statusFiltro, fornecedorFiltro, vencimentoInicio, vencimentoFim])

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

  function alternarOrdenacao(coluna: PayableSortField) {
    setPage(0)
    if (colunaOrdenacao === coluna) {
      setDirecaoOrdenacao((atual) => (atual === 'asc' ? 'desc' : 'asc'))
      return
    }
    setColunaOrdenacao(coluna)
    setDirecaoOrdenacao('asc')
  }

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

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
        <TextField
          select
          label="Status"
          size="small"
          value={statusFiltro}
          onChange={(event) => setStatusFiltro(event.target.value as PayableStatus | '')}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 180 } }}
        >
          <MenuItem value="">Todos</MenuItem>
          {PAYABLE_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {PAYABLE_STATUS_LABELS[status]}
            </MenuItem>
          ))}
        </TextField>
        <Autocomplete
          options={fornecedores}
          getOptionLabel={(fornecedor) => fornecedor.tradeName}
          isOptionEqualToValue={(option, selected) => option.id === selected.id}
          value={fornecedorFiltro}
          onChange={(_, fornecedor) => setFornecedorFiltro(fornecedor)}
          size="small"
          sx={{ width: { xs: '100%', sm: 280 }, minWidth: { sm: 240 } }}
          renderInput={(params) => (
            <TextField {...params} label="Fornecedor" size="small" placeholder="Todos" />
          )}
        />
        <CampoData
          label="Vencimento início"
          size="small"
          value={vencimentoInicio}
          onChange={setVencimentoInicio}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 200 } }}
        />
        <CampoData
          label="Vencimento fim"
          size="small"
          value={vencimentoFim}
          onChange={setVencimentoFim}
          min={vencimentoInicio || undefined}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 200 } }}
        />
      </Box>

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
            colunaOrdenacao={colunaOrdenacao}
            direcaoOrdenacao={direcaoOrdenacao}
            onOrdenar={alternarOrdenacao}
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
