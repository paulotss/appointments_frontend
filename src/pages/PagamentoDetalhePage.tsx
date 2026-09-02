import ArrowBackIcon from '@mui/icons-material/ArrowBack'
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
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { PagamentoForm } from '../components/PagamentoForm'
import { CampoDataHora } from '../components/CampoDataHora'
import {
  pagamentoSchema,
  type PagamentoFormInput,
  type PagamentoFormValues,
} from '../schemas/financeiro.schema'
import {
  atualizarPagamento,
  baixarDocumentoPagamento,
  buscarPagamento,
  enviarDocumentoPagamento,
  faturarPagamento,
  removerDocumentoPagamento,
} from '../services/payables.service'
import { listarFornecedores } from '../services/suppliers.service'
import type { Fornecedor } from '../types/estoque'
import {
  PAYABLE_KIND_LABELS,
  PAYABLE_STATUS_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type Payable,
  type PaymentMethod,
} from '../types/financeiro'
import { mensagemErroApi } from '../utils/apiError'
import { formatarDataHoraISO, formatarDataISO } from '../utils/dataISO'
import { formatarMoedaBRL } from '../utils/moedaBRL'
import { formatarTamanhoArquivo, validarArquivosPagamento } from '../utils/pagamentoArquivos'

function agoraDatetimeLocal(): string {
  const data = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`
}

function datetimeLocalParaIso(value: string): string | undefined {
  if (!value) return undefined
  const data = new Date(value)
  if (Number.isNaN(data.getTime())) return undefined
  return data.toISOString()
}

function corStatus(status: Payable['status']) {
  if (status === 'paid') return 'success'
  if (status === 'pending') return 'warning'
  return 'default'
}

function estadoNavegacao(state: unknown): { warning?: string; editar?: boolean } {
  if (!state || typeof state !== 'object') return {}
  const registro = state as { warning?: unknown; editar?: unknown }
  return {
    warning: typeof registro.warning === 'string' ? registro.warning : undefined,
    editar: registro.editar === true,
  }
}

export function PagamentoDetalhePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam != null && idParam !== '' ? Number.parseInt(idParam, 10) : Number.NaN
  const navegacao = estadoNavegacao(location.state)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editouPorNavegacao = useRef(false)

  const [pagamento, setPagamento] = useState<Payable | null>(null)
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const aviso = navegacao.warning ?? null
  const [editando, setEditando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [faturando, setFaturando] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [paidAt, setPaidAt] = useState(agoraDatetimeLocal())
  const [arquivosNovos, setArquivosNovos] = useState<File[]>([])
  const [idsRemovidos, setIdsRemovidos] = useState<number[]>([])
  const [fileError, setFileError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PagamentoFormInput, unknown, PagamentoFormValues>({
    resolver: zodResolver(pagamentoSchema),
    defaultValues: {
      supplierId: undefined,
      kind: 'material',
      description: '',
      amount: undefined,
      dueDate: '',
      invoiceNumber: '',
      notes: '',
    },
  })

  const documentosVisiveis =
    pagamento?.documents.filter((documento) => !idsRemovidos.includes(documento.id)) ?? []

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoading(false)
      setError('Identificador do pagamento inválido.')
      return
    }

    let cancelado = false
    async function carregar() {
      setLoading(true)
      setError(null)
      try {
        const data = await buscarPagamento(id)
        if (cancelado) return
        setPagamento(data)
        try {
          const listaFornecedores = await listarFornecedores()
          if (!cancelado) setFornecedores(listaFornecedores)
        } catch (err) {
          if (!cancelado) {
            setError(mensagemErroApi(err, 'Não foi possível carregar os fornecedores.'))
          }
        }
      } catch (err) {
        if (!cancelado) setError(mensagemErroApi(err, 'Não foi possível carregar o pagamento.'))
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    void carregar()
    return () => {
      cancelado = true
    }
  }, [id])

  const iniciarEdicao = useCallback(
    (item: Payable) => {
      reset({
        supplierId: item.supplierId,
        kind: item.kind,
        description: item.description,
        amount: item.amount,
        dueDate: item.dueDate,
        invoiceNumber: item.invoiceNumber ?? '',
        notes: item.notes ?? '',
      })
      setArquivosNovos([])
      setIdsRemovidos([])
      setFileError(null)
      setSuccess(null)
      setEditando(true)
    },
    [reset],
  )

  useEffect(() => {
    if (!pagamento || !navegacao.editar || editouPorNavegacao.current) return
    if (pagamento.status !== 'pending') return
    editouPorNavegacao.current = true
    iniciarEdicao(pagamento)
  }, [pagamento, navegacao.editar, iniciarEdicao])

  function cancelarEdicao() {
    setEditando(false)
    setArquivosNovos([])
    setIdsRemovidos([])
    setFileError(null)
  }

  function selecionarArquivos(lista: FileList | null) {
    if (!lista || lista.length === 0) return
    const { aceitos, erro } = validarArquivosPagamento(arquivosNovos, lista, documentosVisiveis.length)
    if (aceitos.length > 0) {
      setArquivosNovos((atuais) => [...atuais, ...aceitos])
    }
    setFileError(erro)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function baixarDocumento(documentId: number, nome: string) {
    setError(null)
    try {
      const blob = await baixarDocumentoPagamento(id, documentId)
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.setAttribute('download', nome)
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível baixar o documento.'))
    }
  }

  async function onSalvarEdicao(values: PagamentoFormValues) {
    if (!pagamento) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const invoiceNumber = values.invoiceNumber?.trim()
      const notes = values.notes?.trim()
      await atualizarPagamento(pagamento.id, {
        supplierId: values.supplierId,
        kind: values.kind,
        description: values.description.trim(),
        amount: values.amount,
        dueDate: values.dueDate,
        invoiceNumber: invoiceNumber ?? '',
        notes: notes ?? '',
      })

      const falhas: string[] = []
      for (const documentId of idsRemovidos) {
        try {
          await removerDocumentoPagamento(pagamento.id, documentId)
        } catch (err) {
          falhas.push(mensagemErroApi(err, 'Não foi possível remover um documento.'))
        }
      }
      for (const arquivo of arquivosNovos) {
        try {
          await enviarDocumentoPagamento(pagamento.id, arquivo)
        } catch (err) {
          falhas.push(mensagemErroApi(err, `Não foi possível enviar ${arquivo.name}.`))
        }
      }

      const atualizado = await buscarPagamento(pagamento.id)
      setPagamento(atualizado)
      setEditando(false)
      setArquivosNovos([])
      setIdsRemovidos([])
      setFileError(null)
      if (falhas.length > 0) {
        setError(`Pagamento atualizado, mas houve falha nos documentos: ${falhas.join(' ')}`)
      } else {
        setSuccess('Pagamento atualizado.')
      }
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível atualizar o pagamento.'))
    } finally {
      setSaving(false)
    }
  }

  async function confirmarFaturar() {
    if (!pagamento) return
    setFaturando(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await faturarPagamento(pagamento.id, {
        paymentMethod,
        paidAt: datetimeLocalParaIso(paidAt),
      })
      setPagamento(atualizado)
      setDialogAberto(false)
      setSuccess('Pagamento faturado. A saída financeira foi gerada.')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível faturar o pagamento.'))
    } finally {
      setFaturando(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          {editando ? 'Editar pagamento' : 'Pagamento'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/financeiro/pagamentos')}
        >
          Voltar para listagem
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {aviso ? <Alert severity="warning">{aviso}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando pagamento...</Typography>
        </Paper>
      ) : null}

      {!loading && pagamento && editando ? (
        <Stack component="form" onSubmit={handleSubmit(onSalvarEdicao)}>
          <PagamentoForm
            control={control}
            register={register}
            errors={errors}
            fornecedores={fornecedores}
            loading={saving}
            submitLabel="Salvar alterações"
            fileInputRef={fileInputRef}
            arquivosNovos={arquivosNovos}
            fileError={fileError}
            onSelecionarArquivos={selecionarArquivos}
            onRemoverArquivoNovo={(indice) => {
              setArquivosNovos((atuais) => atuais.filter((_, i) => i !== indice))
              setFileError(null)
            }}
            documentosExistentes={documentosVisiveis}
            onBaixarDocumento={(documentId, nome) => void baixarDocumento(documentId, nome)}
            onRemoverDocumentoExistente={(documentId) => {
              setIdsRemovidos((atuais) => [...atuais, documentId])
              setFileError(null)
            }}
            onCancelar={cancelarEdicao}
          />
        </Stack>
      ) : null}

      {!loading && pagamento && !editando ? (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
              <Typography variant="h6">{pagamento.description}</Typography>
              <Chip
                label={PAYABLE_STATUS_LABELS[pagamento.status]}
                color={corStatus(pagamento.status)}
              />
            </Stack>
            <Typography>
              <strong>Fornecedor:</strong> {pagamento.supplier?.tradeName ?? '—'}
            </Typography>
            <Typography>
              <strong>Tipo:</strong> {PAYABLE_KIND_LABELS[pagamento.kind]}
            </Typography>
            <Typography>
              <strong>Valor:</strong> {formatarMoedaBRL(pagamento.amount)}
            </Typography>
            <Typography>
              <strong>Vencimento:</strong> {formatarDataISO(pagamento.dueDate)}
            </Typography>
            <Typography>
              <strong>Nota:</strong> {pagamento.invoiceNumber ?? '—'}
            </Typography>
            <Typography>
              <strong>Observações:</strong> {pagamento.notes ?? '—'}
            </Typography>
            <Stack spacing={0.5}>
              <Typography>
                <strong>Documentos:</strong>
                {pagamento.documents.length === 0 ? ' —' : ''}
              </Typography>
              {pagamento.documents.map((documento) => (
                <Stack
                  key={documento.id}
                  direction="row"
                  alignItems="center"
                  gap={1}
                  flexWrap="wrap"
                >
                  <Typography>
                    {documento.originalName} ({formatarTamanhoArquivo(documento.sizeBytes)})
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => void baixarDocumento(documento.id, documento.originalName)}
                  >
                    Baixar
                  </Button>
                </Stack>
              ))}
            </Stack>
            {pagamento.financialExit ? (
              <Alert severity="info">
                Saída #{pagamento.financialExit.id} gerada em{' '}
                {formatarDataHoraISO(pagamento.financialExit.paidAt)} via{' '}
                {PAYMENT_METHOD_LABELS[pagamento.financialExit.paymentMethod]} (
                {formatarMoedaBRL(pagamento.financialExit.amount)}).
              </Alert>
            ) : null}
            {pagamento.status === 'pending' ? (
              <Stack direction="row" gap={1} flexWrap="wrap">
                <Button variant="outlined" onClick={() => iniciarEdicao(pagamento)}>
                  Editar
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    setPaidAt(agoraDatetimeLocal())
                    setDialogAberto(true)
                  }}
                >
                  Faturar
                </Button>
              </Stack>
            ) : null}
          </Stack>
        </Paper>
      ) : null}

      <Dialog open={dialogAberto} onClose={() => !faturando && setDialogAberto(false)} fullWidth maxWidth="sm">
        <DialogTitle>Faturar pagamento</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Forma de pagamento"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
            >
              {PAYMENT_METHODS.map((method) => (
                <MenuItem key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </MenuItem>
              ))}
            </TextField>
            <CampoDataHora
              label="Data do pagamento"
              value={paidAt}
              onChange={setPaidAt}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAberto(false)} disabled={faturando}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void confirmarFaturar()} disabled={faturando}>
            {faturando ? 'Faturando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
