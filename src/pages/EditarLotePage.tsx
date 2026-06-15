import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { LoteForm } from '../components/LoteForm'
import { loteSchema, type LoteFormValues } from '../schemas/lote.schema'
import { listarLocais } from '../services/storage-locations.service'
import { listarProdutos } from '../services/products.service'
import { atualizarLote, buscarLote, normalizarValorLote } from '../services/stock-batches.service'
import { listarSetores } from '../services/sectors.service'
import { listarUsuarios } from '../services/users.service'
import type { LocalArmazenamento, ProdutoConfig, Setor } from '../types/estoque'
import type { SystemUser } from '../types/user'
import { montarPayloadAtualizacao, toDataInputISO } from '../utils/loteForm'

export function EditarLotePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const loteId = Number(id)

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
    if (!Number.isFinite(loteId) || loteId <= 0) {
      setError('Lote invalido.')
      setLoadingDados(false)
      return
    }

    async function carregarDados() {
      setLoadingDados(true)
      setError(null)
      try {
        const [lote, produtosData, setoresData, locaisData, usuariosData] = await Promise.all([
          buscarLote(loteId),
          listarProdutos(),
          listarSetores(),
          listarLocais(),
          listarUsuarios(),
        ])

        setProdutos(produtosData)
        setSetores(setoresData)
        setLocais(locaisData)
        setUsuarios(usuariosData)

        reset({
          productId: lote.productId,
          sectorId: lote.sectorId,
          locationId: lote.locationId,
          userId: lote.userId,
          initialQuantity: lote.initialQuantity,
          currentQuantity: lote.currentQuantity,
          value: normalizarValorLote(lote.value) ?? undefined,
          movementDate: toDataInputISO(lote.movementDate),
          expirationDate: toDataInputISO(lote.expirationDate),
          notes: lote.notes ?? '',
          invoiceAccessKey: lote.invoiceAccessKey ? String(lote.invoiceAccessKey) : '',
        })
      } catch {
        setError('Nao foi possivel carregar o lote.')
      } finally {
        setLoadingDados(false)
      }
    }

    void carregarDados()
  }, [loteId, reset])

  async function onSubmit(values: LoteFormValues) {
    if (!Number.isFinite(loteId) || loteId <= 0) return

    setLoading(true)
    setError(null)
    try {
      await atualizarLote(loteId, montarPayloadAtualizacao(values))
      navigate('/estoque/lotes', { replace: true })
    } catch {
      setError('Nao foi possivel atualizar o lote.')
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
          Editar lote
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
          <Typography>Carregando lote...</Typography>
        </Stack>
      ) : null}

      {!loadingDados && !error && formularioPronto ? (
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
            submitLabel="Salvar alteracoes"
          />
        </Stack>
      ) : null}
    </Stack>
  )
}
