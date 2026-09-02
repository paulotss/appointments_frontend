import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useForm, type DefaultValues } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { ImportarGuiaForm } from '../components/ImportarGuiaForm'
import {
  importarGuiaSchema,
  type ImportarGuiaFormInput,
  type ImportarGuiaFormValues,
} from '../schemas/importarGuia.schema'
import { analisarGuia, confirmarImportacaoGuia, recruzarGuia } from '../services/guide-imports.service'
import { listarPlanosSaude } from '../services/health-plans.service'
import type { GuideImportAnalysis } from '../types/guideImport'
import type { HealthPlan } from '../types/planoSaude'
import { mensagemConflitoNumeroGuia, mensagemErroApi } from '../utils/apiError'
import { adicionarDiasISO, hojeLocalISO } from '../utils/dataISO'

function aplicarAnalise(analise: GuideImportAnalysis): DefaultValues<ImportarGuiaFormInput> {
  const plano = analise.healthPlan
  const autorizacao =
    analise.extracted.guide.authorizationDate ||
    analise.extracted.guide.attendanceDate ||
    hojeLocalISO()
  const validade =
    analise.extracted.guide.passwordExpirationDate ||
    (plano ? adicionarDiasISO(autorizacao, plano.submissionDeadlineDays) : '')
  const cardExpiration =
    analise.extracted.patient.cardExpirationDate ||
    analise.extracted.guide.passwordExpirationDate ||
    ''
  const existingCard = plano
    ? analise.patient?.insuranceCards.find((card) => card.healthPlanId === plano.id)
    : undefined

  return {
    healthPlanId: plano?.id,
    healthProfessionalId: analise.healthProfessional?.id,
    procedures:
      analise.procedures.length > 0
        ? analise.procedures.map((item) => ({
            procedureId: item.match?.id,
            authorizedQuantity: item.extracted.authorizedQuantity ?? item.extracted.requestedQuantity ?? 1,
          }))
        : [{ procedureId: undefined, authorizedQuantity: 1 }],
    patientMode: analise.patient ? 'existing' : 'create',
    patientId: analise.patient?.id ?? null,
    patientName: analise.extracted.patient.name ?? analise.patient?.name ?? '',
    phone: analise.patient?.phone ?? '',
    email: analise.patient?.email ?? '',
    birthDate: analise.patient?.birthDate ?? '',
    cpf: analise.patient?.cpf ?? '',
    cardNumber: existingCard?.cardNumber ?? analise.extracted.patient.cardNumber ?? '',
    cardExpirationDate: existingCard?.expirationDate ?? cardExpiration,
    guideNumber:
      analise.extracted.guide.operatorGuideNumber ?? analise.extracted.guide.providerGuideNumber ?? '',
    authorizationDate: autorizacao,
    expirationDate: validade,
  }
}

export function ImportarGuiaPage() {
  const navigate = useNavigate()
  const [planos, setPlanos] = useState<HealthPlan[]>([])
  const [loadingDados, setLoadingDados] = useState(true)
  const [loading, setLoading] = useState(false)
  const [analisando, setAnalisando] = useState(false)
  const [recruzando, setRecruzando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [analise, setAnalise] = useState<GuideImportAnalysis | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    trigger,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<ImportarGuiaFormInput, unknown, ImportarGuiaFormValues>({
    resolver: zodResolver(importarGuiaSchema),
    defaultValues: {
      healthPlanId: undefined,
      healthProfessionalId: undefined,
      procedures: [],
      patientMode: 'create',
      patientId: null,
      patientName: '',
      phone: '',
      email: '',
      birthDate: '',
      cpf: '',
      cardNumber: '',
      cardExpirationDate: '',
      guideNumber: '',
      authorizationDate: hojeLocalISO(),
      expirationDate: '',
    },
  })

  useEffect(() => {
    let ativo = true
    void listarPlanosSaude()
      .then((lista) => {
        if (ativo) setPlanos(lista)
      })
      .catch((err) => {
        if (ativo) setError(mensagemErroApi(err, 'Não foi possível carregar os planos de saúde.'))
      })
      .finally(() => {
        if (ativo) setLoadingDados(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function selecionarArquivo(file: File | null) {
    setArquivo(file)
    setAnalise(null)
    setError(null)
    setPreviewUrl((atual) => {
      if (atual) URL.revokeObjectURL(atual)
      if (file && file.type.startsWith('image/')) return URL.createObjectURL(file)
      return null
    })
  }

  async function analisar(): Promise<boolean> {
    if (!arquivo) return false
    setAnalisando(true)
    setError(null)
    try {
      const resultado = await analisarGuia(arquivo)
      setAnalise(resultado)
      reset(aplicarAnalise(resultado))
      return true
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível analisar a guia.'))
      return false
    } finally {
      setAnalisando(false)
    }
  }

  async function recruzar() {
    if (!analise) return
    setRecruzando(true)
    setError(null)
    try {
      const planosAtualizados = await listarPlanosSaude()
      setPlanos(planosAtualizados)
      const resultado = await recruzarGuia(analise.extracted)
      setAnalise(resultado)
      reset(aplicarAnalise(resultado))
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível recruzar os cadastros.'))
    } finally {
      setRecruzando(false)
    }
  }

  async function onSubmit(values: ImportarGuiaFormValues) {
    setLoading(true)
    setError(null)
    try {
      const paciente =
        values.patientMode === 'existing'
          ? {
              mode: 'existing' as const,
              patientId: values.patientId!,
              cardNumber: values.cardNumber,
              cardExpirationDate: values.cardExpirationDate,
            }
          : {
              mode: 'create' as const,
              name: values.patientName,
              phone: values.phone,
              ...(values.email?.trim() ? { email: values.email.trim() } : {}),
              ...(values.birthDate ? { birthDate: values.birthDate } : {}),
              ...(values.cpf?.trim() ? { cpf: values.cpf.trim() } : {}),
              cardNumber: values.cardNumber,
              cardExpirationDate: values.cardExpirationDate,
            }

      await confirmarImportacaoGuia({
        healthPlanId: values.healthPlanId,
        healthProfessionalId: values.healthProfessionalId,
        procedures: values.procedures,
        patient: paciente,
        guideNumber: values.guideNumber,
        authorizationDate: values.authorizationDate,
        expirationDate: values.expirationDate,
      })
      navigate('/guias', { replace: true })
    } catch (err) {
      const conflito = mensagemConflitoNumeroGuia(err)
      setError(conflito ?? mensagemErroApi(err, 'Não foi possível cadastrar a guia.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Importar guia
        </Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/guias')}>
          Voltar para tabela
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loadingDados ? (
        <Stack direction="row" alignItems="center" gap={1.5}>
          <CircularProgress size={20} />
          <Typography>Carregando dados...</Typography>
        </Stack>
      ) : (
        <Stack component="form" onSubmit={handleSubmit(onSubmit)}>
          <ImportarGuiaForm
            register={register}
            control={control}
            errors={errors}
            trigger={trigger}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            planos={planos}
            analise={analise}
            arquivo={arquivo}
            previewUrl={previewUrl}
            onSelecionarArquivo={selecionarArquivo}
            onAnalisar={analisar}
            onRecruzar={recruzar}
            analisando={analisando}
            recruzando={recruzando}
            loading={loading}
            submitLabel="Cadastrar guia"
          />
        </Stack>
      )}
    </Stack>
  )
}
