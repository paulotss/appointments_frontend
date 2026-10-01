import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PacoteForm } from '../components/PacoteForm'
import type { PacoteFormValues } from '../schemas/pacote.schema'
import { listarProcedimentos } from '../services/procedures.service'
import { criarPacote } from '../services/procedure-packages.service'
import type { Procedure } from '../types/procedimento'
import { mensagemErroApi } from '../utils/apiError'

export function NovoPacotePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingDados, setLoadingDados] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [procedimentos, setProcedimentos] = useState<Procedure[]>([])

  useEffect(() => {
    async function carregar() {
      setLoadingDados(true)
      setError(null)
      try {
        setProcedimentos(await listarProcedimentos())
      } catch (err) {
        setError(mensagemErroApi(err, 'Não foi possível carregar os procedimentos.'))
      } finally {
        setLoadingDados(false)
      }
    }
    void carregar()
  }, [])

  async function onSubmit(values: PacoteFormValues) {
    setLoading(true)
    setError(null)
    try {
      await criarPacote({
        name: values.name.trim(),
        discountPercent: values.discountPercent,
        isActive: values.isActive,
        items: values.items,
      })
      navigate('/pacotes', { replace: true })
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível cadastrar o pacote.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Novo pacote
        </Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/pacotes')}>
          Voltar para tabela
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loadingDados ? (
        <Stack direction="row" alignItems="center" gap={1.5}>
          <CircularProgress size={20} />
          <Typography>Carregando procedimentos...</Typography>
        </Stack>
      ) : null}

      {!loadingDados && procedimentos.length === 0 ? (
        <Alert severity="warning">Cadastre procedimentos antes de cadastrar um pacote.</Alert>
      ) : null}

      {!loadingDados && procedimentos.length > 0 ? (
        <Stack sx={{ maxWidth: 720 }}>
          <PacoteForm
            defaultValues={{
              name: '',
              discountPercent: 0,
              isActive: true,
              items: [{ procedureId: undefined, quantity: 1 }],
            }}
            procedimentos={procedimentos}
            loading={loading}
            submitLabel="Cadastrar pacote"
            onSubmit={(values) => void onSubmit(values)}
          />
        </Stack>
      ) : null}
    </Stack>
  )
}
