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
import { PacientesTable } from '../components/PacientesTable'
import { listarPacientes } from '../services/patients.service'
import type { ListMeta } from '../types/listEnvelope'
import type { Patient } from '../types/paciente'
import { mensagemErroApi } from '../utils/apiError'

const PAGE_SIZE_OPTIONS = [25, 50, 100]
const META_VAZIA: ListMeta = { page: 1, limit: 50, total: 0, totalPages: 1 }

export function PacientesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [pacientes, setPacientes] = useState<Patient[]>([])
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
    navigate('/pacientes', { replace: true, state: null })
  }, [location.state, navigate])

  useEffect(() => {
    const timer = window.setTimeout(() => setFiltroNomeDebounced(filtroNome.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [filtroNome])

  useEffect(() => {
    setPage(0)
  }, [filtroNomeDebounced])

  const carregarPacientes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const resultado = await listarPacientes({
        ...(filtroNomeDebounced ? { name: filtroNomeDebounced } : {}),
        page: page + 1,
        limit: rowsPerPage,
      })
      setPacientes(resultado.data)
      setMeta(resultado.meta)
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível carregar os pacientes.'))
    } finally {
      setLoading(false)
    }
  }, [filtroNomeDebounced, page, rowsPerPage])

  useEffect(() => {
    void carregarPacientes()
  }, [carregarPacientes])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Pacientes
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/pacientes/novo')}>
          Novo paciente
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
          <Typography>Carregando pacientes...</Typography>
        </Paper>
      ) : null}

      {!loading && !error && pacientes.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum paciente encontrado.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && pacientes.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <PacientesTable
            pacientes={pacientes}
            onEditar={(paciente) => navigate(`/pacientes/${paciente.id}`)}
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
