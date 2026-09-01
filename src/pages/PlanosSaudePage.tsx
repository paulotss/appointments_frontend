import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlanosSaudeTable } from '../components/PlanosSaudeTable'
import { atualizarPlanoSaude, listarPlanosSaude } from '../services/health-plans.service'
import type { HealthPlan } from '../types/planoSaude'
import { DEFAULT_TISS_VERSION, TISS_VERSIONS, type TissVersion } from '../types/tiss'

export function PlanosSaudePage() {
  const navigate = useNavigate()
  const [planos, setPlanos] = useState<HealthPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editando, setEditando] = useState<HealthPlan | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [prazoEdicao, setPrazoEdicao] = useState('')
  const [registroAnsEdicao, setRegistroAnsEdicao] = useState('')
  const [providerCodeEdicao, setProviderCodeEdicao] = useState('')
  const [tissVersionEdicao, setTissVersionEdicao] = useState<TissVersion>(DEFAULT_TISS_VERSION)
  const [savingEdit, setSavingEdit] = useState(false)

  function abrirEdicao(plano: HealthPlan) {
    setEditando(plano)
    setNomeEdicao(plano.name)
    setPrazoEdicao(String(plano.submissionDeadlineDays))
    setRegistroAnsEdicao(plano.registroAns ?? '')
    setProviderCodeEdicao(plano.providerCode ?? '')
    setTissVersionEdicao(plano.tissVersion)
  }

  function fecharEdicao() {
    setEditando(null)
    setNomeEdicao('')
    setPrazoEdicao('')
    setRegistroAnsEdicao('')
    setProviderCodeEdicao('')
    setTissVersionEdicao(DEFAULT_TISS_VERSION)
  }

  async function salvarEdicao() {
    if (!editando) return
    const prazo = Number(prazoEdicao)
    if (!Number.isInteger(prazo) || prazo <= 0) {
      setError('Prazo deve ser um inteiro positivo.')
      return
    }
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarPlanoSaude(editando.id, {
        name: nomeEdicao.trim(),
        submissionDeadlineDays: prazo,
        registroAns: registroAnsEdicao.replace(/\D/g, '') || null,
        providerCode: providerCodeEdicao.trim() || null,
        tissVersion: tissVersionEdicao,
      })
      setPlanos((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
      fecharEdicao()
      setSuccess('Plano de saude atualizado com sucesso.')
    } catch {
      setError('Nao foi possivel editar o plano de saude.')
    } finally {
      setSavingEdit(false)
    }
  }

  const nomeInvalido = nomeEdicao.trim().length < 2
  const prazoNumero = Number(prazoEdicao)
  const prazoInvalido = !Number.isInteger(prazoNumero) || prazoNumero <= 0

  useEffect(() => {
    async function carregarPlanos() {
      setLoading(true)
      setError(null)
      try {
        const data = await listarPlanosSaude()
        setPlanos(data)
      } catch {
        setError('Nao foi possivel carregar os planos de saude.')
      } finally {
        setLoading(false)
      }
    }

    void carregarPlanos()
  }, [])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Planos de saude
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/planos-saude/novo')}
        >
          Novo plano
        </Button>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando planos de saude...</Typography>
        </Paper>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {!loading && !error && planos.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum plano de saude encontrado.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && planos.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <PlanosSaudeTable planos={planos} onEditar={abrirEdicao} />
        </Paper>
      ) : null}

      <Dialog open={Boolean(editando)} onClose={fecharEdicao} fullWidth maxWidth="sm">
        <DialogTitle>Editar plano de saude</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <TextField
              label="Nome"
              value={nomeEdicao}
              onChange={(event) => setNomeEdicao(event.target.value)}
              error={Boolean(nomeEdicao) && nomeInvalido}
              helperText={Boolean(nomeEdicao) && nomeInvalido ? 'Minimo 2 caracteres' : ' '}
            />
            <TextField
              label="Prazo de envio (dias)"
              type="number"
              value={prazoEdicao}
              onChange={(event) => setPrazoEdicao(event.target.value)}
              error={Boolean(prazoEdicao) && prazoInvalido}
              helperText={
                Boolean(prazoEdicao) && prazoInvalido ? 'Informe um inteiro maior que zero' : ' '
              }
            />
            <TextField
              label="Registro ANS"
              value={registroAnsEdicao}
              onChange={(event) => setRegistroAnsEdicao(event.target.value)}
              helperText="6 dígitos da operadora"
            />
            <TextField
              label="Código do prestador na operadora"
              value={providerCodeEdicao}
              onChange={(event) => setProviderCodeEdicao(event.target.value)}
            />
            <TextField
              select
              label="Versão TISS"
              value={tissVersionEdicao}
              onChange={(event) => setTissVersionEdicao(event.target.value as TissVersion)}
            >
              {TISS_VERSIONS.map((versao) => (
                <MenuItem key={versao} value={versao}>
                  {versao}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharEdicao}>Cancelar</Button>
          <Button
            onClick={salvarEdicao}
            variant="contained"
            disabled={savingEdit || nomeInvalido || prazoInvalido}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
