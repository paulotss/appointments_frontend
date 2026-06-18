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
import { LocaisTable } from '../components/LocaisTable'
import { atualizarLocal, excluirLocal, listarLocais } from '../services/storage-locations.service'
import type { LocalArmazenamento } from '../types/estoque'

export function LocaisPage() {
  const navigate = useNavigate()
  const [locais, setLocais] = useState<LocalArmazenamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editando, setEditando] = useState<LocalArmazenamento | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  function abrirEdicao(local: LocalArmazenamento) {
    setEditando(local)
    setNomeEdicao(local.nome)
  }

  function fecharEdicao() {
    setEditando(null)
    setNomeEdicao('')
  }

  async function salvarEdicao() {
    if (!editando) return
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarLocal(editando.id, { name: nomeEdicao.trim() })
      setLocais((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
      fecharEdicao()
      setSuccess('Local atualizado com sucesso.')
    } catch {
      setError('Nao foi possivel editar o local.')
    } finally {
      setSavingEdit(false)
    }
  }

  const nomeInvalido = nomeEdicao.trim().length < 2

  async function excluir(local: LocalArmazenamento) {
    const confirmou = window.confirm(`Confirma excluir o local "${local.nome}"?`)
    if (!confirmou) return

    setError(null)
    setSuccess(null)
    try {
      await excluirLocal(local.id)
      setLocais((prev) => prev.filter((item) => item.id !== local.id))
      setSuccess('Local excluido com sucesso.')
    } catch {
      setError('Nao foi possivel excluir o local.')
    }
  }

  useEffect(() => {
    async function carregarLocais() {
      setLoading(true)
      setError(null)
      try {
        const data = await listarLocais()
        setLocais(data)
      } catch {
        setError('Nao foi possivel carregar os locais.')
      } finally {
        setLoading(false)
      }
    }

    void carregarLocais()
  }, [])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Locais de armazenamento
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/configuracoes/estoque/locais/novo')}
        >
          Novo local
        </Button>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando locais...</Typography>
        </Paper>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {!loading && !error && locais.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum local encontrado.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && locais.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <LocaisTable locais={locais} onEditar={abrirEdicao} onExcluir={excluir} />
        </Paper>
      ) : null}

      <Dialog open={Boolean(editando)} onClose={fecharEdicao} fullWidth maxWidth="xs">
        <DialogTitle>Editar local</DialogTitle>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharEdicao}>Cancelar</Button>
          <Button onClick={salvarEdicao} variant="contained" disabled={savingEdit || nomeInvalido}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
