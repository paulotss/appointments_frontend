import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { LoteForm } from '../components/LoteForm'
import { loteSchema, type LoteFormValues } from '../schemas/lote.schema'
import { getLoggedUserId } from '../services/authStorage'
import { listarLocais } from '../services/storage-locations.service'
import { listarProdutos } from '../services/products.service'
import { criarLote } from '../services/stock-batches.service'
import { listarSetores } from '../services/sectors.service'
import type { LocalArmazenamento, ProdutoConfig, Setor } from '../types/estoque'
import { dataHojeISO, montarPayloadCriacao } from '../utils/loteForm'

export function NovoLotePage() {
  const navigate = useNavigate()
  const loggedUserId = getLoggedUserId()
  const [loading, setLoading] = useState(false)
  const [loadingDados, setLoadingDados] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [produtos, setProdutos] = useState<ProdutoConfig[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [locais, setLocais] = useState<LocalArmazenamento[]>([])

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<LoteFormValues>({
    resolver: zodResolver(loteSchema),
    defaultValues: {
      productId: undefined,
      sectorId: undefined,
      locationId: undefined,
      userId: loggedUserId ?? undefined,
      initialQuantity: undefined,
      unit: 'UNIT',
      value: undefined,
      movementDate: dataHojeISO(),
      expirationDate: '',
      notes: '',
      invoiceAccessKey: '',
    },
  })

  useEffect(() => {
    async function carregarDados() {
      setLoadingDados(true)
      setError(null)
      try {
        const [produtosData, setoresData, locaisData] = await Promise.all([
          listarProdutos(),
          listarSetores(),
          listarLocais(),
        ])
        setProdutos(produtosData)
        setSetores(setoresData)
        setLocais(locaisData)
      } catch {
        setError('Nao foi possivel carregar os dados do formulario.')
      } finally {
        setLoadingDados(false)
      }
    }

    void carregarDados()
  }, [])

  async function onSubmit(values: LoteFormValues) {
    if (loggedUserId == null) {
      setError('Nao foi possivel identificar o usuario logado.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await criarLote(montarPayloadCriacao({ ...values, userId: loggedUserId }))
      reset()
      navigate('/estoque/lotes', { replace: true })
    } catch {
      setError('Nao foi possivel cadastrar a entrada.')
    } finally {
      setLoading(false)
    }
  }

  const formularioPronto =
    loggedUserId != null && produtos.length > 0 && setores.length > 0 && locais.length > 0

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Nova entrada
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/estoque/lotes')}
        >
          Voltar para listagem
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loadingDados ? (
        <Stack direction="row" alignItems="center" gap={1.5}>
          <CircularProgress size={20} />
          <Typography>Carregando dados do formulario...</Typography>
        </Stack>
      ) : null}

      {!loadingDados && loggedUserId == null ? (
        <Alert severity="error">Nao foi possivel identificar o usuario logado.</Alert>
      ) : null}

      {!loadingDados && loggedUserId != null && !formularioPronto ? (
        <Alert severity="warning">
          Cadastre produtos, setores e locais antes de criar uma entrada.
        </Alert>
      ) : null}

      {!loadingDados && formularioPronto ? (
        <Stack component="form" onSubmit={handleSubmit(onSubmit)}>
          <LoteForm
            register={register}
            control={control}
            errors={errors}
            setValue={setValue}
            produtos={produtos}
            setores={setores}
            locais={locais}
            exibirUsuario={false}
            exibirQuantidadeAtual={false}
            exibirInclusao={false}
            loading={loading}
            submitLabel="Cadastrar entrada"
          />
        </Stack>
      ) : null}
    </Stack>
  )
}
