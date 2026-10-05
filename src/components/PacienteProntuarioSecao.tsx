import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { listarAgendamentosClinicos } from '../services/clinical-appointments.service'
import {
  atualizarEvolucao,
  buscarFichaClinica,
  criarEvolucao,
  listarEvolucoes,
  salvarFichaClinica,
} from '../services/clinical-records.service'
import { getLoggedUser } from '../services/authStorage'
import type { ClinicalAppointment } from '../types/agendamentoClinico'
import type { ClinicalChart, ClinicalEvolution } from '../types/prontuario'
import { mensagemErroApi } from '../utils/apiError'
import { formatarDataHoraISO } from '../utils/dataISO'

interface PacienteProntuarioSecaoProps {
  patientId: number
}

interface EvolucaoForm {
  occurredAt: string
  clinicalAppointmentId: string
  subjective: string
  objective: string
  assessment: string
  plan: string
}

function agoraLocal(): string {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function paraDatetimeLocal(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return agoraLocal()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formVazio(): EvolucaoForm {
  return {
    occurredAt: agoraLocal(),
    clinicalAppointmentId: '',
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  }
}

function formatarConselho(profissional: ClinicalEvolution['healthProfessional']): string {
  const uf = profissional.councilUf ? `/${profissional.councilUf}` : ''
  return `${profissional.councilType} ${profissional.councilNumber}${uf}`
}

function texto(value: string | null | undefined): string {
  return value ?? ''
}

export function PacienteProntuarioSecao({ patientId }: PacienteProntuarioSecaoProps) {
  const profissionalId = getLoggedUser()?.healthProfessionalId ?? null
  const [ficha, setFicha] = useState<ClinicalChart | null>(null)
  const [alergias, setAlergias] = useState('')
  const [cronicas, setCronicas] = useState('')
  const [medicamentos, setMedicamentos] = useState('')
  const [pessoais, setPessoais] = useState('')
  const [familiares, setFamiliares] = useState('')
  const [habitos, setHabitos] = useState('')
  const [evolucoes, setEvolucoes] = useState<ClinicalEvolution[]>([])
  const [agendamentos, setAgendamentos] = useState<ClinicalAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [savingFicha, setSavingFicha] = useState(false)
  const [savingEvolucao, setSavingEvolucao] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dialogo, setDialogo] = useState<ClinicalEvolution | 'nova' | null>(null)
  const [form, setForm] = useState<EvolucaoForm>(formVazio())

  const aplicarFicha = useCallback((chart: ClinicalChart) => {
    setFicha(chart)
    setAlergias(texto(chart.allergies))
    setCronicas(texto(chart.chronicConditions))
    setMedicamentos(texto(chart.currentMedications))
    setPessoais(texto(chart.personalHistory))
    setFamiliares(texto(chart.familyHistory))
    setHabitos(texto(chart.habits))
  }, [])

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [chart, notes, appointments] = await Promise.all([
        buscarFichaClinica(patientId),
        listarEvolucoes(patientId),
        listarAgendamentosClinicos({ patientId }).catch(() => [] as ClinicalAppointment[]),
      ])
      aplicarFicha(chart)
      setEvolucoes(notes)
      setAgendamentos(appointments)
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível carregar o prontuário.'))
    } finally {
      setLoading(false)
    }
  }, [aplicarFicha, patientId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function salvarFicha() {
    setSavingFicha(true)
    setError(null)
    setSuccess(null)
    try {
      const chart = await salvarFichaClinica(patientId, {
        allergies: alergias,
        chronicConditions: cronicas,
        currentMedications: medicamentos,
        personalHistory: pessoais,
        familyHistory: familiares,
        habits: habitos,
      })
      aplicarFicha(chart)
      setSuccess('Ficha clínica salva.')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível salvar a ficha clínica.'))
    } finally {
      setSavingFicha(false)
    }
  }

  function abrirNova() {
    setForm(formVazio())
    setDialogo('nova')
    setError(null)
  }

  function abrirEdicao(evolucao: ClinicalEvolution) {
    setForm({
      occurredAt: paraDatetimeLocal(evolucao.occurredAt),
      clinicalAppointmentId: evolucao.clinicalAppointmentId ? String(evolucao.clinicalAppointmentId) : '',
      subjective: evolucao.subjective,
      objective: evolucao.objective,
      assessment: evolucao.assessment,
      plan: evolucao.plan,
    })
    setDialogo(evolucao)
    setError(null)
  }

  async function salvarEvolucao() {
    if (!form.subjective.trim() || !form.objective.trim() || !form.assessment.trim() || !form.plan.trim()) {
      setError('Preencha subjetivo, objetivo, avaliação e plano.')
      return
    }
    const occurred = new Date(form.occurredAt)
    if (Number.isNaN(occurred.getTime())) {
      setError('Informe a data e a hora do atendimento.')
      return
    }
    const payload = {
      occurredAt: occurred.toISOString(),
      clinicalAppointmentId: form.clinicalAppointmentId ? Number(form.clinicalAppointmentId) : null,
      subjective: form.subjective.trim(),
      objective: form.objective.trim(),
      assessment: form.assessment.trim(),
      plan: form.plan.trim(),
    }
    setSavingEvolucao(true)
    setError(null)
    setSuccess(null)
    try {
      if (dialogo && dialogo !== 'nova') {
        await atualizarEvolucao(patientId, dialogo.id, payload)
      } else {
        await criarEvolucao(patientId, payload)
      }
      setDialogo(null)
      const notes = await listarEvolucoes(patientId)
      setEvolucoes(notes)
      setSuccess(dialogo && dialogo !== 'nova' ? 'Evolução atualizada.' : 'Evolução registrada.')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível salvar a evolução.'))
    } finally {
      setSavingEvolucao(false)
    }
  }

  if (loading) {
    return (
      <Stack direction="row" alignItems="center" gap={1.5}>
        <CircularProgress size={20} />
        <Typography>Carregando prontuário...</Typography>
      </Stack>
    )
  }

  return (
    <Stack spacing={3}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Ficha clínica</Typography>
            {ficha?.updatedAt ? (
              <Typography variant="caption" color="text.secondary">
                Atualizada em {formatarDataHoraISO(ficha.updatedAt)}
              </Typography>
            ) : null}
          </Stack>
          <TextField
            label="Alergias"
            value={alergias}
            onChange={(event) => setAlergias(event.target.value)}
            multiline
            minRows={2}
          />
          <TextField
            label="Condições crônicas"
            value={cronicas}
            onChange={(event) => setCronicas(event.target.value)}
            multiline
            minRows={2}
          />
          <TextField
            label="Medicamentos em uso"
            value={medicamentos}
            onChange={(event) => setMedicamentos(event.target.value)}
            multiline
            minRows={2}
          />
          <TextField
            label="Antecedentes pessoais"
            value={pessoais}
            onChange={(event) => setPessoais(event.target.value)}
            multiline
            minRows={2}
          />
          <TextField
            label="Antecedentes familiares"
            value={familiares}
            onChange={(event) => setFamiliares(event.target.value)}
            multiline
            minRows={2}
          />
          <TextField
            label="Hábitos"
            value={habitos}
            onChange={(event) => setHabitos(event.target.value)}
            multiline
            minRows={2}
          />
          <Button
            variant="contained"
            onClick={() => void salvarFicha()}
            disabled={savingFicha}
            sx={{ alignSelf: 'flex-start' }}
          >
            {savingFicha ? 'Salvando...' : 'Salvar ficha'}
          </Button>
        </Stack>
      </Paper>

      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Evoluções</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNova}>
            Nova evolução
          </Button>
        </Stack>
        {evolucoes.length === 0 ? (
          <Typography color="text.secondary">Nenhuma evolução registrada.</Typography>
        ) : null}
        {evolucoes.map((evolucao) => {
          const podeEditar = profissionalId != null && evolucao.healthProfessionalId === profissionalId
          return (
            <Paper key={evolucao.id} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Stack spacing={0.25}>
                    <Typography fontWeight={700}>{formatarDataHoraISO(evolucao.occurredAt)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {evolucao.healthProfessional.name} — {formatarConselho(evolucao.healthProfessional)}
                    </Typography>
                    {evolucao.clinicalAppointment ? (
                      <Typography variant="caption" color="text.secondary">
                        Agendamento {formatarDataHoraISO(evolucao.clinicalAppointment.scheduledAt)}
                      </Typography>
                    ) : null}
                  </Stack>
                  {podeEditar ? (
                    <IconButton aria-label="Corrigir evolução" onClick={() => abrirEdicao(evolucao)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                </Stack>
                <Typography variant="body2">
                  <strong>Subjetivo: </strong>
                  {evolucao.subjective}
                </Typography>
                <Typography variant="body2">
                  <strong>Objetivo: </strong>
                  {evolucao.objective}
                </Typography>
                <Typography variant="body2">
                  <strong>Avaliação: </strong>
                  {evolucao.assessment}
                </Typography>
                <Typography variant="body2">
                  <strong>Plano: </strong>
                  {evolucao.plan}
                </Typography>
              </Stack>
            </Paper>
          )
        })}
      </Stack>

      <Dialog open={dialogo != null} onClose={() => !savingEvolucao && setDialogo(null)} fullWidth maxWidth="sm">
        <DialogTitle>{dialogo && dialogo !== 'nova' ? 'Corrigir evolução' : 'Nova evolução'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Data e hora"
              type="datetime-local"
              value={form.occurredAt}
              onChange={(event) => setForm((atual) => ({ ...atual, occurredAt: event.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              select
              label="Agendamento"
              value={form.clinicalAppointmentId}
              onChange={(event) =>
                setForm((atual) => ({ ...atual, clinicalAppointmentId: event.target.value }))
              }
            >
              <MenuItem value="">Nenhum</MenuItem>
              {form.clinicalAppointmentId &&
              !agendamentos.some((item) => String(item.id) === form.clinicalAppointmentId) ? (
                <MenuItem value={form.clinicalAppointmentId}>
                  Agendamento #{form.clinicalAppointmentId}
                </MenuItem>
              ) : null}
              {agendamentos.map((item) => (
                <MenuItem key={item.id} value={String(item.id)}>
                  {formatarDataHoraISO(item.scheduledAt)}
                  {item.healthProfessional?.name ? ` — ${item.healthProfessional.name}` : ''}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Subjetivo"
              value={form.subjective}
              onChange={(event) => setForm((atual) => ({ ...atual, subjective: event.target.value }))}
              multiline
              minRows={3}
              helperText="Relato do paciente"
            />
            <TextField
              label="Objetivo"
              value={form.objective}
              onChange={(event) => setForm((atual) => ({ ...atual, objective: event.target.value }))}
              multiline
              minRows={3}
              helperText="Exame físico, sinais e resultados"
            />
            <TextField
              label="Avaliação"
              value={form.assessment}
              onChange={(event) => setForm((atual) => ({ ...atual, assessment: event.target.value }))}
              multiline
              minRows={3}
              helperText="Hipótese ou diagnóstico"
            />
            <TextField
              label="Plano"
              value={form.plan}
              onChange={(event) => setForm((atual) => ({ ...atual, plan: event.target.value }))}
              multiline
              minRows={3}
              helperText="Conduta, exames, orientações e retorno"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogo(null)} disabled={savingEvolucao}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void salvarEvolucao()} disabled={savingEvolucao}>
            {savingEvolucao ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
