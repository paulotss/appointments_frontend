import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, Stack, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { PagamentoForm } from '../components/PagamentoForm'
import {
  pagamentoSchema,
  type PagamentoFormInput,
  type PagamentoFormValues,
} from '../schemas/financeiro.schema'
import { criarPagamento, enviarDocumentoPagamento } from '../services/payables.service'
import { listarFornecedores } from '../services/suppliers.service'
import type { Fornecedor } from '../types/estoque'
import { mensagemErroApi } from '../utils/apiError'
import { hojeLocalISO } from '../utils/dataISO'
import { validarArquivosPagamento } from '../utils/pagamentoArquivos'

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
    const { aceitos, erro } = validarArquivosPagamento(arquivos, lista)
    if (aceitos.length > 0) {
      setArquivos((atuais) => [...atuais, ...aceitos])
    }
    setFileError(erro)
    if (fileInputRef.current) fileInputRef.current.value = ''
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
          falhas.push(mensagemErroApi(err, `Não foi possível enviar ${arquivo.name}.`))
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

      <Stack component="form" onSubmit={handleSubmit(onSubmit)}>
        <PagamentoForm
          control={control}
          register={register}
          errors={errors}
          fornecedores={fornecedores}
          loading={loading}
          submitLabel="Cadastrar"
          fileInputRef={fileInputRef}
          arquivosNovos={arquivos}
          fileError={fileError}
          onSelecionarArquivos={selecionarArquivos}
          onRemoverArquivoNovo={(indice) => {
            setArquivos((atuais) => atuais.filter((_, i) => i !== indice))
            setFileError(null)
          }}
        />
      </Stack>
    </Stack>
  )
}
