import { Alert, CircularProgress, Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import type { GuiaFormValues } from '../schemas/guia.schema'
import { listarPlanosSaude } from '../services/health-plans.service'
import { buscarGuia, criarGuia } from '../services/insurance-guides.service'
import type { InsuranceGuide } from '../types/guia'
import type { Patient } from '../types/paciente'
import type { HealthPlan } from '../types/planoSaude'
import type { HealthProfessional } from '../types/profissional'
import { mensagemErroApi } from '../utils/apiError'
import { hojeLocalISO } from '../utils/dataISO'
import { GuiaForm } from './GuiaForm'

interface NovaGuiaDialogProps {
  open: boolean
  patientId: number
  healthProfessionalId: number
  pacientes: Patient[]
  profissionais: HealthProfessional[]
  onClose: () => void
  onCreated: (guia: InsuranceGuide) => void
}

export function NovaGuiaDialog({
  open,
  patientId,
  healthProfessionalId,
  pacientes,
  profissionais,
  onClose,
  onCreated,
}: NovaGuiaDialogProps) {
  const [planos, setPlanos] = useState<HealthPlan[]>([])
  const [loadingDados, setLoadingDados] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    async function carregar() {
      setLoadingDados(true)
      setError(null)
      try {
        setPlanos(await listarPlanosSaude())
      } catch (err) {
        setError(mensagemErroApi(err, 'Não foi possível carregar os planos de saúde.'))
        setPlanos([])
      } finally {
        setLoadingDados(false)
      }
    }
    void carregar()
  }, [open])

  async function onSubmit(values: GuiaFormValues) {
    setSaving(true)
    setError(null)
    try {
      const criada = await criarGuia({
        healthPlanId: values.healthPlanId,
        patientId: values.patientId,
        healthProfessionalId: values.healthProfessionalId,
        authorizationDate: values.authorizationDate,
        expirationDate: values.expirationDate,
        status: values.status,
        ...(values.guideNumber ? { guideNumber: values.guideNumber } : {}),
        procedures: values.procedures.map((item) => ({
          procedureId: item.procedureId,
          authorizedQuantity: item.authorizedQuantity,
          value: item.value,
        })),
      })
      const completa =
        criada.procedures.length > 0 ? criada : await buscarGuia(criada.id).catch(() => criada)
      onCreated(completa)
      onClose()
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível cadastrar a guia.'))
    } finally {
      setSaving(false)
    }
  }

  const faltamPlanos = !loadingDados && planos.length === 0 && error == null

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Nova guia</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {loadingDados ? (
            <Stack direction="row" alignItems="center" gap={1.5}>
              <CircularProgress size={20} />
              <Typography>Carregando dados...</Typography>
            </Stack>
          ) : null}
          {faltamPlanos ? (
            <Alert severity="warning">Cadastre um plano de saúde antes de criar uma guia.</Alert>
          ) : null}
          {open && !loadingDados && !faltamPlanos ? (
            <GuiaForm
              key={`${patientId}-${healthProfessionalId}`}
              defaultValues={{
                healthPlanId: undefined,
                patientId,
                healthProfessionalId,
                status: 'pending',
                guideNumber: '',
                authorizationDate: hojeLocalISO(),
                expirationDate: '',
                procedures: [{ procedureId: undefined, authorizedQuantity: 1, value: undefined }],
              }}
              pacientes={pacientes}
              profissionais={profissionais}
              planos={planos}
              loading={saving}
              submitLabel="Cadastrar guia"
              patientLocked
              professionalLocked
              onSubmit={(values) => void onSubmit(values)}
              onCancel={saving ? undefined : onClose}
            />
          ) : null}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
