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
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProfissionaisTable } from '../components/ProfissionaisTable'
import { listarEspecialidades } from '../services/especialidades.service'
import { atualizarProfissional, listarProfissionais } from '../services/health-professionals.service'
import type { Especialidade } from '../types/registro'
import { COUNCIL_TYPES, type CouncilType, type HealthProfessional } from '../types/profissional'

export function ProfissionaisPage() {
  const navigate = useNavigate()
  const [profissionais, setProfissionais] = useState<HealthProfessional[]>([])
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editando, setEditando] = useState<HealthProfessional | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [specialtyIdEdicao, setSpecialtyIdEdicao] = useState<number | ''>('')
  const [councilTypeEdicao, setCouncilTypeEdicao] = useState<CouncilType>('CRM')
  const [councilNumberEdicao, setCouncilNumberEdicao] = useState('')
  const [cpfEdicao, setCpfEdicao] = useState('')
  const [phoneEdicao, setPhoneEdicao] = useState('')
  const [emailEdicao, setEmailEdicao] = useState('')
  const [isActiveEdicao, setIsActiveEdicao] = useState(true)
  const [savingEdit, setSavingEdit] = useState(false)

  function abrirEdicao(profissional: HealthProfessional) {
    setEditando(profissional)
    setNomeEdicao(profissional.name)
    setSpecialtyIdEdicao(profissional.specialtyId)
    setCouncilTypeEdicao(profissional.councilType)
    setCouncilNumberEdicao(profissional.councilNumber)
    setCpfEdicao(profissional.cpf)
    setPhoneEdicao(profissional.phone ?? '')
    setEmailEdicao(profissional.email ?? '')
    setIsActiveEdicao(profissional.isActive)
  }

  function fecharEdicao() {
    setEditando(null)
    setNomeEdicao('')
    setSpecialtyIdEdicao('')
    setCouncilTypeEdicao('CRM')
    setCouncilNumberEdicao('')
    setCpfEdicao('')
    setPhoneEdicao('')
    setEmailEdicao('')
    setIsActiveEdicao(true)
  }

  async function salvarEdicao() {
    if (!editando || specialtyIdEdicao === '') return
    const cpfDigits = cpfEdicao.replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      setError('CPF deve ter 11 digitos.')
      return
    }
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarProfissional(editando.id, {
        name: nomeEdicao.trim(),
        specialtyId: specialtyIdEdicao,
        councilType: councilTypeEdicao,
        councilNumber: councilNumberEdicao.trim(),
        cpf: cpfDigits,
        phone: phoneEdicao.trim() || null,
        email: emailEdicao.trim() || null,
        isActive: isActiveEdicao,
      })
      setProfissionais((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
      fecharEdicao()
      setSuccess('Profissional atualizado com sucesso.')
    } catch {
      setError('Nao foi possivel editar o profissional.')
    } finally {
      setSavingEdit(false)
    }
  }

  const nomeInvalido = nomeEdicao.trim().length < 3
  const councilNumberInvalido = councilNumberEdicao.trim().length < 1
  const cpfInvalido = cpfEdicao.replace(/\D/g, '').length !== 11
  const specialtyInvalida = specialtyIdEdicao === ''

  useEffect(() => {
    async function carregarDados() {
      setLoading(true)
      setError(null)
      try {
        const [profissionaisData, especialidadesData] = await Promise.all([
          listarProfissionais(),
          listarEspecialidades(),
        ])
        setProfissionais(profissionaisData)
        setEspecialidades(especialidadesData)
      } catch {
        setError('Nao foi possivel carregar os profissionais.')
      } finally {
        setLoading(false)
      }
    }

    void carregarDados()
  }, [])

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

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando profissionais...</Typography>
        </Paper>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {!loading && !error && profissionais.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum profissional encontrado.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && profissionais.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <ProfissionaisTable profissionais={profissionais} onEditar={abrirEdicao} />
        </Paper>
      ) : null}

      <Dialog open={Boolean(editando)} onClose={fecharEdicao} fullWidth maxWidth="sm">
        <DialogTitle>Editar profissional</DialogTitle>
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
              select
              label="Especialidade"
              value={specialtyIdEdicao}
              onChange={(event) => setSpecialtyIdEdicao(Number(event.target.value))}
              error={specialtyInvalida}
              helperText={specialtyInvalida ? 'Selecione uma especialidade' : ' '}
            >
              {especialidades.map((esp) => (
                <MenuItem key={esp.id} value={esp.id}>
                  {esp.nome}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Tipo de conselho"
              value={councilTypeEdicao}
              onChange={(event) => setCouncilTypeEdicao(event.target.value as CouncilType)}
            >
              {COUNCIL_TYPES.map((tipo) => (
                <MenuItem key={tipo} value={tipo}>
                  {tipo}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Numero do conselho"
              value={councilNumberEdicao}
              onChange={(event) => setCouncilNumberEdicao(event.target.value)}
              error={Boolean(councilNumberEdicao) && councilNumberInvalido}
              helperText={
                Boolean(councilNumberEdicao) && councilNumberInvalido
                  ? 'Informe o numero do conselho'
                  : ' '
              }
            />
            <TextField
              label="CPF"
              value={cpfEdicao}
              onChange={(event) => setCpfEdicao(event.target.value)}
              error={Boolean(cpfEdicao) && cpfInvalido}
              helperText={Boolean(cpfEdicao) && cpfInvalido ? 'CPF deve ter 11 digitos' : ' '}
            />
            <TextField
              label="Telefone (opcional)"
              value={phoneEdicao}
              onChange={(event) => setPhoneEdicao(event.target.value)}
            />
            <TextField
              label="E-mail (opcional)"
              value={emailEdicao}
              onChange={(event) => setEmailEdicao(event.target.value)}
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
          <Button
            onClick={salvarEdicao}
            variant="contained"
            disabled={
              savingEdit || nomeInvalido || councilNumberInvalido || cpfInvalido || specialtyInvalida
            }
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
