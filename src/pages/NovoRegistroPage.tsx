import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RegistroForm } from '../components/RegistroForm'
import type { RegistroFormValues } from '../schemas/registro.schema'
import {
  listarEspecialidades,
  listarEspecialidadesPorIds,
} from '../services/especialidades.service'
import { criarRegistro, listarRegistros } from '../services/registros.service'
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
        const registros = await listarRegistros()
        const specialtyIds = registros
          .map((registro) => registro.especialidade_id)
          .filter((id): id is number => id > 0)

        const data =
          specialtyIds.length > 0
            ? await listarEspecialidadesPorIds(specialtyIds)
            : await listarEspecialidades()
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
    } catch {
      setError('Nao foi possivel cadastrar o registro.')
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
