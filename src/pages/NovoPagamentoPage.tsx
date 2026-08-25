import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Alert,
  Button,
  FormHelperText,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { CampoValorMoeda } from '../components/CampoValorMoeda'
import {
  pagamentoSchema,
  type PagamentoFormInput,
  type PagamentoFormValues,
} from '../schemas/financeiro.schema'
import { criarPagamento, enviarDocumentoPagamento } from '../services/payables.service'
import { listarFornecedores } from '../services/suppliers.service'
import type { Fornecedor } from '../types/estoque'
import {
  PAYABLE_DOCUMENT_MAX_BYTES,
  PAYABLE_DOCUMENT_MAX_FILES,
  PAYABLE_DOCUMENT_MIME_TYPES,
  PAYABLE_KIND_LABELS,
  PAYABLE_KINDS,
} from '../types/financeiro'
import { mensagemErroApi } from '../utils/apiError'
import { hojeLocalISO } from '../utils/dataISO'

const ACCEPT_ARQUIVOS = [...PAYABLE_DOCUMENT_MIME_TYPES, '.pdf', '.jpg', '.jpeg', '.png'].join(',')
const EXTENSOES_PERMITIDAS = new Set(['.pdf', '.jpg', '.jpeg', '.png'])
const TIPOS_PERMITIDOS = new Set<string>([...PAYABLE_DOCUMENT_MIME_TYPES, 'image/jpg'])

function extensaoArquivo(nome: string): string {
  const indice = nome.lastIndexOf('.')
  return indice >= 0 ? nome.slice(indice).toLowerCase() : ''
}

function arquivoPermitido(file: File): boolean {
  if (TIPOS_PERMITIDOS.has(file.type.toLowerCase())) return true
  return EXTENSOES_PERMITIDAS.has(extensaoArquivo(file.name))
}

function formatarTamanhoArquivo(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`
}

export function NovoPagamentoPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [arquivos, setArquivos] = useState<File[]>([])

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PagamentoFormInput, unknown, PagamentoFormValues>({
    resolver: zodResolver(pagamentoSchema),
    defaultValues: {
      supplierId: undefined,
      kind: 'material',
      description: '',
      amount: undefined,
      dueDate: hojeLocalISO(),
      invoiceNumber: '',
      notes: '',
    },
  })

  useEffect(() => {
    async function carregarFornecedores() {
      try {
        setFornecedores(await listarFornecedores())
      } catch (err) {
        setError(mensagemErroApi(err, 'Não foi possível carregar os fornecedores.'))
      }
    }
    void carregarFornecedores()
  }, [])

  function selecionarArquivos(lista: FileList | null) {
    if (!lista || lista.length === 0) return
    const restantes = PAYABLE_DOCUMENT_MAX_FILES - arquivos.length
    if (restantes <= 0) {
      setFileError(`Você pode anexar no máximo ${PAYABLE_DOCUMENT_MAX_FILES} arquivos.`)
      return
    }

    const selecionados = Array.from(lista)
    const aceitos: File[] = []
    const recusados: string[] = []

    for (const file of selecionados) {
      if (aceitos.length >= restantes) {
        recusados.push(`Limite de ${PAYABLE_DOCUMENT_MAX_FILES} arquivos.`)
        break
      }
      if (!arquivoPermitido(file)) {
        recusados.push(`${file.name}: somente PDF, JPEG e PNG.`)
        continue
      }
      if (file.size > PAYABLE_DOCUMENT_MAX_BYTES) {
        recusados.push(`${file.name}: cada arquivo deve ter no máximo 1 MB.`)
        continue
      }
      aceitos.push(file)
    }

    if (aceitos.length > 0) {
      setArquivos((atuais) => [...atuais, ...aceitos])
    }
    setFileError(recusados.length > 0 ? recusados.join(' ') : null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removerArquivo(indice: number) {
    setArquivos((atuais) => atuais.filter((_, i) => i !== indice))
    setFileError(null)
  }

  async function onSubmit(values: PagamentoFormValues) {
    setLoading(true)
    setError(null)
    try {
      const invoiceNumber = values.invoiceNumber?.trim()
      const notes = values.notes?.trim()
      const criado = await criarPagamento({
        supplierId: values.supplierId,
        kind: values.kind,
        description: values.description.trim(),
        amount: values.amount,
        dueDate: values.dueDate,
        ...(invoiceNumber ? { invoiceNumber } : {}),
        ...(notes ? { notes } : {}),
      })

      const falhas: string[] = []
      for (const arquivo of arquivos) {
        try {
          await enviarDocumentoPagamento(criado.id, arquivo)
        } catch (err) {
          falhas.push(
            mensagemErroApi(err, `Não foi possível enviar ${arquivo.name}.`),
          )
        }
      }

      navigate(`/financeiro/pagamentos/${criado.id}`, {
        replace: true,
        ...(falhas.length > 0
          ? {
              state: {
                warning: `Pagamento cadastrado, mas houve falha no envio dos documentos: ${falhas.join(' ')}`,
              },
            }
          : {}),
      })
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível cadastrar o pagamento.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Novo pagamento
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

      <Stack component="form" spacing={2} sx={{ maxWidth: 540 }} onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="supplierId"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="Fornecedor"
              value={field.value ?? ''}
              onChange={(event) => field.onChange(Number(event.target.value))}
              error={Boolean(errors.supplierId)}
              helperText={errors.supplierId?.message ?? ' '}
            >
              {fornecedores.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.tradeName}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="kind"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="Tipo"
              value={field.value}
              onChange={field.onChange}
              error={Boolean(errors.kind)}
              helperText={errors.kind?.message ?? ' '}
            >
              {PAYABLE_KINDS.map((kind) => (
                <MenuItem key={kind} value={kind}>
                  {PAYABLE_KIND_LABELS[kind]}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <TextField
          label="Descrição"
          error={Boolean(errors.description)}
          helperText={errors.description?.message}
          {...register('description')}
        />
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <CampoValorMoeda
              label="Valor"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={Boolean(errors.amount)}
              helperText={errors.amount?.message}
            />
          )}
        />
        <TextField
          label="Vencimento"
          type="date"
          InputLabelProps={{ shrink: true }}
          error={Boolean(errors.dueDate)}
          helperText={errors.dueDate?.message}
          {...register('dueDate')}
        />
        <TextField
          label="Número da nota"
          error={Boolean(errors.invoiceNumber)}
          helperText={errors.invoiceNumber?.message}
          {...register('invoiceNumber')}
        />
        <TextField
          label="Observações"
          multiline
          minRows={2}
          error={Boolean(errors.notes)}
          helperText={errors.notes?.message}
          {...register('notes')}
        />

        <Stack spacing={1}>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_ARQUIVOS}
            multiple
            hidden
            onChange={(event) => selecionarArquivos(event.target.files)}
          />
          <Button
            type="button"
            variant="outlined"
            startIcon={<AttachFileIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || arquivos.length >= PAYABLE_DOCUMENT_MAX_FILES}
            sx={{ alignSelf: 'flex-start' }}
          >
            Anexar documentos
          </Button>
          <FormHelperText error={Boolean(fileError)}>
            {fileError ??
              `PDF, JPEG ou PNG. Até ${PAYABLE_DOCUMENT_MAX_FILES} arquivos de 1 MB cada.`}
          </FormHelperText>
          {arquivos.map((arquivo, indice) => (
            <Stack
              key={`${arquivo.name}-${arquivo.size}-${indice}`}
              direction="row"
              alignItems="center"
              gap={1}
            >
              <Typography noWrap title={arquivo.name} sx={{ flex: 1 }}>
                {arquivo.name} ({formatarTamanhoArquivo(arquivo.size)})
              </Typography>
              <IconButton
                aria-label={`Remover ${arquivo.name}`}
                onClick={() => removerArquivo(indice)}
                disabled={loading}
                size="small"
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Stack>
          ))}
        </Stack>

        <Button type="submit" variant="contained" disabled={loading || fornecedores.length === 0}>
          {loading ? 'Salvando...' : 'Cadastrar'}
        </Button>
      </Stack>
    </Stack>
  )
}
