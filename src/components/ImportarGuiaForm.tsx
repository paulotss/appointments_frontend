import {
  Alert,
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Link,
  Radio,
  RadioGroup,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormGetValues,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormTrigger,
  type UseFormWatch,
} from 'react-hook-form'
import { Link as RouterLink } from 'react-router-dom'
import type { ImportarGuiaFormInput } from '../schemas/importarGuia.schema'
import { buscarPaciente } from '../services/patients.service'
import { listarProcedimentos } from '../services/procedures.service'
import type { GuideImportAnalysis } from '../types/guideImport'
import type { Patient } from '../types/paciente'
import type { HealthPlan } from '../types/planoSaude'
import { tissCodeDoPlano, type Procedure } from '../types/procedimento'
import type { HealthProfessional } from '../types/profissional'
import { TISS_GUIDE_TYPE_LABELS } from '../types/tiss'
import { mensagemErroApi } from '../utils/apiError'
import { formatarDataISO } from '../utils/dataISO'
import { CampoData } from './CampoData'
import { PacienteBuscaAutocomplete } from './PacienteBuscaAutocomplete'
import { ProfissionalBuscaAutocomplete } from './ProfissionalBuscaAutocomplete'

const PASSOS = ['Documento', 'Conferência', 'Paciente', 'Guia'] as const
const PASSO_CONTENT_SX = { width: '100%', maxWidth: 720 } as const

interface ImportarGuiaFormProps {
  register: UseFormRegister<ImportarGuiaFormInput>
  control: Control<ImportarGuiaFormInput>
  errors: FieldErrors<ImportarGuiaFormInput>
  trigger: UseFormTrigger<ImportarGuiaFormInput>
  setValue: UseFormSetValue<ImportarGuiaFormInput>
  watch: UseFormWatch<ImportarGuiaFormInput>
  getValues: UseFormGetValues<ImportarGuiaFormInput>
  planos: HealthPlan[]
  analise: GuideImportAnalysis | null
  arquivo: File | null
  previewUrl: string | null
  onSelecionarArquivo: (file: File | null) => void
  onAnalisar: () => Promise<boolean>
  onRecruzar: () => Promise<void>
  analisando: boolean
  recruzando: boolean
  loading: boolean
  submitLabel: string
}

function textoOuAusente(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : 'não localizado na guia'
}

function rotuloProcedimento(procedimento: Procedure, healthPlanId: number | null): string {
  const codigo = healthPlanId != null ? tissCodeDoPlano(procedimento, healthPlanId) : undefined
  return codigo ? `${codigo} — ${procedimento.name}` : procedimento.name
}

function filtrarProcedimentosPorCodigo(
  options: Procedure[],
  state: { inputValue: string },
  healthPlanId: number | null,
): Procedure[] {
  const raw = state.inputValue.trim()
  if (!raw) return options
  const digits = raw.replace(/\D/g, '')
  const folded = raw.toLowerCase()
  return options.filter((procedimento) => {
    const codigo = (healthPlanId != null ? tissCodeDoPlano(procedimento, healthPlanId) : undefined) ?? ''
    if (digits && codigo.replace(/\D/g, '').includes(digits)) return true
    if (procedimento.name.toLowerCase().includes(folded)) return true
    return rotuloProcedimento(procedimento, healthPlanId).toLowerCase().includes(folded)
  })
}

function pacienteTemCarteirinha(paciente: Patient | null, healthPlanId: number | null): boolean {
  if (!paciente || healthPlanId == null) return false
  return paciente.insuranceCards.some((card) => card.healthPlanId === healthPlanId)
}

export function ImportarGuiaForm({
  register,
  control,
  errors,
  trigger,
  setValue,
  watch,
  getValues,
  planos,
  analise,
  arquivo,
  previewUrl,
  onSelecionarArquivo,
  onAnalisar,
  onRecruzar,
  analisando,
  recruzando,
  loading,
  submitLabel,
}: ImportarGuiaFormProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [procedimentosPlano, setProcedimentosPlano] = useState<Procedure[]>([])
  const [loadingProcedimentos, setLoadingProcedimentos] = useState(false)
  const [erroProcedimentos, setErroProcedimentos] = useState<string | null>(null)
  const [analiseAtual, setAnaliseAtual] = useState(analise)
  const [pacienteDetalhe, setPacienteDetalhe] = useState<Patient | null>(analise?.patient ?? null)
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<HealthProfessional | null>(
    analise?.healthProfessional ?? null,
  )

  if (analise !== analiseAtual) {
    setAnaliseAtual(analise)
    setPacienteDetalhe(analise?.patient ?? null)
    setProfissionalSelecionado(analise?.healthProfessional ?? null)
  }

  const healthPlanId = watch('healthPlanId')
  const procedures = watch('procedures')
  const patientMode = watch('patientMode')
  const patientId = watch('patientId')
  const patientName = watch('patientName')

  const planoSelecionado = useMemo(
    () => planos.find((plano) => plano.id === healthPlanId) ?? analise?.healthPlan ?? null,
    [analise?.healthPlan, healthPlanId, planos],
  )

  useEffect(() => {
    if (healthPlanId == null) return
    let ativo = true
    void (async () => {
      setLoadingProcedimentos(true)
      setErroProcedimentos(null)
      try {
        const lista = await listarProcedimentos({ healthPlanId })
        if (ativo) setProcedimentosPlano(lista)
      } catch (err) {
        if (ativo) {
          setErroProcedimentos(mensagemErroApi(err, 'Não foi possível carregar os procedimentos.'))
        }
      } finally {
        if (ativo) setLoadingProcedimentos(false)
      }
    })()
    return () => {
      ativo = false
    }
  }, [healthPlanId])

  useEffect(() => {
    if (patientMode !== 'existing' || patientId == null) return
    let ativo = true
    void buscarPaciente(patientId)
      .then((paciente) => {
        if (!ativo) return
        setPacienteDetalhe(paciente)
        const card =
          healthPlanId != null
            ? paciente.insuranceCards.find((item) => item.healthPlanId === healthPlanId)
            : undefined
        if (card) {
          setValue('cardNumber', card.cardNumber)
          setValue('cardExpirationDate', card.expirationDate)
        }
      })
      .catch(() => undefined)
    return () => {
      ativo = false
    }
  }, [healthPlanId, patientId, patientMode, setValue])

  useEffect(() => {
    if (!analise) return
    if ((getValues('procedures')?.length ?? 0) > 0) return
    setValue('procedures', [{ procedureId: undefined as unknown as number, authorizedQuantity: 1 }])
  }, [analise, getValues, setValue])

  const procedimentosVisiveis = healthPlanId == null ? [] : procedimentosPlano
  const linhasProcedimento = analise ? Math.max(procedures?.length ?? 0, 1) : 0
  const procedimentosNaoCasados = (analise?.procedures ?? []).filter((_, index) => {
    const selecionado = procedures?.[index]?.procedureId
    return selecionado == null || Number.isNaN(selecionado) || selecionado < 1
  })
  const faltaPlano = healthPlanId == null || Number.isNaN(healthPlanId) || healthPlanId < 1
  const faltaProfissional = profissionalSelecionado == null
  const semProcedimentosLidos = (analise?.procedures.length ?? 0) === 0
  const faltaProcedimentoSelecionado = !(procedures ?? []).some(
    (item) => typeof item?.procedureId === 'number' && item.procedureId > 0,
  )
  const conferenciaIncompleta =
    faltaPlano || faltaProfissional || faltaProcedimentoSelecionado
  const precisaCarteirinha =
    patientMode === 'create' || !pacienteTemCarteirinha(pacienteDetalhe, healthPlanId)

  async function avancarDaConferencia() {
    const valido = await trigger(['healthPlanId', 'healthProfessionalId', 'procedures'])
    if (!valido || conferenciaIncompleta) return
    setActiveStep(2)
  }

  async function avancarDoPaciente() {
    const campos: Array<keyof ImportarGuiaFormInput> =
      getValues('patientMode') === 'existing'
        ? ['patientMode', 'patientId', 'cardNumber', 'cardExpirationDate']
        : ['patientMode', 'patientName', 'phone', 'cardNumber', 'cardExpirationDate']
    const valido = await trigger(campos)
    if (!valido) return
    setActiveStep(3)
  }

  async function analisarEAvancar() {
    const ok = await onAnalisar()
    if (ok) setActiveStep(1)
  }

  return (
    <Stepper activeStep={activeStep} orientation="vertical" sx={{ maxWidth: 720, width: '100%' }}>
      <Step>
        <StepLabel>{PASSOS[0]}</StepLabel>
        <StepContent sx={PASSO_CONTENT_SX}>
          <Stack spacing={2}>
            <Button variant="outlined" component="label" sx={{ alignSelf: 'flex-start' }}>
              Selecionar imagem ou PDF
              <input
                hidden
                type="file"
                accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                onChange={(event) => {
                  onSelecionarArquivo(event.target.files?.[0] ?? null)
                  setActiveStep(0)
                  event.target.value = ''
                }}
              />
            </Button>
            {arquivo ? (
              <Typography variant="body2" color="text.secondary">
                {arquivo.name}
              </Typography>
            ) : null}
            {previewUrl ? (
              <Box
                component="img"
                src={previewUrl}
                alt="Pré-visualização da guia"
                sx={{
                  maxWidth: '100%',
                  maxHeight: 360,
                  objectFit: 'contain',
                  border: 1,
                  borderColor: 'divider',
                }}
              />
            ) : null}
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={() => void analisarEAvancar()} disabled={!arquivo || analisando}>
                {analisando ? 'Analisando...' : 'Analisar guia'}
              </Button>
            </Stack>
          </Stack>
        </StepContent>
      </Step>

      <Step>
        <StepLabel>{PASSOS[1]}</StepLabel>
        <StepContent sx={PASSO_CONTENT_SX}>
          <Stack spacing={2}>
            {analise?.extracted.tissGuideType ? (
              <Typography variant="body2">
                Tipo identificado: <strong>{TISS_GUIDE_TYPE_LABELS[analise.extracted.tissGuideType]}</strong>
              </Typography>
            ) : null}

            {analise?.extracted.professional.source === 'solicitante' ? (
              <Alert severity="info">
                O profissional executante não estava preenchido. O sistema usou o profissional solicitante.
              </Alert>
            ) : null}

            {analise?.existingGuide ? (
              <Alert severity="warning">
                Já existe uma guia com o número {analise.existingGuide.guideNumber}. Altere o número no último passo
                ou cancele a importação.
              </Alert>
            ) : null}

            {faltaPlano ? (
              <Alert severity="warning">
                Plano de saúde não cadastrado ({textoOuAusente(analise?.extracted.healthPlan.name)}
                {analise?.extracted.healthPlan.registroAns
                  ? `, ANS ${analise.extracted.healthPlan.registroAns}`
                  : ''}
                ). Cadastre em{' '}
                <Link component={RouterLink} to="/planos-saude/novo" target="_blank" rel="noopener">
                  Planos de saúde
                </Link>{' '}
                e clique em buscar novamente.
              </Alert>
            ) : null}

            {faltaProfissional ? (
              <Alert severity="warning">
                Profissional não cadastrado ({textoOuAusente(analise?.extracted.professional.name)}
                {analise?.extracted.professional.councilNumber
                  ? `, ${analise.extracted.professional.councilType ?? 'conselho'} ${analise.extracted.professional.councilNumber}/${analise.extracted.professional.councilUf ?? ''}`
                  : ''}
                ). Cadastre em{' '}
                <Link component={RouterLink} to="/profissionais/novo" target="_blank" rel="noopener">
                  Profissionais
                </Link>{' '}
                e clique em buscar novamente.
              </Alert>
            ) : null}

            {semProcedimentosLidos && analise ? (
              <Alert severity="warning">
                Nenhum procedimento foi lido na guia. Selecione pelo código TISS cadastrado neste plano.
              </Alert>
            ) : null}

            {procedimentosNaoCasados.map((item) => (
              <Alert
                key={`${item.extracted.tissCode ?? 'sem-codigo'}-${item.extracted.description ?? ''}`}
                severity="warning"
              >
                Procedimento não cadastrado neste plano ({textoOuAusente(item.extracted.tissCode)}
                {item.extracted.description ? ` — ${item.extracted.description}` : ''}). Cadastre o código TISS no
                plano em{' '}
                <Link component={RouterLink} to="/procedimentos/novo" target="_blank" rel="noopener">
                  Procedimentos
                </Link>{' '}
                e clique em buscar novamente.
              </Alert>
            ))}

            <Controller
              name="healthPlanId"
              control={control}
              render={({ field: { onChange, value, onBlur, ref } }) => (
                <Autocomplete
                  options={planos}
                  getOptionLabel={(plano) =>
                    plano.registroAns ? `${plano.name} (ANS ${plano.registroAns})` : plano.name
                  }
                  isOptionEqualToValue={(option, selected) => option.id === selected.id}
                  value={planos.find((plano) => plano.id === value) ?? null}
                  onChange={(_, plano) => onChange(plano?.id)}
                  onBlur={onBlur}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      inputRef={ref}
                      label="Plano de saúde"
                      helperText={`Lido na guia: ${textoOuAusente(analise?.extracted.healthPlan.name)}${
                        analise?.extracted.healthPlan.registroAns
                          ? ` · ANS ${analise.extracted.healthPlan.registroAns}`
                          : ''
                      }`}
                      error={Boolean(errors.healthPlanId)}
                    />
                  )}
                />
              )}
            />

            <Controller
              name="healthProfessionalId"
              control={control}
              render={({ field: { onChange } }) => (
                <ProfissionalBuscaAutocomplete
                  value={profissionalSelecionado}
                  onChange={(profissional) => {
                    setProfissionalSelecionado(profissional)
                    onChange(profissional?.id)
                  }}
                  label="Profissional"
                  helperText={`Lido na guia: ${textoOuAusente(analise?.extracted.professional.name)}${
                    analise?.extracted.professional.councilNumber
                      ? ` · ${analise.extracted.professional.councilType ?? ''} ${analise.extracted.professional.councilNumber}/${analise.extracted.professional.councilUf ?? ''}`
                      : ''
                  }`}
                  error={Boolean(errors.healthProfessionalId)}
                  somenteAtivos
                />
              )}
            />

            {Array.from({ length: linhasProcedimento }, (_, index) => {
              const lido = analise?.procedures[index]
              return (
              <Stack key={`proc-${index}`} spacing={1}>
                <Controller
                  name={`procedures.${index}.procedureId`}
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      options={procedimentosVisiveis}
                      loading={loadingProcedimentos}
                      filterOptions={(options, state) =>
                        filtrarProcedimentosPorCodigo(options, state, healthPlanId)
                      }
                      getOptionLabel={(procedimento) => rotuloProcedimento(procedimento, healthPlanId)}
                      isOptionEqualToValue={(option, selected) => option.id === selected.id}
                      value={procedimentosVisiveis.find((procedimento) => procedimento.id === value) ?? null}
                      onChange={(_, procedimento) => onChange(procedimento?.id)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={linhasProcedimento > 1 ? `Procedimento ${index + 1}` : 'Procedimento'}
                          error={Boolean(errors.procedures?.[index]?.procedureId)}
                          helperText={
                            errors.procedures?.[index]?.procedureId?.message ??
                            (lido
                              ? `Lido na guia: ${textoOuAusente(lido.extracted.tissCode)}${
                                  lido.extracted.description ? ` — ${lido.extracted.description}` : ''
                                }`
                              : 'Digite o código TISS para buscar. O nome pode variar conforme o plano.')
                          }
                        />
                      )}
                    />
                  )}
                />
                <input type="hidden" {...register(`procedures.${index}.authorizedQuantity`, { valueAsNumber: true })} />
              </Stack>
              )
            })}
            {erroProcedimentos ? <Alert severity="error">{erroProcedimentos}</Alert> : null}

            <Stack direction="row" spacing={1}>
              <Button onClick={() => setActiveStep(0)}>Voltar</Button>
              <Button variant="outlined" onClick={() => void onRecruzar()} disabled={recruzando || !analise}>
                {recruzando ? 'Buscando...' : 'Buscar novamente'}
              </Button>
              <Button variant="contained" onClick={() => void avancarDaConferencia()} disabled={conferenciaIncompleta}>
                Continuar
              </Button>
            </Stack>
          </Stack>
        </StepContent>
      </Step>

      <Step>
        <StepLabel>{PASSOS[2]}</StepLabel>
        <StepContent sx={PASSO_CONTENT_SX}>
          <Stack spacing={2}>
            <Controller
              name="patientMode"
              control={control}
              render={({ field }) => (
                <FormControl>
                  <RadioGroup row value={field.value} onChange={(event) => field.onChange(event.target.value)}>
                    <FormControlLabel value="existing" control={<Radio />} label="Paciente já cadastrado" />
                    <FormControlLabel value="create" control={<Radio />} label="Cadastrar paciente" />
                  </RadioGroup>
                </FormControl>
              )}
            />

            {patientMode === 'existing' ? (
              <Controller
                name="patientId"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <PacienteBuscaAutocomplete
                    value={pacienteDetalhe?.id === value ? pacienteDetalhe : null}
                    onChange={(paciente) => {
                      onChange(paciente?.id ?? null)
                      setPacienteDetalhe(paciente)
                    }}
                    helperText={`Lido na guia: ${textoOuAusente(analise?.extracted.patient.name)}`}
                    error={Boolean(errors.patientId)}
                    fullWidth
                  />
                )}
              />
            ) : (
              <>
                <TextField
                  label="Nome"
                  error={Boolean(errors.patientName)}
                  helperText={
                    errors.patientName?.message ?? `Lido na guia: ${textoOuAusente(analise?.extracted.patient.name)}`
                  }
                  InputLabelProps={{ shrink: true }}
                  {...register('patientName')}
                />
                <TextField
                  label="Telefone"
                  error={Boolean(errors.phone)}
                  helperText={errors.phone?.message ?? 'Não consta na guia TISS'}
                  {...register('phone')}
                />
                <TextField label="E-mail (opcional)" {...register('email')} />
                <Controller
                  name="birthDate"
                  control={control}
                  render={({ field }) => (
                    <CampoData
                      label="Data de nascimento (opcional)"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                    />
                  )}
                />
                <TextField label="CPF (opcional)" {...register('cpf')} />
              </>
            )}

            {precisaCarteirinha ? (
              <Alert severity="info">Informe a carteirinha deste plano. A validade quase nunca vem na guia.</Alert>
            ) : (
              <Alert severity="success">Este paciente já possui carteirinha neste plano.</Alert>
            )}

            <TextField
              label="Número da carteirinha"
              error={Boolean(errors.cardNumber)}
              helperText={
                errors.cardNumber?.message ?? `Lido na guia: ${textoOuAusente(analise?.extracted.patient.cardNumber)}`
              }
              InputLabelProps={{ shrink: true }}
              {...register('cardNumber')}
            />
            <Controller
              name="cardExpirationDate"
              control={control}
              render={({ field }) => (
                <CampoData
                  label="Validade da carteirinha"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  error={Boolean(errors.cardExpirationDate)}
                  helperText={errors.cardExpirationDate?.message ?? 'Não localizada na guia'}
                />
              )}
            />

            <Stack direction="row" spacing={1}>
              <Button onClick={() => setActiveStep(1)}>Voltar</Button>
              <Button variant="contained" onClick={() => void avancarDoPaciente()}>
                Continuar
              </Button>
            </Stack>
          </Stack>
        </StepContent>
      </Step>

      <Step>
        <StepLabel>{PASSOS[3]}</StepLabel>
        <StepContent sx={PASSO_CONTENT_SX}>
          <Stack spacing={2}>
            <TextField
              label="Número da guia"
              error={Boolean(errors.guideNumber)}
              helperText={
                errors.guideNumber?.message ??
                `Lido na guia: ${textoOuAusente(
                  analise?.extracted.guide.operatorGuideNumber ?? analise?.extracted.guide.providerGuideNumber,
                )}`
              }
              InputLabelProps={{ shrink: true }}
              {...register('guideNumber')}
            />
            <Controller
              name="authorizationDate"
              control={control}
              render={({ field }) => (
                <CampoData
                  label="Data de autorização"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  error={Boolean(errors.authorizationDate)}
                  helperText={
                    errors.authorizationDate?.message ??
                    (analise?.extracted.guide.authorizationDate
                      ? `Lido na guia: ${formatarDataISO(analise.extracted.guide.authorizationDate)}`
                      : analise?.extracted.guide.attendanceDate
                        ? `Lido na guia (atendimento): ${formatarDataISO(analise.extracted.guide.attendanceDate)}`
                        : 'Não localizada na guia. Se vazia, use a data do atendimento ou hoje.')
                  }
                />
              )}
            />
            <Controller
              name="expirationDate"
              control={control}
              render={({ field }) => (
                <CampoData
                  label="Validade da guia"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  error={Boolean(errors.expirationDate)}
                  helperText={
                    errors.expirationDate?.message ??
                    (analise?.extracted.guide.passwordExpirationDate
                      ? `Lido na guia: ${formatarDataISO(analise.extracted.guide.passwordExpirationDate)}`
                      : planoSelecionado
                        ? `Não localizada na guia. Sugestão: prazo do plano (${planoSelecionado.submissionDeadlineDays} dias).`
                        : 'Não localizada na guia')
                  }
                />
              )}
            />

            {(analise?.procedures ?? []).map((item, index) => (
              <TextField
                key={`qtd-${index}`}
                label={`Quantidade autorizada — ${item.extracted.description ?? item.extracted.tissCode ?? `procedimento ${index + 1}`}`}
                type="number"
                error={Boolean(errors.procedures?.[index]?.authorizedQuantity)}
                helperText={errors.procedures?.[index]?.authorizedQuantity?.message}
                {...register(`procedures.${index}.authorizedQuantity`, { valueAsNumber: true })}
              />
            ))}

            <Typography variant="body2" color="text.secondary">
              Plano: {planoSelecionado?.name ?? '—'} · Profissional: {profissionalSelecionado?.name ?? '—'} · Paciente:{' '}
              {patientMode === 'create' ? patientName : (pacienteDetalhe?.name ?? '—')}
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button onClick={() => setActiveStep(2)} disabled={loading}>
                Voltar
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Cadastrando...' : submitLabel}
              </Button>
            </Stack>
          </Stack>
        </StepContent>
      </Step>
    </Stepper>
  )
}
