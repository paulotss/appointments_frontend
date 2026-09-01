import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PacienteForm } from '../components/PacienteForm'
import { PacientesTable } from '../components/PacientesTable'
import { listarPlanosSaude } from '../services/health-plans.service'
import { sincronizarCarteirinhas } from '../services/insurance-cards.service'
import { atualizarPaciente, buscarPaciente, listarPacientes } from '../services/patients.service'
import type { PacienteFormValues } from '../schemas/paciente.schema'
import type { ListMeta } from '../types/listEnvelope'
import type { Patient } from '../types/paciente'
import type { HealthPlan } from '../types/planoSaude'
import { mensagemErroApi } from '../utils/apiError'

const PAGE_SIZE_OPTIONS = [25, 50, 100]
const META_VAZIA: ListMeta = { page: 1, limit: 50, total: 0, totalPages: 1 }

export function PacientesPage() {
  const navigate = useNavigate()
  const [pacientes, setPacientes] = useState<Patient[]>([])
  const [planos, setPlanos] = useState<HealthPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editando, setEditando] = useState<Patient | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [filtroNome, setFiltroNome] = useState('')
  const [filtroNomeDebounced, setFiltroNomeDebounced] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [meta, setMeta] = useState<ListMeta>(META_VAZIA)

  useEffect(() => {
    const timer = window.setTimeout(() => setFiltroNomeDebounced(filtroNome.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [filtroNome])

  useEffect(() => {
    setPage(0)
  }, [filtroNomeDebounced])

  useEffect(() => {
    void listarPlanosSaude().then(setPlanos).catch(() => {
      setPlanos([])
    })
  }, [])

  async function abrirEdicao(paciente: Patient) {
    setError(null)
    setSuccess(null)
    setLoadingEdit(true)
    setEditando(paciente)
    try {
      setEditando(await buscarPaciente(paciente.id))
    } catch (err) {
      setEditando(null)
      setError(mensagemErroApi(err, 'Não foi possível carregar o paciente.'))
    } finally {
      setLoadingEdit(false)
    }
  }

  function fecharEdicao() {
    if (savingEdit) return
    setEditando(null)
  }

  async function salvarEdicao(values: PacienteFormValues) {
    if (!editando) return
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      await atualizarPaciente(editando.id, {
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email,
        birthDate: values.birthDate,
        cpf: values.cpf,
      })
      await sincronizarCarteirinhas(
        editando.id,
        editando.insuranceCards,
        values.insuranceCards.map((item) => ({
          id: item.cardId,
          healthPlanId: item.healthPlanId,
          cardNumber: item.cardNumber,
          expirationDate: item.expirationDate,
        })),
      )
      const atualizado = await buscarPaciente(editando.id)
      setPacientes((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
      setEditando(null)
      setSuccess('Paciente atualizado com sucesso.')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível editar o paciente.'))
    } finally {
      setSavingEdit(false)
    }
  }

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

      {error && !editando ? <Alert severity="error">{error}</Alert> : null}
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
          <PacientesTable pacientes={pacientes} onEditar={(paciente) => void abrirEdicao(paciente)} />
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

      <Dialog open={Boolean(editando) || loadingEdit} onClose={fecharEdicao} fullWidth maxWidth="md">
        <DialogTitle>Editar paciente</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            {error && editando ? <Alert severity="error">{error}</Alert> : null}
            {loadingEdit || !editando ? (
              <Stack direction="row" alignItems="center" gap={1.5}>
                <CircularProgress size={20} />
                <Typography>Carregando paciente...</Typography>
              </Stack>
            ) : (
              <PacienteForm
                key={editando.id}
                defaultValues={{
                  name: editando.name,
                  phone: editando.phone,
                  email: editando.email ?? '',
                  birthDate: editando.birthDate ?? '',
                  cpf: editando.cpf ?? '',
                  insuranceCards: editando.insuranceCards.map((item) => ({
                    cardId: item.id,
                    healthPlanId: item.healthPlanId,
                    cardNumber: item.cardNumber,
                    expirationDate: item.expirationDate,
                  })),
                }}
                planos={planos}
                loading={savingEdit}
                submitLabel="Salvar"
                onCancel={fecharEdicao}
                onSubmit={(values) => void salvarEdicao(values)}
              />
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  )
}
