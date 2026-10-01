import AddIcon from '@mui/icons-material/Add'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { CartaoVirtualDialog } from './CartaoVirtualDialog'
import { PacienteBuscaAutocomplete } from './PacienteBuscaAutocomplete'
import { CampoData } from './CampoData'
import {
  adesaoCartaoSchema,
  type AdesaoCartaoFormInput,
  type AdesaoCartaoFormValues,
} from '../schemas/cartao.schema'
import { listarPlanosCartao } from '../services/benefit-plans.service'
import {
  adicionarDependente,
  aderirCartao,
  anotarBeneficio,
  cancelarAssinatura,
  listarAssinaturasDoPaciente,
  removerDependente,
} from '../services/benefit-subscriptions.service'
import {
  BENEFIT_SUBSCRIPTION_STATUS_LABELS,
  type BenefitPlan,
  type BenefitSubscription,
} from '../types/cartao'
import type { CartaoVirtualDados } from '../utils/cartaoVirtual'
import type { Patient } from '../types/paciente'
import { FINANCIAL_ENTRY_STATUS_LABELS } from '../types/financeiro'
import { mensagemErroApi } from '../utils/apiError'
import { formatarDataISO, hojeLocalISO } from '../utils/dataISO'
import { formatarMoedaBRL } from '../utils/moedaBRL'

interface PacienteCartaoSecaoProps {
  patientId: number
}

function corStatus(status: BenefitSubscription['status']) {
  if (status === 'active') return 'success'
  return 'default'
}

function dadosCartao(
  assinatura: BenefitSubscription,
  pessoa: { name: string; cpf: string | null } | undefined,
  patientId: number,
): CartaoVirtualDados {
  return {
    nome: pessoa?.name ?? `Paciente #${patientId}`,
    cpf: pessoa?.cpf ?? null,
    cardNumber: assinatura.cardNumber,
    expiresAt: assinatura.expiresAt,
  }
}

export function PacienteCartaoSecao({ patientId }: PacienteCartaoSecaoProps) {
  const [assinaturas, setAssinaturas] = useState<BenefitSubscription[]>([])
  const [planos, setPlanos] = useState<BenefitPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [dependente, setDependente] = useState<Patient | null>(null)
  const [nota, setNota] = useState<Record<number, string>>({})
  const [cartao, setCartao] = useState<CartaoVirtualDados | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [adesoes, catalogo] = await Promise.all([
        listarAssinaturasDoPaciente(patientId),
        listarPlanosCartao({ isActive: true }),
      ])
      setAssinaturas(adesoes)
      setPlanos(catalogo)
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível carregar o cartão do paciente.'))
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdesaoCartaoFormInput, unknown, AdesaoCartaoFormValues>({
    resolver: zodResolver(adesaoCartaoSchema),
    defaultValues: {
      planId: undefined,
      startsAt: hojeLocalISO(),
      billingDay: new Date().getDate(),
      installmentCount: 12,
    },
  })

  async function aderir(values: AdesaoCartaoFormValues) {
    setError(null)
    setSuccess(null)
    try {
      await aderirCartao({
        patientId,
        planId: values.planId,
        startsAt: values.startsAt,
        billingDay: values.billingDay,
        installmentCount: values.installmentCount,
      })
      setDialogAberto(false)
      reset()
      setSuccess('Adesão criada. As parcelas estão pendentes no financeiro.')
      await carregar()
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível aderir ao cartão.'))
    }
  }

  async function cancelar(item: BenefitSubscription) {
    const confirmou = window.confirm(
      `Cancelar o cartão ${item.cardNumber}? Parcelas pendentes serão canceladas. As pagas permanecem.`,
    )
    if (!confirmou) return
    setError(null)
    setSuccess(null)
    try {
      await cancelarAssinatura(item.id)
      setSuccess('Adesão cancelada.')
      await carregar()
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível cancelar a adesão.'))
    }
  }

  async function incluirDependente(subscriptionId: number) {
    if (!dependente) return
    setError(null)
    setSuccess(null)
    try {
      await adicionarDependente(subscriptionId, dependente.id)
      setDependente(null)
      setSuccess('Dependente incluído. As parcelas já geradas não mudam.')
      await carregar()
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível incluir o dependente.'))
    }
  }

  async function excluirDependente(subscriptionId: number, dependentPatientId: number) {
    setError(null)
    setSuccess(null)
    try {
      await removerDependente(subscriptionId, dependentPatientId)
      setSuccess('Dependente removido.')
      await carregar()
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível remover o dependente.'))
    }
  }

  async function salvarNota(subscriptionId: number, entitlementId: number) {
    const texto = nota[entitlementId]?.trim()
    if (!texto) return
    setError(null)
    setSuccess(null)
    try {
      await anotarBeneficio(subscriptionId, entitlementId, texto)
      setNota((atual) => ({ ...atual, [entitlementId]: '' }))
      setSuccess('Anotação registrada.')
      await carregar()
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível salvar a anotação.'))
    }
  }

  const vigente = assinaturas.some((item) => item.isCurrent)

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Typography variant="subtitle1" fontWeight={700}>
          Cartão de benefícios
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          disabled={vigente}
          onClick={() => setDialogAberto(true)}
        >
          Aderir
        </Button>
      </Stack>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}
      {loading ? (
        <Stack direction="row" alignItems="center" gap={1}>
          <CircularProgress size={16} />
          <Typography variant="body2">Carregando cartão...</Typography>
        </Stack>
      ) : null}
      {!loading && assinaturas.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Este paciente não tem cartão de benefícios.
        </Typography>
      ) : null}
      {assinaturas.map((assinatura) => {
        const titular = assinatura.patientId === patientId
        return (
          <Stack
            key={assinatura.id}
            spacing={1}
            sx={{ border: 1, borderColor: 'divider', p: 1.5, borderRadius: 1 }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
              <Typography variant="subtitle2">
                {assinatura.plan?.name ?? `Plano #${assinatura.planId}`} · {assinatura.cardNumber}
              </Typography>
              <Chip
                size="small"
                label={
                  assinatura.isCurrent
                    ? 'Vigente'
                    : BENEFIT_SUBSCRIPTION_STATUS_LABELS[assinatura.status]
                }
                color={assinatura.isCurrent ? 'success' : corStatus(assinatura.status)}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {titular ? 'Titular' : 'Dependente'} · {formatarDataISO(assinatura.startsAt)} a{' '}
              {formatarDataISO(assinatura.expiresAt)}
              {assinatura.discountPercent != null
                ? ` · desconto de ${assinatura.discountPercent}% no particular`
                : ''}
            </Typography>
            {assinatura.isCurrent ? (
              <Button
                size="small"
                variant="outlined"
                onClick={() =>
                  setCartao(
                    dadosCartao(
                      assinatura,
                      titular
                        ? assinatura.patient
                        : assinatura.dependents.find((item) => item.patientId === patientId)?.patient,
                      patientId,
                    ),
                  )
                }
              >
                Gerar cartão
              </Button>
            ) : null}
            {assinatura.dependents.length > 0 ? (
              <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
                {assinatura.dependents.map((item) => (
                  <Stack key={item.id} direction="row" alignItems="center" gap={0.5}>
                    <Chip
                      size="small"
                      label={item.patient?.name ?? `Paciente #${item.patientId}`}
                      onDelete={
                        titular && assinatura.isCurrent
                          ? () => void excluirDependente(assinatura.id, item.patientId)
                          : undefined
                      }
                    />
                    {titular && assinatura.isCurrent ? (
                      <Button
                        size="small"
                        onClick={() => setCartao(dadosCartao(assinatura, item.patient, item.patientId))}
                      >
                        Cartão
                      </Button>
                    ) : null}
                  </Stack>
                ))}
              </Stack>
            ) : null}
            {titular && assinatura.isCurrent ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                <PacienteBuscaAutocomplete
                  value={dependente}
                  onChange={setDependente}
                  label="Novo dependente"
                  size="small"
                  sx={{ minWidth: 240 }}
                />
                <Button
                  size="small"
                  disabled={dependente == null}
                  onClick={() => void incluirDependente(assinatura.id)}
                >
                  Incluir
                </Button>
              </Stack>
            ) : null}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Benefício</TableCell>
                  <TableCell align="right">Saldo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assinatura.entitlements.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography variant="body2">{item.title}</Typography>
                      {item.kind === 'quota' ? (
                        <Typography variant="caption" color="text.secondary">
                          {(item.procedures ?? [])
                            .map((proc) => proc.procedure?.name ?? `#${proc.procedureId}`)
                            .join(', ')}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Desconto de {item.discountPercent}%
                        </Typography>
                      )}
                      {item.notes.length > 0 ? (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {item.notes[0]?.description}
                        </Typography>
                      ) : null}
                      {titular ? (
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <TextField
                            size="small"
                            placeholder="Anotação"
                            value={nota[item.id] ?? ''}
                            onChange={(event) =>
                              setNota((atual) => ({ ...atual, [item.id]: event.target.value }))
                            }
                          />
                          <Button size="small" onClick={() => void salvarNota(assinatura.id, item.id)}>
                            Anotar
                          </Button>
                        </Stack>
                      ) : null}
                    </TableCell>
                    <TableCell align="right">
                      {item.kind === 'quota'
                        ? `${item.remainingQuantity ?? 0} de ${item.quantity ?? 0}`
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {titular && assinatura.financialEntries.length > 0 ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Parcela</TableCell>
                    <TableCell>Vencimento</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assinatura.financialEntries.map((parcela) => (
                    <TableRow key={parcela.id}>
                      <TableCell>{parcela.installmentNumber ?? parcela.id}</TableCell>
                      <TableCell>{formatarDataISO(parcela.dueDate)}</TableCell>
                      <TableCell align="right">{formatarMoedaBRL(parcela.amount)}</TableCell>
                      <TableCell>{FINANCIAL_ENTRY_STATUS_LABELS[parcela.status]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
            {titular && assinatura.status === 'active' ? (
              <Button
                size="small"
                color="error"
                onClick={() => void cancelar(assinatura)}
                sx={{ alignSelf: 'flex-start' }}
              >
                Cancelar adesão
              </Button>
            ) : null}
          </Stack>
        )
      })}

      <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)} fullWidth maxWidth="sm">
        <DialogTitle>Aderir ao cartão</DialogTitle>
        <DialogContent>
          <Stack component="form" id="aderir-cartao" spacing={2} sx={{ mt: 1 }} onSubmit={handleSubmit(aderir)}>
            <Controller
              name="planId"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  label="Plano"
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                  error={Boolean(errors.planId)}
                  helperText={errors.planId?.message}
                >
                  {planos.map((plano) => (
                    <MenuItem key={plano.id} value={plano.id}>
                      {plano.name} — {formatarMoedaBRL(plano.annualPrice)} / ano
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="startsAt"
              control={control}
              render={({ field }) => (
                <CampoData
                  label="Início"
                  value={field.value}
                  onChange={field.onChange}
                  error={Boolean(errors.startsAt)}
                  helperText={errors.startsAt?.message ?? 'A validade é de um ano.'}
                />
              )}
            />
            <TextField
              label="Dia de vencimento"
              type="number"
              inputProps={{ min: 1, max: 31 }}
              error={Boolean(errors.billingDay)}
              helperText={errors.billingDay?.message}
              {...control.register('billingDay', { valueAsNumber: true })}
            />
            <TextField
              label="Parcelas"
              type="number"
              inputProps={{ min: 1, max: 36 }}
              error={Boolean(errors.installmentCount)}
              helperText={errors.installmentCount?.message ?? 'A primeira parcela inclui adesão e dependentes.'}
              {...control.register('installmentCount', { valueAsNumber: true })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAberto(false)}>Cancelar</Button>
          <Button type="submit" form="aderir-cartao" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Aderir'}
          </Button>
        </DialogActions>
      </Dialog>
      <CartaoVirtualDialog open={cartao != null} dados={cartao} onClose={() => setCartao(null)} />
    </Stack>
  )
}
