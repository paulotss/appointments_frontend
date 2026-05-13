import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RegistroForm } from '../components/RegistroForm'
import type { RegistroFormValues } from '../schemas/registro.schema'
import { listarEspecialidades } from '../services/especialidades.service'
import { criarRegistro } from '../services/registros.service'
import type { Especialidade } from '../types/registro'

export function NovoRegistroPage() {
  const navigate = useNavigate()
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([])
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function carregarEspecialidades() {
      setLoadingEspecialidades(true)
      setError(null)
      try {
        const data = await listarEspecialidades()
        setEspecialidades(data)
      } catch {
        setError('Nao foi possivel carregar as especialidades.')
      } finally {
        setLoadingEspecialidades(false)
      }
    }

    void carregarEspecialidades()
  }, [])

  async function handleSubmit(values: RegistroFormValues) {
    setError(null)
    setLoadingSubmit(true)
    try {
      await criarRegistro(values)
      navigate('/registros', { replace: true })
    } catch (err: unknown) {
      let mensagem = 'Nao foi possivel cadastrar o registro.'
      if (isAxiosError(err) && err.response?.data != null) {
        const data = err.response.data as { message?: unknown; error?: unknown }
        const apiMsg = data.message ?? data.error
        if (typeof apiMsg === 'string' && apiMsg.trim()) {
          mensagem = apiMsg.trim()
        } else if (Array.isArray(apiMsg) && apiMsg.length > 0) {
          mensagem = apiMsg.map(String).join('; ')
        }
      }
      setError(mensagem)
    } finally {
      setLoadingSubmit(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Novo registro
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/registros')}
        >
          Voltar para listagem
        </Button>
      </Stack>

      {loadingEspecialidades ? (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={20} />
          <Typography>Carregando especialidades...</Typography>
        </Stack>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      {!loadingEspecialidades ? (
        <RegistroForm
          especialidades={especialidades}
          onSubmit={handleSubmit}
          loading={loadingSubmit}
        />
      ) : null}
    </Stack>
  )
}
