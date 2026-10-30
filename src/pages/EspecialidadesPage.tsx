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
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EspecialidadesTable } from '../components/EspecialidadesTable'
import { CbosAutocomplete } from '../components/CbosAutocomplete'
import {
  atualizarEspecialidade,
  excluirEspecialidade,
  listarEspecialidades,
} from '../services/especialidades.service'
import type { Especialidade } from '../types/registro'

export function EspecialidadesPage() {
  const navigate = useNavigate()
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editando, setEditando] = useState<Especialidade | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [cbosEdicao, setCbosEdicao] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  function abrirEdicao(especialidade: Especialidade) {
    setEditando(especialidade)
    setNomeEdicao(especialidade.nome)
    setCbosEdicao(especialidade.cbosCode ?? '')
  }

  function fecharEdicao() {
    setEditando(null)
    setNomeEdicao('')
    setCbosEdicao('')
  }

  async function salvarEdicao() {
    if (!editando) return
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarEspecialidade(editando.id, {
        name: nomeEdicao.trim(),
        cbosCode: cbosEdicao.replace(/\D/g, ''),
      })
      setEspecialidades((prev) =>
        prev.map((item) => (item.id === atualizado.id ? atualizado : item)),
      )
      fecharEdicao()
      setSuccess('Especialidade atualizada com sucesso.')
    } catch {
      setError('Nao foi possivel editar a especialidade.')
    } finally {
      setSavingEdit(false)
    }
  }

  const nomeInvalido = nomeEdicao.trim().length < 2
  const cbosInvalido = cbosEdicao.replace(/\D/g, '').length !== 6

  async function excluir(especialidade: Especialidade) {
    const confirmou = window.confirm(
      `Confirma excluir a especialidade "${especialidade.nome}"?`,
    )
    if (!confirmou) return

    setError(null)
    setSuccess(null)
    try {
      await excluirEspecialidade(especialidade.id)
      setEspecialidades((prev) => prev.filter((item) => item.id !== especialidade.id))
      setSuccess('Especialidade excluida com sucesso.')
    } catch {
      setError('Nao foi possivel excluir a especialidade.')
    }
  }

  useEffect(() => {
    async function carregarEspecialidades() {
      setLoading(true)
      setError(null)
      try {
        const data = await listarEspecialidades()
        setEspecialidades(data)
      } catch {
        setError('Nao foi possivel carregar as especialidades.')
      } finally {
        setLoading(false)
      }
    }

    void carregarEspecialidades()
  }, [])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Especialidades
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/especialidades/nova')}
        >
          Nova especialidade
        </Button>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando especialidades...</Typography>
        </Paper>
      ) : null}

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {!loading && !error && especialidades.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhuma especialidade encontrada.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && especialidades.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <EspecialidadesTable
            especialidades={especialidades}
            onEditar={abrirEdicao}
            onExcluir={excluir}
          />
        </Paper>
      ) : null}

      <Dialog open={Boolean(editando)} onClose={fecharEdicao} fullWidth maxWidth="xs">
        <DialogTitle>Editar especialidade</DialogTitle>
        <DialogContent>
          <TextField
            label="Nome"
            value={nomeEdicao}
            onChange={(event) => setNomeEdicao(event.target.value)}
            fullWidth
            autoFocus
            margin="dense"
            error={Boolean(nomeEdicao) && nomeInvalido}
            helperText={Boolean(nomeEdicao) && nomeInvalido ? 'Minimo 2 caracteres' : ' '}
          />
          <CbosAutocomplete
            label="CBO-S"
            value={cbosEdicao}
            onChange={setCbosEdicao}
            error={Boolean(cbosEdicao) && cbosInvalido}
            helperText={
              Boolean(cbosEdicao) && cbosInvalido
                ? 'CBO-S deve ter 6 dígitos'
                : 'Código da ocupação desta especialidade'
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharEdicao}>Cancelar</Button>
          <Button
            onClick={salvarEdicao}
            variant="contained"
            disabled={savingEdit || nomeInvalido || cbosInvalido}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
