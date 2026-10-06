import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ProfissionaisTable } from '../components/ProfissionaisTable'
import { listarProfissionais } from '../services/health-professionals.service'
import type { ListMeta } from '../types/listEnvelope'
import type { HealthProfessional } from '../types/profissional'

const PAGE_SIZE_OPTIONS = [25, 50, 100]
const META_VAZIA: ListMeta = { page: 1, limit: 50, total: 0, totalPages: 1 }

export function ProfissionaisPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [profissionais, setProfissionais] = useState<HealthProfessional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [filtroNome, setFiltroNome] = useState('')
  const [filtroNomeDebounced, setFiltroNomeDebounced] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [meta, setMeta] = useState<ListMeta>(META_VAZIA)

  useEffect(() => {
    const mensagem = (location.state as { success?: string } | null)?.success
    if (!mensagem) return
    setSuccess(mensagem)
    navigate('/profissionais', { replace: true, state: null })
  }, [location.state, navigate])

  useEffect(() => {
    const timer = window.setTimeout(() => setFiltroNomeDebounced(filtroNome.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [filtroNome])

  useEffect(() => {
    setPage(0)
  }, [filtroNomeDebounced])

  const carregarDados = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const profissionaisData = await listarProfissionais({
        ...(filtroNomeDebounced ? { name: filtroNomeDebounced } : {}),
        page: page + 1,
        limit: rowsPerPage,
      })
      setProfissionais(profissionaisData.data)
      setMeta(profissionaisData.meta)
    } catch {
      setError('Nao foi possivel carregar os profissionais.')
    } finally {
      setLoading(false)
    }
  }, [filtroNomeDebounced, page, rowsPerPage])

  useEffect(() => {
    void carregarDados()
  }, [carregarDados])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Profissionais
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/profissionais/novo')}
        >
          Novo profissional
        </Button>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      <TextField
        label="Buscar por nome"
        value={filtroNome}
        onChange={(event) => setFiltroNome(event.target.value)}
        size="small"
        sx={{ maxWidth: 360 }}
      />

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando profissionais...</Typography>
        </Paper>
      ) : null}

      {!loading && !error && profissionais.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum profissional encontrado.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && profissionais.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <ProfissionaisTable
            profissionais={profissionais}
            onEditar={(profissional) => navigate(`/profissionais/${profissional.id}`)}
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
            labelRowsPerPage="Por página"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
        </Paper>
      ) : null}
    </Stack>
  )
}
