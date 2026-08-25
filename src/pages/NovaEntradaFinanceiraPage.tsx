import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  Alert,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CampoValorMoeda } from '../components/CampoValorMoeda'
import {
  entradaParticularSchema,
  type EntradaParticularFormInput,
  type EntradaParticularFormValues,
} from '../schemas/financeiro.schema'
import { buscarAgendamentoClinico } from '../services/clinical-appointments.service'
import { criarEntradaParticular } from '../services/financial-entries.service'
import type { ClinicalAppointment } from '../types/agendamentoClinico'
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../types/financeiro'
import { valorParticular } from '../types/procedimento'
import { mensagemErroApi } from '../utils/apiError'
import { formatarMoedaBRL } from '../utils/moedaBRL'

function agoraDatetimeLocal(): string {
  const data = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`
}

function datetimeLocalParaIso(value: string | undefined): string | undefined {
  if (!value) return undefined
  const data = new Date(value)
  if (Number.isNaN(data.getTime())) return undefined
  return data.toISOString()
}

export function NovaEntradaFinanceiraPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const agendamentoId = Number.parseInt(searchParams.get('agendamentoId') ?? '', 10)

  const [agendamento, setAgendamento] = useState<ClinicalAppointment | null>(null)
  const [loadingDados, setLoadingDados] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EntradaParticularFormInput, unknown, EntradaParticularFormValues>({
    resolver: zodResolver(entradaParticularSchema),
    defaultValues: {
      paymentMethod: 'pix',
      paidAt: agoraDatetimeLocal(),
      discountAmount: 0,
      surchargeAmount: 0,
      notes: '',
    },
  })

  const discountAmount = useWatch({ control, name: 'discountAmount' }) ?? 0
  const surchargeAmount = useWatch({ control, name: 'surchargeAmount' }) ?? 0

  useEffect(() => {
    if (!Number.isFinite(agendamentoId)) {
      setLoadingDados(false)
      setError('Identificador do agendamento inválido.')
      return
    }

    async function carregar() {
      setLoadingDados(true)
      setError(null)
      try {
        const item = await buscarAgendamentoClinico(agendamentoId)
        setAgendamento(item)
      } catch (err) {
        setError(mensagemErroApi(err, 'Não foi possível carregar o agendamento.'))
      } finally {
        setLoadingDados(false)
      }
    }
    void carregar()
  }, [agendamentoId])

  const linhas = useMemo(() => {
    if (!agendamento) return []
    return agendamento.procedures.map((item) => ({
      id: item.id,
      nome: item.procedure?.name ?? `Procedimento #${item.procedureId}`,
      unitValue: valorParticular(item.procedure) ?? 0,
    }))
  }, [agendamento])

  const grossAmount = linhas.reduce((total, item) => total + item.unitValue, 0)
  const liquido = Math.max(0, grossAmount - discountAmount + surchargeAmount)

  async function onSubmit(values: EntradaParticularFormValues) {
    setLoading(true)
    setError(null)
    try {
      await criarEntradaParticular({
        clinicalAppointmentId: agendamentoId,
        paymentMethod: values.paymentMethod,
        paidAt: datetimeLocalParaIso(values.paidAt),
        discountAmount: values.discountAmount ?? 0,
        surchargeAmount: values.surchargeAmount ?? 0,
        notes: values.notes?.trim() || undefined,
      })
      navigate('/financeiro/entradas', { replace: true })
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível registrar a entrada.'))
    } finally {
      setLoading(false)
    }
  }

  const podeRegistrar =
    agendamento?.type === 'private' && agendamento.status === 'finished' && linhas.length > 0

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Nova entrada
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/clinical-appointments')}
        >
          Voltar para agenda
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loadingDados ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando agendamento...</Typography>
        </Paper>
      ) : null}

      {!loadingDados && agendamento ? (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography>
              <strong>Paciente:</strong> {agendamento.patient?.name ?? '—'}
            </Typography>
            <Typography>
              <strong>Profissional:</strong> {agendamento.healthProfessional?.name ?? '—'}
            </Typography>
            {agendamento.type !== 'private' ? (
              <Alert severity="warning">Somente agendamentos particulares geram esta entrada.</Alert>
            ) : null}
            {agendamento.status !== 'finished' ? (
              <Alert severity="warning">O agendamento precisa estar finalizado.</Alert>
            ) : null}

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Procedimento</TableCell>
                  <TableCell align="right">Valor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {linhas.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.nome}</TableCell>
                    <TableCell align="right">{formatarMoedaBRL(item.unitValue)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>
                    <strong>Bruto</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{formatarMoedaBRL(grossAmount)}</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Stack
              component="form"
              spacing={2}
              sx={{ maxWidth: 540 }}
              onSubmit={handleSubmit(onSubmit)}
            >
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Forma de pagamento"
                    value={field.value}
                    onChange={field.onChange}
                    error={Boolean(errors.paymentMethod)}
                    helperText={errors.paymentMethod?.message ?? ' '}
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <MenuItem key={method} value={method}>
                        {PAYMENT_METHOD_LABELS[method]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <TextField
                label="Data do pagamento"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                error={Boolean(errors.paidAt)}
                helperText={errors.paidAt?.message}
                {...register('paidAt')}
              />
              <Controller
                name="discountAmount"
                control={control}
                render={({ field }) => (
                  <CampoValorMoeda
                    label="Desconto"
                    value={field.value}
                    onChange={(value) => field.onChange(value ?? 0)}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={Boolean(errors.discountAmount)}
                    helperText={errors.discountAmount?.message}
                  />
                )}
              />
              <Controller
                name="surchargeAmount"
                control={control}
                render={({ field }) => (
                  <CampoValorMoeda
                    label="Acréscimo"
                    value={field.value}
                    onChange={(value) => field.onChange(value ?? 0)}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={Boolean(errors.surchargeAmount)}
                    helperText={errors.surchargeAmount?.message}
                  />
                )}
              />
              <Typography>
                <strong>Valor líquido:</strong> {formatarMoedaBRL(liquido)}
              </Typography>
              <TextField
                label="Observações"
                multiline
                minRows={2}
                error={Boolean(errors.notes)}
                helperText={errors.notes?.message}
                {...register('notes')}
              />
              <Button type="submit" variant="contained" disabled={loading || !podeRegistrar}>
                {loading ? 'Salvando...' : 'Registrar entrada'}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : null}
    </Stack>
  )
}
