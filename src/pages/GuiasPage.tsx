import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Autocomplete,
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
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GuiasTable } from '../components/GuiasTable'
import { listarPlanosSaude } from '../services/health-plans.service'
import { listarProfissionais } from '../services/health-professionals.service'
import { atualizarGuia, listarGuias } from '../services/insurance-guides.service'
import { listarPacientes } from '../services/patients.service'
import type { InsuranceGuide } from '../types/guia'
import type { Patient } from '../types/paciente'
import type { HealthPlan } from '../types/planoSaude'
import type { HealthProfessional } from '../types/profissional'
import { adicionarDiasISO, statusPrazoGuia } from '../utils/dataISO'

function prazoDoPlano(guia: InsuranceGuide, planos: HealthPlan[]): number | undefined {
  return (
    guia.healthPlan?.submissionDeadlineDays ??
    planos.find((item) => item.id === guia.healthPlanId)?.submissionDeadlineDays
  )
}

export function GuiasPage() {
  const navigate = useNavigate()
  const [guias, setGuias] = useState<InsuranceGuide[]>([])
  const [pacientes, setPacientes] = useState<Patient[]>([])
  const [planos, setPlanos] = useState<HealthPlan[]>([])
  const [profissionais, setProfissionais] = useState<HealthProfessional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editando, setEditando] = useState<InsuranceGuide | null>(null)
  const [patientIdEdicao, setPatientIdEdicao] = useState<number | ''>('')
  const [healthPlanIdEdicao, setHealthPlanIdEdicao] = useState<number | ''>('')
  const [healthProfessionalIdEdicao, setHealthProfessionalIdEdicao] = useState<number | ''>('')
  const [specialtyIdEdicao, setSpecialtyIdEdicao] = useState<number | ''>('')
  const [quantityEdicao, setQuantityEdicao] = useState('1')
  const [startDateEdicao, setStartDateEdicao] = useState('')
  const [expirationDateEdicao, setExpirationDateEdicao] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [faturando, setFaturando] = useState<InsuranceGuide | null>(null)
  const [savingFaturar, setSavingFaturar] = useState(false)
  const [filtroPlanoId, setFiltroPlanoId] = useState<number | ''>('')
  const [filtroPertoVencer, setFiltroPertoVencer] = useState(false)
  const [filtroMostrarFaturadas, setFiltroMostrarFaturadas] = useState(false)

  const profissionaisEdicao = useMemo(() => {
    return profissionais.filter(
      (item) => item.isActive || item.id === healthProfessionalIdEdicao,
    )
  }, [profissionais, healthProfessionalIdEdicao])

  const especialidadesDoProfissional = useMemo(() => {
    const profissional = profissionais.find((item) => item.id === healthProfessionalIdEdicao)
    return profissional?.specialties ?? []
  }, [profissionais, healthProfessionalIdEdicao])

  const prazoPlano =
    healthPlanIdEdicao === ''
      ? undefined
      : planos.find((item) => item.id === healthPlanIdEdicao)?.submissionDeadlineDays

  function recalcularValidade(startDate: string, prazo: number | undefined) {
    if (prazo == null || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return
    setExpirationDateEdicao(adicionarDiasISO(startDate, prazo))
  }

  function abrirEdicao(guia: InsuranceGuide) {
    const prazo = prazoDoPlano(guia, planos)
    setEditando(guia)
    setPatientIdEdicao(guia.patientId)
    setHealthPlanIdEdicao(guia.healthPlanId)
    setHealthProfessionalIdEdicao(guia.healthProfessionalId)
    setSpecialtyIdEdicao(guia.specialtyId)
    setQuantityEdicao(String(guia.quantity))
    setExpirationDateEdicao(guia.expirationDate)
    setStartDateEdicao(prazo != null ? adicionarDiasISO(guia.expirationDate, -prazo) : '')
  }

  function fecharEdicao() {
    setEditando(null)
    setPatientIdEdicao('')
    setHealthPlanIdEdicao('')
    setHealthProfessionalIdEdicao('')
    setSpecialtyIdEdicao('')
    setQuantityEdicao('1')
    setStartDateEdicao('')
    setExpirationDateEdicao('')
  }

  async function salvarEdicao() {
    if (
      !editando ||
      patientIdEdicao === '' ||
      healthPlanIdEdicao === '' ||
      healthProfessionalIdEdicao === '' ||
      specialtyIdEdicao === ''
    ) {
      return
    }
    const quantity = Number(quantityEdicao)
    if (!Number.isInteger(quantity) || quantity < 1) {
      setError('Quantidade deve ser um inteiro maior ou igual a 1.')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDateEdicao)) {
      setError('Informe a data de inicio.')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expirationDateEdicao)) {
      setError('Informe a data de validade.')
      return
    }
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarGuia(editando.id, {
        patientId: patientIdEdicao,
        healthPlanId: healthPlanIdEdicao,
        healthProfessionalId: healthProfessionalIdEdicao,
        specialtyId: specialtyIdEdicao,
        quantity,
        expirationDate: expirationDateEdicao,
      })
      setGuias((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
      fecharEdicao()
      setSuccess('Guia atualizada com sucesso.')
    } catch {
      setError('Nao foi possivel editar a guia.')
    } finally {
      setSavingEdit(false)
    }
  }

  function abrirFaturar(guia: InsuranceGuide) {
    setFaturando(guia)
  }

  function fecharFaturar() {
    if (savingFaturar) return
    setFaturando(null)
  }

  async function confirmarFaturar() {
    if (!faturando) return
    setSavingFaturar(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarGuia(faturando.id, { isBilled: true })
      setGuias((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
      setFaturando(null)
      setSuccess('Guia faturada com sucesso.')
    } catch {
      setError('Nao foi possivel faturar a guia.')
    } finally {
      setSavingFaturar(false)
    }
  }

  function alterarFiltroFaturadas(checked: boolean) {
    setFiltroMostrarFaturadas(checked)
  }

  const quantityNumero = Number(quantityEdicao)
  const quantityInvalida = !Number.isInteger(quantityNumero) || quantityNumero < 1
  const startDateInvalida = !/^\d{4}-\d{2}-\d{2}$/.test(startDateEdicao)
  const expirationInvalida = !/^\d{4}-\d{2}-\d{2}$/.test(expirationDateEdicao)
  const formInvalido =
    patientIdEdicao === '' ||
    healthPlanIdEdicao === '' ||
    healthProfessionalIdEdicao === '' ||
    specialtyIdEdicao === '' ||
    quantityInvalida ||
    startDateInvalida ||
    expirationInvalida

  const guiasFiltradas = useMemo(() => {
    return guias.filter((guia) => {
      if (!filtroMostrarFaturadas && guia.isBilled) {
        return false
      }
      if (filtroPlanoId !== '' && guia.healthPlanId !== filtroPlanoId) {
        return false
      }
      if (filtroPertoVencer && statusPrazoGuia(guia.expirationDate) !== 'proxima') {
        return false
      }
      return true
    })
  }, [guias, filtroPlanoId, filtroPertoVencer, filtroMostrarFaturadas])

  useEffect(() => {
    async function carregarDados() {
      setLoading(true)
      setError(null)
      try {
        const [guiasData, pacientesData, planosData, profissionaisData] = await Promise.all([
          listarGuias(),
          listarPacientes(),
          listarPlanosSaude(),
          listarProfissionais(),
        ])
        setGuias(guiasData)
        setPacientes(pacientesData)
        setPlanos(planosData)
        setProfissionais(profissionaisData)
      } catch {
        setError('Nao foi possivel carregar as guias.')
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
          Guias
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/guias/novo')}>
          Nova guia
        </Button>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando guias...</Typography>
        </Paper>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {!loading && !error ? (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} flexWrap="wrap">
          <Autocomplete
            options={planos}
            getOptionLabel={(plano) => plano.name}
            isOptionEqualToValue={(option, selected) => option.id === selected.id}
            value={planos.find((plano) => plano.id === filtroPlanoId) ?? null}
            onChange={(_, plano) => setFiltroPlanoId(plano?.id ?? '')}
            sx={{ minWidth: { xs: '100%', md: 280 } }}
            renderInput={(params) => (
              <TextField {...params} label="Plano de saude" size="small" placeholder="Todos" />
            )}
          />
          <FormControlLabel
            control={
              <Switch
                checked={filtroPertoVencer}
                onChange={(_, checked) => setFiltroPertoVencer(checked)}
              />
            }
            label="Perto de vencer (7 dias)"
          />
          <FormControlLabel
            control={
              <Switch
                checked={filtroMostrarFaturadas}
                onChange={(_, checked) => alterarFiltroFaturadas(checked)}
              />
            }
            label="Mostrar faturadas"
          />
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ ml: { md: 'auto' } }}>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: 'success.light', borderRadius: 0.5 }} />
              Faturada
            </Typography>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: 'warning.light', borderRadius: 0.5 }} />
              Faltam ate 7 dias
            </Typography>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: 'error.light', borderRadius: 0.5 }} />
              Ultimo dia de validade
            </Typography>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: 'grey.300', borderRadius: 0.5 }} />
              Vencida
            </Typography>
          </Stack>
        </Stack>
      ) : null}

      {!loading && !error && guias.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhuma guia encontrada.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && guias.length > 0 && guiasFiltradas.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhuma guia encontrada para os filtros selecionados.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && guiasFiltradas.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <GuiasTable guias={guiasFiltradas} onEditar={abrirEdicao} onFaturar={abrirFaturar} />
        </Paper>
      ) : null}

      <Dialog open={Boolean(editando)} onClose={fecharEdicao} fullWidth maxWidth="sm">
        <DialogTitle>Editar guia</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <Autocomplete
              options={pacientes}
              getOptionLabel={(paciente) => paciente.name}
              isOptionEqualToValue={(option, selected) => option.id === selected.id}
              value={pacientes.find((paciente) => paciente.id === patientIdEdicao) ?? null}
              onChange={(_, paciente) => setPatientIdEdicao(paciente?.id ?? '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Paciente"
                  error={patientIdEdicao === ''}
                  helperText={patientIdEdicao === '' ? 'Selecione o paciente' : ' '}
                />
              )}
            />
            <Autocomplete
              options={planos}
              getOptionLabel={(plano) => plano.name}
              isOptionEqualToValue={(option, selected) => option.id === selected.id}
              value={planos.find((plano) => plano.id === healthPlanIdEdicao) ?? null}
              onChange={(_, plano) => {
                setHealthPlanIdEdicao(plano?.id ?? '')
                if (plano) {
                  recalcularValidade(startDateEdicao, plano.submissionDeadlineDays)
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Plano de saude"
                  error={healthPlanIdEdicao === ''}
                  helperText={healthPlanIdEdicao === '' ? 'Selecione o plano de saude' : ' '}
                />
              )}
            />
            <Autocomplete
              options={profissionaisEdicao}
              getOptionLabel={(profissional) => profissional.name}
              isOptionEqualToValue={(option, selected) => option.id === selected.id}
              value={
                profissionaisEdicao.find((profissional) => profissional.id === healthProfessionalIdEdicao) ??
                null
              }
              onChange={(_, profissional) => {
                const nextId = profissional?.id ?? ''
                setHealthProfessionalIdEdicao(nextId)
                const ids = profissional?.specialties.map((item) => item.specialtyId) ?? []
                if (specialtyIdEdicao !== '' && !ids.includes(specialtyIdEdicao)) {
                  setSpecialtyIdEdicao('')
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Profissional"
                  error={healthProfessionalIdEdicao === ''}
                  helperText={healthProfessionalIdEdicao === '' ? 'Selecione o profissional' : ' '}
                />
              )}
            />
            <TextField
              select
              label="Especialidade"
              value={specialtyIdEdicao}
              onChange={(event) => setSpecialtyIdEdicao(Number(event.target.value))}
              error={specialtyIdEdicao === ''}
              helperText={
                specialtyIdEdicao === ''
                  ? healthProfessionalIdEdicao === ''
                    ? 'Selecione o profissional para listar as especialidades'
                    : 'Selecione a especialidade'
                  : ' '
              }
              disabled={especialidadesDoProfissional.length === 0}
            >
              <MenuItem value="" disabled>
                Selecione uma especialidade
              </MenuItem>
              {especialidadesDoProfissional.map((item) => (
                <MenuItem key={item.specialtyId} value={item.specialtyId}>
                  {item.specialty?.name ?? `Especialidade ${item.specialtyId}`}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Quantidade"
              type="number"
              inputProps={{ min: 1, step: 1 }}
              value={quantityEdicao}
              onChange={(event) => setQuantityEdicao(event.target.value)}
              error={quantityInvalida}
              helperText={quantityInvalida ? 'Informe um inteiro maior ou igual a 1' : ' '}
            />
            <TextField
              label="Data de inicio"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={startDateEdicao}
              onChange={(event) => {
                const next = event.target.value
                setStartDateEdicao(next)
                recalcularValidade(next, prazoPlano)
              }}
              error={startDateInvalida}
              helperText={startDateInvalida ? 'Informe a data de inicio' : ' '}
            />
            <TextField
              label="Data de validade"
              type="date"
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
              value={expirationDateEdicao}
              error={expirationInvalida}
              helperText={
                expirationInvalida
                  ? 'Informe a data de validade'
                  : prazoPlano != null
                    ? `Calculada com base na data de inicio + prazo do plano (${prazoPlano} dias).`
                    : ' '
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharEdicao}>Cancelar</Button>
          <Button onClick={salvarEdicao} variant="contained" disabled={savingEdit || formInvalido}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(faturando)} onClose={fecharFaturar} fullWidth maxWidth="sm">
        <DialogTitle>Faturar guia</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 0.5 }}>
            Confirma o faturamento desta guia?
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharFaturar} disabled={savingFaturar}>
            Cancelar
          </Button>
          <Button
            onClick={() => void confirmarFaturar()}
            variant="contained"
            disabled={savingFaturar}
          >
            {savingFaturar ? 'Faturando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
