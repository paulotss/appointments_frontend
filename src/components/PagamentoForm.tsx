import AttachFileIcon from '@mui/icons-material/AttachFile'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Button,
  FormHelperText,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { RefObject } from 'react'
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form'
import type { PagamentoFormInput, PagamentoFormValues } from '../schemas/financeiro.schema'
import type { Fornecedor } from '../types/estoque'
import {
  PAYABLE_DOCUMENT_MAX_FILES,
  PAYABLE_KIND_LABELS,
  PAYABLE_KINDS,
  type PayableDocument,
} from '../types/financeiro'
import { ACCEPT_ARQUIVOS_PAGAMENTO, formatarTamanhoArquivo } from '../utils/pagamentoArquivos'
import { CampoValorMoeda } from './CampoValorMoeda'

interface PagamentoFormProps {
  control: Control<PagamentoFormInput, unknown, PagamentoFormValues>
  register: UseFormRegister<PagamentoFormInput>
  errors: FieldErrors<PagamentoFormInput>
  fornecedores: Fornecedor[]
  loading: boolean
  submitLabel: string
  fileInputRef: RefObject<HTMLInputElement | null>
  arquivosNovos: File[]
  fileError: string | null
  onSelecionarArquivos: (lista: FileList | null) => void
  onRemoverArquivoNovo: (indice: number) => void
  documentosExistentes?: PayableDocument[]
  onBaixarDocumento?: (id: number, nome: string) => void
  onRemoverDocumentoExistente?: (id: number) => void
  onCancelar?: () => void
}

export function PagamentoForm({
  control,
  register,
  errors,
  fornecedores,
  loading,
  submitLabel,
  fileInputRef,
  arquivosNovos,
  fileError,
  onSelecionarArquivos,
  onRemoverArquivoNovo,
  documentosExistentes = [],
  onBaixarDocumento,
  onRemoverDocumentoExistente,
  onCancelar,
}: PagamentoFormProps) {
  const totalArquivos = documentosExistentes.length + arquivosNovos.length

  return (
    <Stack spacing={2} sx={{ maxWidth: 540 }}>
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
          accept={ACCEPT_ARQUIVOS_PAGAMENTO}
          multiple
          hidden
          onChange={(event) => onSelecionarArquivos(event.target.files)}
        />
        <Button
          type="button"
          variant="outlined"
          startIcon={<AttachFileIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || totalArquivos >= PAYABLE_DOCUMENT_MAX_FILES}
          sx={{ alignSelf: 'flex-start' }}
        >
          Anexar documentos
        </Button>
        <FormHelperText error={Boolean(fileError)}>
          {fileError ??
            `PDF, JPEG ou PNG. Até ${PAYABLE_DOCUMENT_MAX_FILES} arquivos de 1 MB cada.`}
        </FormHelperText>
        {documentosExistentes.map((documento) => (
          <Stack
            key={documento.id}
            direction="row"
            alignItems="center"
            gap={1}
            flexWrap="wrap"
          >
            <Typography noWrap title={documento.originalName} sx={{ flex: 1, minWidth: 0 }}>
              {documento.originalName} ({formatarTamanhoArquivo(documento.sizeBytes)})
            </Typography>
            {onBaixarDocumento ? (
              <Button
                size="small"
                onClick={() => onBaixarDocumento(documento.id, documento.originalName)}
                disabled={loading}
              >
                Baixar
              </Button>
            ) : null}
            {onRemoverDocumentoExistente ? (
              <IconButton
                aria-label={`Remover ${documento.originalName}`}
                onClick={() => onRemoverDocumentoExistente(documento.id)}
                disabled={loading}
                size="small"
              >
                <DeleteOutlineIcon />
              </IconButton>
            ) : null}
          </Stack>
        ))}
        {arquivosNovos.map((arquivo, indice) => (
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
              onClick={() => onRemoverArquivoNovo(indice)}
              disabled={loading}
              size="small"
            >
              <DeleteOutlineIcon />
            </IconButton>
          </Stack>
        ))}
      </Stack>

      <Stack direction="row" gap={1} flexWrap="wrap">
        {onCancelar ? (
          <Button type="button" variant="outlined" onClick={onCancelar} disabled={loading}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" variant="contained" disabled={loading || fornecedores.length === 0}>
          {loading ? 'Salvando...' : submitLabel}
        </Button>
      </Stack>
    </Stack>
  )
}
