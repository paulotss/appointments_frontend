import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { isAxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { RegistroForm } from '../components/RegistroForm'
import type { RegistroFormValues } from '../schemas/registro.schema'
import { atualizarChamada } from '../services/calls.service'
import { listarEspecialidades } from '../services/especialidades.service'
import { criarRegistro } from '../services/registros.service'
import type { Especialidade } from '../types/registro'

export function NovoRegistroPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([])
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { callIdParaPatch, contatoFixoChamada, formKey, voltarPath, voltarLabel } = useMemo(() => {
    const callIdRaw = searchParams.get('callId')
    const telefoneParam = searchParams.get('telefone')
    const origin = searchParams.get('origin')
    const telefone =
      telefoneParam != null && telefoneParam !== ''
        ? telefoneParam
        : origin != null && origin !== ''
          ? origin
          : null
    const callIdNum =
      callIdRaw != null && callIdRaw !== '' ? Number.parseInt(callIdRaw, 10) : Number.NaN
    const callIdOk = Number.isFinite(callIdNum)
    const fromCall = callIdOk && telefone != null && telefone !== ''
    return {
      callIdParaPatch: fromCall ? callIdNum : null,
      contatoFixoChamada: fromCall ? { telefone } : null,
      formKey: fromCall ? `call-${callIdNum}` : 'sem-chamada',
      voltarPath: fromCall ? '/chamadas' : '/registros',
      voltarLabel: fromCall ? 'Voltar para chamadas' : 'Voltar para listagem',
    }
  }, [searchParams])

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
      await criarRegistro({
        ...values,
        ...(callIdParaPatch != null ? { callId: callIdParaPatch } : {}),
      })
      if (callIdParaPatch != null) {
        try {
          await atualizarChamada(callIdParaPatch, { recordStatus: 'registered' })
        } catch {
          setError(
            'Registro criado, mas nao foi possivel atualizar o status da chamada. Atualize manualmente na lista de chamadas.',
          )
          return
        }
      }
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
          onClick={() => navigate(voltarPath)}
        >
          {voltarLabel}
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
          key={formKey}
          especialidades={especialidades}
          onSubmit={handleSubmit}
          loading={loadingSubmit}
          contatoFixoChamada={contatoFixoChamada}
        />
      ) : null}
    </Stack>
  )
}
