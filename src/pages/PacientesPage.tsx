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
import { PacientesTable } from '../components/PacientesTable'
import { atualizarPaciente, listarPacientes } from '../services/patients.service'
import type { Patient } from '../types/paciente'

export function PacientesPage() {
  const navigate = useNavigate()
  const [pacientes, setPacientes] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editando, setEditando] = useState<Patient | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [phoneEdicao, setPhoneEdicao] = useState('')
  const [emailEdicao, setEmailEdicao] = useState('')
  const [birthDateEdicao, setBirthDateEdicao] = useState('')
  const [cpfEdicao, setCpfEdicao] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  function abrirEdicao(paciente: Patient) {
    setEditando(paciente)
    setNomeEdicao(paciente.name)
    setPhoneEdicao(paciente.phone)
    setEmailEdicao(paciente.email ?? '')
    setBirthDateEdicao(paciente.birthDate ?? '')
    setCpfEdicao(paciente.cpf ?? '')
  }

  function fecharEdicao() {
    setEditando(null)
    setNomeEdicao('')
    setPhoneEdicao('')
    setEmailEdicao('')
    setBirthDateEdicao('')
    setCpfEdicao('')
  }

  async function salvarEdicao() {
    if (!editando) return
    const cpfDigits = cpfEdicao.replace(/\D/g, '')
    if (cpfDigits.length > 0 && cpfDigits.length !== 11) {
      setError('CPF deve ter 11 digitos.')
      return
    }
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarPaciente(editando.id, {
        name: nomeEdicao.trim(),
        phone: phoneEdicao.trim(),
        email: emailEdicao.trim() || null,
        birthDate: birthDateEdicao || null,
        cpf: cpfDigits || null,
      })
      setPacientes((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
      fecharEdicao()
      setSuccess('Paciente atualizado com sucesso.')
    } catch {
      setError('Nao foi possivel editar o paciente.')
    } finally {
      setSavingEdit(false)
    }
  }

  const nomeInvalido = nomeEdicao.trim().length < 3
  const phoneInvalido = phoneEdicao.trim().length < 1
  const birthDateInvalida = birthDateEdicao !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(birthDateEdicao)
  const cpfDigitsLength = cpfEdicao.replace(/\D/g, '').length
  const cpfInvalido = cpfDigitsLength > 0 && cpfDigitsLength !== 11
  const emailTrim = emailEdicao.trim()
  const emailInvalido = emailTrim !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)

  useEffect(() => {
    async function carregarPacientes() {
      setLoading(true)
      setError(null)
      try {
        const data = await listarPacientes()
        setPacientes(data)
      } catch {
        setError('Nao foi possivel carregar os pacientes.')
      } finally {
        setLoading(false)
      }
    }

    void carregarPacientes()
  }, [])

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

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando pacientes...</Typography>
        </Paper>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {!loading && !error && pacientes.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum paciente encontrado.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && pacientes.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <PacientesTable pacientes={pacientes} onEditar={abrirEdicao} />
        </Paper>
      ) : null}

      <Dialog open={Boolean(editando)} onClose={fecharEdicao} fullWidth maxWidth="sm">
        <DialogTitle>Editar paciente</DialogTitle>
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
              label="Telefone"
              value={phoneEdicao}
              onChange={(event) => setPhoneEdicao(event.target.value)}
              error={phoneInvalido}
              helperText={phoneInvalido ? 'Informe o telefone' : ' '}
            />
            <TextField
              label="E-mail (opcional)"
              type="email"
              value={emailEdicao}
              onChange={(event) => setEmailEdicao(event.target.value)}
              error={emailInvalido}
              helperText={emailInvalido ? 'Informe um e-mail valido' : ' '}
            />
            <TextField
              label="Data de nascimento (opcional)"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={birthDateEdicao}
              onChange={(event) => setBirthDateEdicao(event.target.value)}
              error={birthDateInvalida}
              helperText={birthDateInvalida ? 'Informe a data de nascimento' : ' '}
            />
            <TextField
              label="CPF (opcional)"
              value={cpfEdicao}
              onChange={(event) => setCpfEdicao(event.target.value)}
              error={cpfInvalido}
              helperText={cpfInvalido ? 'CPF deve ter 11 digitos' : ' '}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharEdicao}>Cancelar</Button>
          <Button
            onClick={salvarEdicao}
            variant="contained"
            disabled={
              savingEdit || nomeInvalido || phoneInvalido || birthDateInvalida || cpfInvalido || emailInvalido
            }
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
