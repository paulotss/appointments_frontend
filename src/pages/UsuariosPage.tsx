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
import { UsuariosTable } from '../components/UsuariosTable'
import { atualizarUsuario, excluirUsuario, listarUsuarios } from '../services/users.service'
import type { SystemUser } from '../types/user'

function parseRamalOpcional(raw: string): { ok: true; value: number | null } | { ok: false } {
  const t = raw.trim()
  if (t === '') {
    return { ok: true, value: null }
  }
  const n = Number(t)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    return { ok: false }
  }
  return { ok: true, value: n }
}

export function UsuariosPage() {
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editando, setEditando] = useState<SystemUser | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [loginEdicao, setLoginEdicao] = useState('')
  const [ramalEdicao, setRamalEdicao] = useState('')
  const [senhaEdicao, setSenhaEdicao] = useState('')
  const [isAdminEdicao, setIsAdminEdicao] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  function abrirEdicao(usuario: SystemUser) {
    setEditando(usuario)
    setNomeEdicao(usuario.name)
    setLoginEdicao(usuario.usernameLogin)
    setRamalEdicao(usuario.extension != null ? String(usuario.extension) : '')
    setSenhaEdicao('')
    setIsAdminEdicao(usuario.isAdmin)
  }

  function fecharEdicao() {
    setEditando(null)
    setNomeEdicao('')
    setLoginEdicao('')
    setRamalEdicao('')
    setSenhaEdicao('')
    setIsAdminEdicao(false)
  }

  async function salvarEdicao() {
    if (!editando) return
    const ramalRes = parseRamalOpcional(ramalEdicao)
    if (!ramalRes.ok) {
      setError('Ramal invalido.')
      return
    }
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarUsuario(editando.id, {
        name: nomeEdicao.trim(),
        usernameLogin: loginEdicao.trim(),
        isAdmin: isAdminEdicao,
        passwordHash: senhaEdicao.trim() || undefined,
        extension: ramalRes.value,
      })
      setUsuarios((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
      fecharEdicao()
      setSuccess('Usuario atualizado com sucesso.')
    } catch {
      setError('Nao foi possivel editar o usuario.')
    } finally {
      setSavingEdit(false)
    }
  }

  const nomeInvalido = nomeEdicao.trim().length < 3
  const loginInvalido = loginEdicao.trim().length < 3
  const ramalInvalido = !parseRamalOpcional(ramalEdicao).ok

  async function excluir(usuario: SystemUser) {
    const confirmou = window.confirm(`Confirma excluir o usuario "${usuario.name}"?`)
    if (!confirmou) return

    setError(null)
    setSuccess(null)
    try {
      await excluirUsuario(usuario.id)
      setUsuarios((prev) => prev.filter((item) => item.id !== usuario.id))
      setSuccess('Usuario excluido com sucesso.')
    } catch {
      setError('Nao foi possivel excluir o usuario.')
    }
  }

  useEffect(() => {
    async function carregarUsuarios() {
      setLoading(true)
      setError(null)
      try {
        const data = await listarUsuarios()
        setUsuarios(data)
      } catch {
        setError('Nao foi possivel carregar os usuarios.')
      } finally {
        setLoading(false)
      }
    }

    void carregarUsuarios()
  }, [])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Usuarios do sistema
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/usuarios/novo')}>
          Novo usuario
        </Button>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando usuarios...</Typography>
        </Paper>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {!loading && !error && usuarios.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum usuario encontrado.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && usuarios.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <UsuariosTable usuarios={usuarios} onEditar={abrirEdicao} onExcluir={excluir} />
        </Paper>
      ) : null}

      <Dialog open={Boolean(editando)} onClose={fecharEdicao} fullWidth maxWidth="sm">
        <DialogTitle>Editar usuario</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <TextField
              label="Nome"
              value={nomeEdicao}
              onChange={(event) => setNomeEdicao(event.target.value)}
              error={Boolean(nomeEdicao) && nomeInvalido}
              helperText={Boolean(nomeEdicao) && nomeInvalido ? 'Minimo 3 caracteres' : ' '}
            />
            <TextField
              label="Usuario de login"
              value={loginEdicao}
              onChange={(event) => setLoginEdicao(event.target.value)}
              error={Boolean(loginEdicao) && loginInvalido}
              helperText={Boolean(loginEdicao) && loginInvalido ? 'Minimo 3 caracteres' : ' '}
            />
            <TextField
              label="Ramal (opcional)"
              inputProps={{ inputMode: 'numeric' }}
              value={ramalEdicao}
              onChange={(event) => setRamalEdicao(event.target.value)}
              error={Boolean(ramalEdicao.trim()) && ramalInvalido}
              helperText={
                Boolean(ramalEdicao.trim()) && ramalInvalido
                  ? 'Informe um inteiro positivo ou deixe em branco'
                  : ' '
              }
            />
            <TextField
              label="Nova senha (opcional)"
              type="password"
              value={senhaEdicao}
              onChange={(event) => setSenhaEdicao(event.target.value)}
            />
            <FormControlLabel
              control={
                <Switch checked={isAdminEdicao} onChange={(_, checked) => setIsAdminEdicao(checked)} />
              }
              label="Administrador"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharEdicao}>Cancelar</Button>
          <Button
            onClick={salvarEdicao}
            variant="contained"
            disabled={savingEdit || nomeInvalido || loginInvalido || ramalInvalido}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
