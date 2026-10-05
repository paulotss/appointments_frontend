import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  Alert,
  Chip,
  CircularProgress,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { buscarEntradaFinanceira } from '../services/financial-entries.service'
import type { FinancialEntry, FinancialEntryStatus } from '../types/financeiro'
import {
  FINANCIAL_ENTRY_STATUS_LABELS,
  FINANCIAL_ENTRY_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  origemEntrada,
} from '../types/financeiro'
import { mensagemErroApi } from '../utils/apiError'
import { formatarDataHoraISO, formatarDataISO } from '../utils/dataISO'
import { formatarMoedaBRL } from '../utils/moedaBRL'

function corStatus(status: FinancialEntryStatus) {
  if (status === 'paid') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'partially_paid') return 'info'
  return 'default'
}

function pacienteDaEntrada(entrada: FinancialEntry): string | null {
  return (
    entrada.clinicalAppointment?.patient?.name ??
    entrada.patientPackage?.patient?.name ??
    entrada.benefitSubscription?.patient?.name ??
    null
  )
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <Typography>
      <strong>{rotulo}:</strong> {valor}
    </Typography>
  )
}

export function EntradaFinanceiraDetalhePage() {
  const navigate = useNavigate()
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam != null && idParam !== '' ? Number.parseInt(idParam, 10) : Number.NaN

  const [entrada, setEntrada] = useState<FinancialEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoading(false)
      setError('Identificador da entrada inválido.')
      setEntrada(null)
      return
    }

    let cancelado = false
    async function carregar() {
      setLoading(true)
      setError(null)
      try {
        const data = await buscarEntradaFinanceira(id)
        if (!cancelado) setEntrada(data)
      } catch (err) {
        if (!cancelado) {
          setError(mensagemErroApi(err, 'Não foi possível carregar a entrada.'))
          setEntrada(null)
        }
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    void carregar()
    return () => {
      cancelado = true
    }
  }, [id])

  const paciente = entrada ? pacienteDaEntrada(entrada) : null
  const profissional = entrada?.clinicalAppointment?.healthProfessional?.name ?? null
  const lote = entrada?.billingBatch

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Entrada
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/financeiro/entradas')}
        >
          Voltar para listagem
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando entrada...</Typography>
        </Paper>
      ) : null}

      {!loading && entrada ? (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
              <Typography variant="h6">{origemEntrada(entrada)}</Typography>
              <Chip
                label={FINANCIAL_ENTRY_STATUS_LABELS[entrada.status]}
                color={corStatus(entrada.status)}
              />
            </Stack>
            <Linha rotulo="Tipo" valor={FINANCIAL_ENTRY_TYPE_LABELS[entrada.type]} />
            {paciente ? <Linha rotulo="Paciente" valor={paciente} /> : null}
            {profissional ? <Linha rotulo="Profissional" valor={profissional} /> : null}
            {lote ? (
              <Typography>
                <strong>Lote:</strong>{' '}
                <Link component={RouterLink} to={`/tiss/lotes/${lote.id}`}>
                  {lote.batchNumber ?? `#${lote.id}`}
                </Link>
                {lote.healthPlan?.name ? ` · ${lote.healthPlan.name}` : ''}
              </Typography>
            ) : null}
            {entrada.patientPackage?.package?.name ? (
              <Linha rotulo="Pacote" valor={entrada.patientPackage.package.name} />
            ) : null}
            {entrada.benefitSubscription ? (
              <>
                <Linha rotulo="Cartão" valor={entrada.benefitSubscription.cardNumber} />
                {entrada.benefitSubscription.plan?.name ? (
                  <Linha rotulo="Plano do cartão" valor={entrada.benefitSubscription.plan.name} />
                ) : null}
              </>
            ) : null}
            {entrada.installmentNumber != null ? (
              <Linha rotulo="Parcela" valor={String(entrada.installmentNumber)} />
            ) : null}
            <Linha rotulo="Valor bruto" valor={formatarMoedaBRL(entrada.grossAmount)} />
            <Linha rotulo="Desconto" valor={formatarMoedaBRL(entrada.discountAmount)} />
            <Linha rotulo="Acréscimo" valor={formatarMoedaBRL(entrada.surchargeAmount)} />
            <Linha rotulo="Valor" valor={formatarMoedaBRL(entrada.amount)} />
            <Linha rotulo="Recebido" valor={formatarMoedaBRL(entrada.receivedAmount)} />
            <Linha
              rotulo="Pagamento"
              valor={entrada.paymentMethod ? PAYMENT_METHOD_LABELS[entrada.paymentMethod] : '—'}
            />
            <Linha
              rotulo="Pago em"
              valor={entrada.paidAt ? formatarDataHoraISO(entrada.paidAt) : '—'}
            />
            <Linha
              rotulo="Vencimento"
              valor={entrada.dueDate ? formatarDataISO(entrada.dueDate) : '—'}
            />
            <Linha rotulo="Registrada em" valor={formatarDataHoraISO(entrada.createdAt)} />
            <Linha rotulo="Observações" valor={entrada.notes?.trim() ? entrada.notes : '—'} />

            {entrada.items.length > 0 ? (
              <Stack spacing={1}>
                <Typography>
                  <strong>Itens</strong>
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Descrição</TableCell>
                        <TableCell align="right">Quantidade</TableCell>
                        <TableCell align="right">Valor unitário</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {entrada.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.description || item.procedure?.name || '—'}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{formatarMoedaBRL(item.unitValue)}</TableCell>
                          <TableCell align="right">
                            {formatarMoedaBRL(item.quantity * item.unitValue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            ) : null}
          </Stack>
        </Paper>
      ) : null}
    </Stack>
  )
}
