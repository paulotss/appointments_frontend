import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Box, Button, CircularProgress, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PacienteArquivosSecao } from '../components/PacienteArquivosSecao'
import { PacienteCartaoSecao } from '../components/PacienteCartaoSecao'
import { PacienteForm } from '../components/PacienteForm'
import { PacientePacotesSecao } from '../components/PacientePacotesSecao'
import { PacienteProntuarioSecao } from '../components/PacienteProntuarioSecao'
import type { PacienteFormValues } from '../schemas/paciente.schema'
import { listarPlanosSaude } from '../services/health-plans.service'
import { sincronizarCarteirinhas } from '../services/insurance-cards.service'
import { getUserRole } from '../services/authStorage'
import { atualizarPaciente, buscarPaciente } from '../services/patients.service'
import type { Patient } from '../types/paciente'
import type { HealthPlan } from '../types/planoSaude'
import { mensagemErroApi } from '../utils/apiError'

const FORM_ID = 'editar-paciente'

type AbaPaciente = 'dados' | 'arquivos' | 'prontuario'

export function EditarPacientePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const pacienteId = Number(id)

  const [paciente, setPaciente] = useState<Patient | null>(null)
  const [planos, setPlanos] = useState<HealthPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aba, setAba] = useState<AbaPaciente>('dados')
  const podeProntuario = getUserRole() === 'PROFESSIONAL'

  useEffect(() => {
    if (!Number.isFinite(pacienteId) || pacienteId <= 0) {
      setError('Paciente inválido.')
      setLoading(false)
      return
    }

    async function carregar() {
      setLoading(true)
      setError(null)
      try {
        const [pacienteCarregado, planosCarregados] = await Promise.all([
          buscarPaciente(pacienteId),
          listarPlanosSaude().catch(() => [] as HealthPlan[]),
        ])
        setPaciente(pacienteCarregado)
        setPlanos(planosCarregados)
      } catch (err) {
        setPaciente(null)
        setError(mensagemErroApi(err, 'Não foi possível carregar o paciente.'))
      } finally {
        setLoading(false)
      }
    }

    void carregar()
  }, [pacienteId])

  function voltar() {
    if (saving) return
    navigate('/pacientes')
  }

  async function salvar(values: PacienteFormValues) {
    if (!paciente) return
    setSaving(true)
    setError(null)
    try {
      await atualizarPaciente(paciente.id, {
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email,
        birthDate: values.birthDate,
        cpf: values.cpf,
      })
      await sincronizarCarteirinhas(
        paciente.id,
        paciente.insuranceCards,
        values.insuranceCards.map((item) => ({
          id: item.cardId,
          healthPlanId: item.healthPlanId,
          cardNumber: item.cardNumber,
          expirationDate: item.expirationDate || null,
        })),
      )
      navigate('/pacientes', {
        replace: true,
        state: { success: 'Paciente atualizado com sucesso.' },
      })
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível editar o paciente.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={700}>
            Paciente
          </Typography>
          {paciente ? (
            <Typography variant="body2" color="text.secondary">
              {paciente.name}
            </Typography>
          ) : null}
        </Stack>
        <Stack direction="row" spacing={1}>
          {aba === 'dados' ? (
            <Button variant="contained" type="submit" form={FORM_ID} disabled={saving || loading || !paciente}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          ) : null}
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={voltar} disabled={saving}>
            Voltar
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Stack direction="row" alignItems="center" gap={1.5}>
          <CircularProgress size={20} />
          <Typography>Carregando paciente...</Typography>
        </Stack>
      ) : null}

      {!loading && paciente ? (
        <Stack spacing={2}>
          <Tabs
            value={aba}
            onChange={(_, value: AbaPaciente) => setAba(value)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab value="dados" label="Dados" />
            <Tab value="arquivos" label="Arquivos" />
            {podeProntuario ? <Tab value="prontuario" label="Prontuário" /> : null}
          </Tabs>

          <Box hidden={aba !== 'dados'}>
            <Stack spacing={3}>
              <PacienteForm
                key={paciente.id}
                formId={FORM_ID}
                hideActions
                defaultValues={{
                  name: paciente.name,
                  phone: paciente.phone,
                  email: paciente.email ?? '',
                  birthDate: paciente.birthDate ?? '',
                  cpf: paciente.cpf ?? '',
                  insuranceCards: paciente.insuranceCards.map((item) => ({
                    cardId: item.id,
                    healthPlanId: item.healthPlanId,
                    cardNumber: item.cardNumber,
                    expirationDate: item.expirationDate,
                  })),
                }}
                planos={planos}
                loading={saving}
                submitLabel="Salvar"
                onSubmit={(values) => void salvar(values)}
              />
              <PacientePacotesSecao key={`pacotes-${paciente.id}`} patientId={paciente.id} />
              <PacienteCartaoSecao key={`cartao-${paciente.id}`} patientId={paciente.id} />
            </Stack>
          </Box>

          {aba === 'arquivos' ? <PacienteArquivosSecao patient={paciente} /> : null}
          {aba === 'prontuario' && podeProntuario ? (
            <PacienteProntuarioSecao patientId={paciente.id} />
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  )
}
