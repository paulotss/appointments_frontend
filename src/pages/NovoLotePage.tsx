import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { LoteForm } from '../components/LoteForm'
import { loteSchema, type LoteFormValues } from '../schemas/lote.schema'
import { listarLocais } from '../services/storage-locations.service'
import { listarProdutos } from '../services/products.service'
import { criarLote } from '../services/stock-batches.service'
import { listarSetores } from '../services/sectors.service'
import { listarUsuarios } from '../services/users.service'
import type { LocalArmazenamento, ProdutoConfig, Setor } from '../types/estoque'
import type { SystemUser } from '../types/user'
import { montarPayloadCriacao } from '../utils/loteForm'

export function NovoLotePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingDados, setLoadingDados] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [produtos, setProdutos] = useState<ProdutoConfig[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [locais, setLocais] = useState<LocalArmazenamento[]>([])
  const [usuarios, setUsuarios] = useState<SystemUser[]>([])

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<LoteFormValues>({
    resolver: zodResolver(loteSchema),
    defaultValues: {
      productId: undefined,
      sectorId: undefined,
      locationId: undefined,
      userId: undefined,
      initialQuantity: undefined,
      currentQuantity: undefined,
      value: undefined,
      movementDate: '',
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
        const [produtosData, setoresData, locaisData, usuariosData] = await Promise.all([
          listarProdutos(),
          listarSetores(),
          listarLocais(),
          listarUsuarios(),
        ])
        setProdutos(produtosData)
        setSetores(setoresData)
        setLocais(locaisData)
        setUsuarios(usuariosData)
      } catch {
        setError('Nao foi possivel carregar os dados do formulario.')
      } finally {
        setLoadingDados(false)
      }
    }

    void carregarDados()
  }, [])

  async function onSubmit(values: LoteFormValues) {
    setLoading(true)
    setError(null)
    try {
      await criarLote(montarPayloadCriacao(values))
      reset()
      navigate('/estoque/lotes', { replace: true })
    } catch {
      setError('Nao foi possivel cadastrar o lote.')
    } finally {
      setLoading(false)
    }
  }

  const formularioPronto =
    produtos.length > 0 && setores.length > 0 && locais.length > 0 && usuarios.length > 0

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Novo lote
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

      {!loadingDados && !formularioPronto ? (
        <Alert severity="warning">
          Cadastre produtos, setores, locais e usuarios antes de criar um lote.
        </Alert>
      ) : null}

      {!loadingDados && formularioPronto ? (
        <Stack component="form" onSubmit={handleSubmit(onSubmit)}>
          <LoteForm
            register={register}
            control={control}
            errors={errors}
            produtos={produtos}
            setores={setores}
            locais={locais}
            usuarios={usuarios}
            loading={loading}
            submitLabel="Cadastrar lote"
          />
        </Stack>
      ) : null}
    </Stack>
  )
}
