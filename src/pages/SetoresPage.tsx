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
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SetoresTable } from '../components/SetoresTable'
import { atualizarSetor, excluirSetor, listarSetores } from '../services/sectors.service'
import type { Setor } from '../types/estoque'

export function SetoresPage() {
  const navigate = useNavigate()
  const [setores, setSetores] = useState<Setor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editando, setEditando] = useState<Setor | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [isActiveEdicao, setIsActiveEdicao] = useState(true)
  const [savingEdit, setSavingEdit] = useState(false)

  function abrirEdicao(setor: Setor) {
    setEditando(setor)
    setNomeEdicao(setor.nome)
    setIsActiveEdicao(setor.isActive)
  }

  function fecharEdicao() {
    setEditando(null)
    setNomeEdicao('')
    setIsActiveEdicao(true)
  }

  async function salvarEdicao() {
    if (!editando) return
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarSetor(editando.id, {
        name: nomeEdicao.trim(),
        isActive: isActiveEdicao,
      })
      setSetores((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
      fecharEdicao()
      setSuccess('Setor atualizado com sucesso.')
    } catch {
      setError('Nao foi possivel editar o setor.')
    } finally {
      setSavingEdit(false)
    }
  }

  const nomeInvalido = nomeEdicao.trim().length < 2

  async function excluir(setor: Setor) {
    const confirmou = window.confirm(`Confirma excluir o setor "${setor.nome}"?`)
    if (!confirmou) return

    setError(null)
    setSuccess(null)
    try {
      await excluirSetor(setor.id)
      setSetores((prev) => prev.filter((item) => item.id !== setor.id))
      setSuccess('Setor excluido com sucesso.')
    } catch {
      setError('Nao foi possivel excluir o setor.')
    }
  }

  useEffect(() => {
    async function carregarSetores() {
      setLoading(true)
      setError(null)
      try {
        const data = await listarSetores()
        setSetores(data)
      } catch {
        setError('Nao foi possivel carregar os setores.')
      } finally {
        setLoading(false)
      }
    }

    void carregarSetores()
  }, [])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Setores
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/configuracoes/estoque/setores/novo')}
        >
          Novo setor
        </Button>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando setores...</Typography>
        </Paper>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {!loading && !error && setores.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum setor encontrado.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && setores.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <SetoresTable setores={setores} onEditar={abrirEdicao} onExcluir={excluir} />
        </Paper>
      ) : null}

      <Dialog open={Boolean(editando)} onClose={fecharEdicao} fullWidth maxWidth="xs">
        <DialogTitle>Editar setor</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <TextField
              label="Nome"
              value={nomeEdicao}
              onChange={(event) => setNomeEdicao(event.target.value)}
              error={Boolean(nomeEdicao) && nomeInvalido}
              helperText={Boolean(nomeEdicao) && nomeInvalido ? 'Minimo 2 caracteres' : ' '}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isActiveEdicao}
                  onChange={(_, checked) => setIsActiveEdicao(checked)}
                />
              }
              label="Ativo"
            />
          </Stack>
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
