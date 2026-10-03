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
import { PacienteBuscaAutocomplete } from '../components/PacienteBuscaAutocomplete'
import { ProfissionalBuscaAutocomplete } from '../components/ProfissionalBuscaAutocomplete'
import { UsuariosTable } from '../components/UsuariosTable'
import { ROLE_LABELS, USER_ROLES, type UserRole } from '../routes/access'
import { atualizarUsuario, excluirUsuario, listarUsuarios } from '../services/users.service'
import type { Patient } from '../types/paciente'
import type { HealthProfessional } from '../types/profissional'
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

function parseEmailOpcional(raw: string): { ok: true; value: string | null } | { ok: false } {
  const t = raw.trim()
  if (t === '') {
    return { ok: true, value: null }
  }
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
  if (!emailOk) {
    return { ok: false }
  }
  return { ok: true, value: t }
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
  const [emailEdicao, setEmailEdicao] = useState('')
  const [ramalEdicao, setRamalEdicao] = useState('')
  const [senhaEdicao, setSenhaEdicao] = useState('')
  const [roleEdicao, setRoleEdicao] = useState<UserRole>('RECEPTIONIST')
  const [pacienteEdicao, setPacienteEdicao] = useState<Patient | null>(null)
  const [profissionalEdicao, setProfissionalEdicao] = useState<HealthProfessional | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  function abrirEdicao(usuario: SystemUser) {
    setEditando(usuario)
    setNomeEdicao(usuario.name)
    setLoginEdicao(usuario.usernameLogin)
    setEmailEdicao(usuario.email ?? '')
    setRamalEdicao(usuario.extension != null ? String(usuario.extension) : '')
    setSenhaEdicao('')
    setRoleEdicao(usuario.role)
    setPacienteEdicao(
      usuario.patientId != null
        ? ({ id: usuario.patientId, name: usuario.patientName ?? `Paciente ${usuario.patientId}` } as Patient)
        : null,
    )
    setProfissionalEdicao(
      usuario.healthProfessionalId != null
        ? ({
            id: usuario.healthProfessionalId,
            name: usuario.healthProfessionalName ?? `Profissional ${usuario.healthProfessionalId}`,
          } as HealthProfessional)
        : null,
    )
  }

  function fecharEdicao() {
    setEditando(null)
    setNomeEdicao('')
    setLoginEdicao('')
    setEmailEdicao('')
    setRamalEdicao('')
    setSenhaEdicao('')
    setRoleEdicao('RECEPTIONIST')
    setPacienteEdicao(null)
    setProfissionalEdicao(null)
  }

  async function salvarEdicao() {
    if (!editando) return
    const ramalRes = parseRamalOpcional(ramalEdicao)
    if (!ramalRes.ok) {
      setError('Ramal invalido.')
      return
    }
    const emailRes = parseEmailOpcional(emailEdicao)
    if (!emailRes.ok) {
      setError('E-mail invalido.')
      return
    }
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarUsuario(editando.id, {
        name: nomeEdicao.trim(),
        usernameLogin: loginEdicao.trim(),
        email: emailRes.value,
        role: roleEdicao,
        patientId: roleEdicao === 'PATIENT' ? (pacienteEdicao?.id ?? null) : null,
        healthProfessionalId: roleEdicao === 'PROFESSIONAL' ? (profissionalEdicao?.id ?? null) : null,
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
  const emailInvalido = !parseEmailOpcional(emailEdicao).ok

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
              label="E-mail (opcional)"
              type="email"
              value={emailEdicao}
              onChange={(event) => setEmailEdicao(event.target.value)}
              error={Boolean(emailEdicao.trim()) && emailInvalido}
              helperText={
                Boolean(emailEdicao.trim()) && emailInvalido ? 'Informe um e-mail valido' : ' '
              }
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
            <TextField
              select
              label="Papel"
              value={roleEdicao}
              onChange={(event) => setRoleEdicao(event.target.value as UserRole)}
            >
              {USER_ROLES.map((item) => (
                <MenuItem key={item} value={item}>
                  {ROLE_LABELS[item]}
                </MenuItem>
              ))}
            </TextField>
            {roleEdicao === 'PATIENT' ? (
              <PacienteBuscaAutocomplete value={pacienteEdicao} onChange={setPacienteEdicao} disableListPortal />
            ) : null}
            {roleEdicao === 'PROFESSIONAL' ? (
              <ProfissionalBuscaAutocomplete
                value={profissionalEdicao}
                onChange={setProfissionalEdicao}
                disableListPortal
              />
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharEdicao}>Cancelar</Button>
          <Button
            onClick={salvarEdicao}
            variant="contained"
            disabled={
              savingEdit ||
              nomeInvalido ||
              loginInvalido ||
              ramalInvalido ||
              emailInvalido ||
              (roleEdicao === 'PATIENT' && pacienteEdicao == null) ||
              (roleEdicao === 'PROFESSIONAL' && profissionalEdicao == null)
            }
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
