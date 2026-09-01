import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ReceberLoteDialog } from '../components/ReceberLoteDialog'
import {
  atualizarLoteTiss,
  buscarLoteTiss,
  exportarXmlTissLote,
  faturarLoteTiss,
  receberLoteTiss,
} from '../services/billing-batches.service'
import { listarTodasGuias } from '../services/insurance-guides.service'
import {
  BILLING_BATCH_STATUS_LABELS,
  FINANCIAL_ENTRY_STATUS_LABELS,
  valorFaturavelGuia,
  type BillingBatch,
  type ReceiveBillingBatchRequest,
} from '../types/financeiro'
import type { InsuranceGuide } from '../types/guia'
import { TISS_GUIDE_TYPE_LABELS } from '../types/tiss'
import { mensagemErroApi, mensagemErroApiBlob } from '../utils/apiError'
import { formatarDataHoraISO, formatarDataISO } from '../utils/dataISO'
import { formatarMoedaBRL } from '../utils/moedaBRL'

function corStatus(status: BillingBatch['status']) {
  if (status === 'open') return 'info'
  if (status === 'billed') return 'warning'
  if (status === 'settled') return 'success'
  return 'default'
}

export function LoteTissDetalhePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam != null && idParam !== '' ? Number.parseInt(idParam, 10) : Number.NaN
  const abrirReceber = searchParams.get('receber') === '1'

  const [lote, setLote] = useState<BillingBatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [receberAberto, setReceberAberto] = useState(false)
  const [saving, setSaving] = useState(false)
  const [recebendo, setRecebendo] = useState(false)
  const [adicionarAberto, setAdicionarAberto] = useState(false)
  const [guiasElegiveis, setGuiasElegiveis] = useState<InsuranceGuide[]>([])
  const [guiasSelecionadas, setGuiasSelecionadas] = useState<number[]>([])
  const [loadingGuias, setLoadingGuias] = useState(false)
  const [savingGuias, setSavingGuias] = useState(false)
  const [adicionarError, setAdicionarError] = useState<string | null>(null)
  const [removendoGuiaId, setRemovendoGuiaId] = useState<number | null>(null)
  const [exportando, setExportando] = useState(false)

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoading(false)
      setError('Identificador do lote inválido.')
      return
    }

    let cancelado = false
    async function carregar() {
      setLoading(true)
      setError(null)
      try {
        const data = await buscarLoteTiss(id)
        if (!cancelado) setLote(data)
      } catch (err) {
        if (!cancelado) setError(mensagemErroApi(err, 'Não foi possível carregar o lote.'))
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    void carregar()
    return () => {
      cancelado = true
    }
  }, [id])

  useEffect(() => {
    if (!lote || lote.status !== 'billed' || !abrirReceber) return
    setReceberAberto(true)
    const next = new URLSearchParams(searchParams)
    next.delete('receber')
    setSearchParams(next, { replace: true })
  }, [abrirReceber, lote, searchParams, setSearchParams])

  async function abrirAdicionarGuias() {
    if (!lote) return
    setAdicionarAberto(true)
    setGuiasSelecionadas([])
    setAdicionarError(null)
    setLoadingGuias(true)
    try {
      const data = await listarTodasGuias({
        healthPlanId: lote.healthPlanId,
        availableForBilling: true,
      })
      setGuiasElegiveis(data)
    } catch (err) {
      setGuiasElegiveis([])
      setAdicionarError(mensagemErroApi(err, 'Não foi possível carregar as guias elegíveis.'))
    } finally {
      setLoadingGuias(false)
    }
  }

  function alternarGuia(guiaId: number) {
    setGuiasSelecionadas((prev) =>
      prev.includes(guiaId) ? prev.filter((item) => item !== guiaId) : [...prev, guiaId],
    )
  }

  async function confirmarAdicionarGuias() {
    if (!lote || guiasSelecionadas.length === 0) return
    setSavingGuias(true)
    setAdicionarError(null)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarLoteTiss(lote.id, {
        addInsuranceGuideIds: guiasSelecionadas,
      })
      setLote(atualizado)
      setAdicionarAberto(false)
      setSuccess(
        guiasSelecionadas.length === 1
          ? 'Guia adicionada ao lote.'
          : `${guiasSelecionadas.length} guias adicionadas ao lote.`,
      )
    } catch (err) {
      setAdicionarError(mensagemErroApi(err, 'Não foi possível adicionar as guias ao lote.'))
    } finally {
      setSavingGuias(false)
    }
  }

  async function removerGuia(insuranceGuideId: number, rotulo: string) {
    if (!lote) return
    const confirmou = window.confirm(`Confirma remover a guia ${rotulo} deste lote?`)
    if (!confirmou) return
    setRemovendoGuiaId(insuranceGuideId)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarLoteTiss(lote.id, {
        removeInsuranceGuideIds: [insuranceGuideId],
      })
      setLote(atualizado)
      setSuccess('Guia removida do lote.')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível remover a guia do lote.'))
    } finally {
      setRemovendoGuiaId(null)
    }
  }

  async function confirmarFaturar() {
    if (!lote) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await faturarLoteTiss(lote.id)
      setLote(atualizado)
      setDialogAberto(false)
      setSuccess('Lote faturado. A entrada financeira ficou pendente até o recebimento do plano.')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível faturar o lote.'))
    } finally {
      setSaving(false)
    }
  }

  async function exportarXmlTiss() {
    if (!lote) return
    setExportando(true)
    setError(null)
    setSuccess(null)
    try {
      const { blob, filename } = await exportarXmlTissLote(lote.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setSuccess('XML TISS gerado.')
    } catch (err) {
      setError(await mensagemErroApiBlob(err, 'Não foi possível exportar o XML TISS.'))
    } finally {
      setExportando(false)
    }
  }

  async function confirmarReceber(payload: ReceiveBillingBatchRequest) {
    if (!lote) return
    setRecebendo(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await receberLoteTiss(lote.id, payload)
      setLote(atualizado)
      setReceberAberto(false)
      setSuccess(
        atualizado.financialEntry?.status === 'partially_paid'
          ? 'Pagamento concluído com glosas. A entrada ficou parcialmente paga.'
          : 'Pagamento concluído.',
      )
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível concluir o pagamento.'))
    } finally {
      setRecebendo(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Lote {lote?.batchNumber ?? ''}
        </Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/tiss/lotes')}>
          Voltar para listagem
        </Button>
      </Stack>

      {error && !receberAberto ? (
        <Alert severity="error" sx={{ whiteSpace: 'pre-line' }}>
          {error}
        </Alert>
      ) : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando lote...</Typography>
        </Paper>
      ) : null}

      {!loading && lote ? (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
              <Typography variant="h6">{lote.healthPlan?.name ?? 'Plano'}</Typography>
              <Chip label={BILLING_BATCH_STATUS_LABELS[lote.status]} color={corStatus(lote.status)} />
            </Stack>
            <Typography>
              <strong>Protocolo:</strong> {lote.protocolNumber ?? '—'}
            </Typography>
            <Typography>
              <strong>Valor faturado:</strong> {formatarMoedaBRL(lote.billedAmount)}
            </Typography>
            <Typography>
              <strong>Recebido:</strong> {formatarMoedaBRL(lote.receivedAmount)}
            </Typography>
            <Typography>
              <strong>Criado em:</strong> {formatarDataISO(lote.createdAt)}
            </Typography>
            {lote.billedAt ? (
              <Typography>
                <strong>Faturado em:</strong> {formatarDataHoraISO(lote.billedAt)}
              </Typography>
            ) : null}
            {lote.settledAt ? (
              <Typography>
                <strong>Quitado em:</strong> {formatarDataHoraISO(lote.settledAt)}
              </Typography>
            ) : null}
            {lote.financialEntry ? (
              <Alert severity={lote.financialEntry.status === 'pending' ? 'warning' : 'info'}>
                Entrada #{lote.financialEntry.id} · {FINANCIAL_ENTRY_STATUS_LABELS[lote.financialEntry.status]} ·
                enviado {formatarMoedaBRL(lote.financialEntry.amount)}
                {lote.financialEntry.status !== 'pending'
                  ? ` · recebido ${formatarMoedaBRL(lote.financialEntry.receivedAmount)}`
                  : ''}
                .{' '}
                {lote.financialEntry.status === 'pending'
                  ? 'O pagamento permanece pendente até o recebimento do plano, quando o valor pode ser reduzido por glosas. '
                  : ''}
                <Link component={RouterLink} to="/financeiro/entradas">
                  Ver entradas
                </Link>
              </Alert>
            ) : null}

            <Typography variant="subtitle1" fontWeight={700} sx={{ pt: 1 }}>
              Guias
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Guia</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Paciente</TableCell>
                  <TableCell>Profissional</TableCell>
                  <TableCell>Validade</TableCell>
                  <TableCell align="right">Enviado</TableCell>
                  <TableCell align="right">Recebido</TableCell>
                  <TableCell>Glosa</TableCell>
                  {lote.status === 'open' ? <TableCell align="right">Ações</TableCell> : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {lote.guides.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={lote.status === 'open' ? 9 : 8}>
                      Nenhuma guia neste lote.
                    </TableCell>
                  </TableRow>
                ) : (
                  lote.guides.map((item) => {
                    const rotuloGuia =
                      item.insuranceGuide?.guideNumber?.trim() || `#${item.insuranceGuideId}`
                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>{rotuloGuia}</TableCell>
                        <TableCell>
                          {item.insuranceGuide?.tissGuideType
                            ? TISS_GUIDE_TYPE_LABELS[item.insuranceGuide.tissGuideType]
                            : '—'}
                        </TableCell>
                        <TableCell>{item.insuranceGuide?.patient?.name ?? '—'}</TableCell>
                        <TableCell>{item.insuranceGuide?.healthProfessional?.name ?? '—'}</TableCell>
                        <TableCell>{formatarDataISO(item.insuranceGuide?.expirationDate)}</TableCell>
                        <TableCell align="right">{formatarMoedaBRL(item.billedAmount)}</TableCell>
                        <TableCell align="right">
                          {item.receivedAmount == null ? '—' : formatarMoedaBRL(item.receivedAmount)}
                        </TableCell>
                        <TableCell>{item.glosaReason ?? '—'}</TableCell>
                        {lote.status === 'open' ? (
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              aria-label={`Remover guia ${rotuloGuia} do lote`}
                              onClick={() => void removerGuia(item.insuranceGuideId, rotuloGuia)}
                              disabled={removendoGuiaId != null}
                            >
                              {removendoGuiaId === item.insuranceGuideId ? (
                                <CircularProgress size={18} />
                              ) : (
                                <DeleteOutlineIcon fontSize="small" />
                              )}
                            </IconButton>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            {lote.status === 'open' ? (
              <Stack direction="row" spacing={1.5} sx={{ alignSelf: 'flex-start' }}>
                <Button variant="outlined" onClick={() => void abrirAdicionarGuias()}>
                  Adicionar guias
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setDialogAberto(true)}
                  disabled={lote.guides.length === 0}
                >
                  Faturar
                </Button>
              </Stack>
            ) : null}
            {lote.status === 'billed' || lote.status === 'settled' ? (
              <Stack direction="row" spacing={1.5} sx={{ alignSelf: 'flex-start' }}>
                {lote.status === 'billed' ? (
                  <Button variant="contained" onClick={() => setReceberAberto(true)}>
                    Concluir pagamento
                  </Button>
                ) : null}
                <Button
                  variant={lote.status === 'billed' ? 'outlined' : 'contained'}
                  startIcon={exportando ? <CircularProgress size={16} /> : <FileDownloadIcon />}
                  onClick={() => void exportarXmlTiss()}
                  disabled={exportando}
                >
                  {exportando ? 'Exportando...' : 'Exportar XML TISS'}
                </Button>
              </Stack>
            ) : null}
          </Stack>
        </Paper>
      ) : null}

      <Dialog open={dialogAberto} onClose={() => !saving && setDialogAberto(false)} fullWidth maxWidth="sm">
        <DialogTitle>Faturar lote</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 0.5 }}>
            Confirma o faturamento deste lote? As guias serão marcadas como faturadas e uma entrada financeira
            pendente será gerada. O recebimento do plano (e eventuais glosas) poderá ser registrado depois.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAberto(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void confirmarFaturar()} disabled={saving}>
            {saving ? 'Faturando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={adicionarAberto}
        onClose={() => !savingGuias && setAdicionarAberto(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Adicionar guias</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            {adicionarError ? <Alert severity="error">{adicionarError}</Alert> : null}
            {loadingGuias ? (
              <Stack direction="row" alignItems="center" gap={1.5}>
                <CircularProgress size={20} />
                <Typography>Carregando guias elegíveis...</Typography>
              </Stack>
            ) : null}
            {!loadingGuias && guiasElegiveis.length === 0 && !adicionarError ? (
              <Typography>Não há guias elegíveis deste plano para incluir no lote.</Typography>
            ) : null}
            {!loadingGuias && guiasElegiveis.length > 0 ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Guia</TableCell>
                    <TableCell>Paciente</TableCell>
                    <TableCell>Profissional</TableCell>
                    <TableCell>Validade</TableCell>
                    <TableCell align="right">Valor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {guiasElegiveis.map((guia) => (
                    <TableRow key={guia.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={guiasSelecionadas.includes(guia.id)}
                          onChange={() => alternarGuia(guia.id)}
                          inputProps={{ 'aria-label': `Selecionar guia ${guia.guideNumber ?? guia.id}` }}
                        />
                      </TableCell>
                      <TableCell>{guia.guideNumber?.trim() || `#${guia.id}`}</TableCell>
                      <TableCell>{guia.patient?.name ?? '—'}</TableCell>
                      <TableCell>{guia.healthProfessional?.name ?? '—'}</TableCell>
                      <TableCell>{formatarDataISO(guia.expirationDate)}</TableCell>
                      <TableCell align="right">
                        {formatarMoedaBRL(valorFaturavelGuia(guia.procedures))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdicionarAberto(false)} disabled={savingGuias}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => void confirmarAdicionarGuias()}
            disabled={savingGuias || loadingGuias || guiasSelecionadas.length === 0}
          >
            {savingGuias ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>

      {lote ? (
        <ReceberLoteDialog
          open={receberAberto}
          lote={lote}
          saving={recebendo}
          error={receberAberto ? error : null}
          onClose={() => setReceberAberto(false)}
          onConfirm={(payload) => void confirmarReceber(payload)}
        />
      ) : null}
    </Stack>
  )
}
