import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { criarLoteTiss } from '../services/billing-batches.service'
import { CampoData } from '../components/CampoData'
import { listarPlanosSaude } from '../services/health-plans.service'
import { listarTodasGuias } from '../services/insurance-guides.service'
import type { InsuranceGuide } from '../types/guia'
import { valorFaturavelGuia } from '../types/financeiro'
import type { HealthPlan } from '../types/planoSaude'
import { mensagemErroApi } from '../utils/apiError'
import { formatarDataISO, hojeLocalISO, isoDatePrefix, primeiroDiaDoMesLocalISO } from '../utils/dataISO'
import { formatarMoedaBRL } from '../utils/moedaBRL'

function normalizarPeriodo(dataInicio: string, dataFim: string) {
  return {
    from: dataInicio <= dataFim ? dataInicio : dataFim,
    to: dataFim >= dataInicio ? dataFim : dataInicio,
  }
}

export function NovoLoteTissPage() {
  const navigate = useNavigate()
  const [planos, setPlanos] = useState<HealthPlan[]>([])
  const [healthPlanId, setHealthPlanId] = useState<number | ''>('')
  const [dataInicio, setDataInicio] = useState(primeiroDiaDoMesLocalISO())
  const [dataFim, setDataFim] = useState(hojeLocalISO())
  const [protocolNumber, setProtocolNumber] = useState('')
  const [guias, setGuias] = useState<InsuranceGuide[]>([])
  const [selecionadas, setSelecionadas] = useState<number[]>([])
  const [loadingPlanos, setLoadingPlanos] = useState(true)
  const [loadingGuias, setLoadingGuias] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function carregarPlanos() {
      setLoadingPlanos(true)
      setError(null)
      try {
        setPlanos(await listarPlanosSaude())
      } catch (err) {
        setError(mensagemErroApi(err, 'Não foi possível carregar os planos de saúde.'))
      } finally {
        setLoadingPlanos(false)
      }
    }
    void carregarPlanos()
  }, [])

  useEffect(() => {
    if (healthPlanId === '') {
      setGuias([])
      setSelecionadas([])
      return
    }

    const planoId = healthPlanId
    let cancelado = false
    async function carregarGuias() {
      setLoadingGuias(true)
      setError(null)
      try {
        const data = await listarTodasGuias({
          healthPlanId: planoId,
          availableForBilling: true,
        })
        if (!cancelado) {
          setGuias(data)
          setSelecionadas([])
        }
      } catch (err) {
        if (!cancelado) {
          setError(mensagemErroApi(err, 'Não foi possível carregar as guias elegíveis.'))
          setGuias([])
        }
      } finally {
        if (!cancelado) setLoadingGuias(false)
      }
    }
    void carregarGuias()
    return () => {
      cancelado = true
    }
  }, [healthPlanId])

  const { from, to } = normalizarPeriodo(dataInicio, dataFim)
  const guiasFiltradas = useMemo(() => {
    return guias.filter((guia) => {
      const autorizacao = isoDatePrefix(guia.authorizationDate)
      if (from && autorizacao < from) return false
      if (to && autorizacao > to) return false
      return true
    })
  }, [guias, from, to])

  const idsVisiveis = useMemo(() => guiasFiltradas.map((item) => item.id), [guiasFiltradas])
  const todasSelecionadas =
    idsVisiveis.length > 0 && idsVisiveis.every((id) => selecionadas.includes(id))

  const totalSelecionado = useMemo(() => {
    return guias
      .filter((guia) => selecionadas.includes(guia.id))
      .reduce((sum, guia) => sum + valorFaturavelGuia(guia.procedures), 0)
  }, [guias, selecionadas])

  function alternarTodas() {
    if (todasSelecionadas) {
      setSelecionadas((prev) => prev.filter((id) => !idsVisiveis.includes(id)))
      return
    }
    setSelecionadas((prev) => [...new Set([...prev, ...idsVisiveis])])
  }

  function alternarGuia(id: number) {
    setSelecionadas((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  async function criar() {
    if (healthPlanId === '' || selecionadas.length === 0) return
    setSaving(true)
    setError(null)
    try {
      const protocolo = protocolNumber.trim()
      const criado = await criarLoteTiss({
        healthPlanId,
        insuranceGuideIds: selecionadas,
        ...(protocolo ? { protocolNumber: protocolo } : {}),
      })
      navigate(`/tiss/lotes/${criado.id}`, { replace: true })
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível criar o lote.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Novo lote
        </Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/tiss/lotes')}>
          Voltar para listagem
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loadingPlanos ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando planos...</Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                select
                label="Plano de saúde"
                value={healthPlanId}
                onChange={(event) =>
                  setHealthPlanId(event.target.value === '' ? '' : Number(event.target.value))
                }
                sx={{ minWidth: 260 }}
              >
                <MenuItem value="">Selecione</MenuItem>
                {planos.map((plano) => (
                  <MenuItem key={plano.id} value={plano.id}>
                    {plano.name}
                  </MenuItem>
                ))}
              </TextField>
              <CampoData
                label="Autorização de"
                value={dataInicio}
                onChange={setDataInicio}
              />
              <CampoData
                label="Autorização até"
                value={dataFim}
                onChange={setDataFim}
              />
              <TextField
                label="Protocolo"
                value={protocolNumber}
                onChange={(event) => setProtocolNumber(event.target.value)}
              />
            </Stack>

            {loadingGuias ? (
              <Stack direction="row" alignItems="center" gap={1.5}>
                <CircularProgress size={20} />
                <Typography>Carregando guias...</Typography>
              </Stack>
            ) : null}

            {healthPlanId === '' ? (
              <Typography>Selecione o plano de saúde para listar as guias elegíveis.</Typography>
            ) : null}

            {!loadingGuias && healthPlanId !== '' && guiasFiltradas.length === 0 ? (
              <Typography>Nenhuma guia elegível no período para este plano.</Typography>
            ) : null}

            {!loadingGuias && guiasFiltradas.length > 0 ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={todasSelecionadas}
                        indeterminate={selecionadas.some((id) => idsVisiveis.includes(id)) && !todasSelecionadas}
                        onChange={alternarTodas}
                        inputProps={{ 'aria-label': 'Selecionar todas as guias' }}
                      />
                    </TableCell>
                    <TableCell>Guia</TableCell>
                    <TableCell>Paciente</TableCell>
                    <TableCell>Profissional</TableCell>
                    <TableCell>Autorização</TableCell>
                    <TableCell align="right">Valor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {guiasFiltradas.map((guia) => (
                    <TableRow key={guia.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selecionadas.includes(guia.id)}
                          onChange={() => alternarGuia(guia.id)}
                          inputProps={{ 'aria-label': `Selecionar guia ${guia.id}` }}
                        />
                      </TableCell>
                      <TableCell>#{guia.id}</TableCell>
                      <TableCell>{guia.patient?.name ?? '—'}</TableCell>
                      <TableCell>{guia.healthProfessional?.name ?? '—'}</TableCell>
                      <TableCell>{formatarDataISO(guia.authorizationDate)}</TableCell>
                      <TableCell align="right">
                        {formatarMoedaBRL(valorFaturavelGuia(guia.procedures))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}

            <Typography>
              <strong>Selecionadas:</strong> {selecionadas.length} · <strong>Total:</strong>{' '}
              {formatarMoedaBRL(totalSelecionado)}
            </Typography>

            <Button
              variant="contained"
              onClick={() => void criar()}
              disabled={saving || healthPlanId === '' || selecionadas.length === 0}
              sx={{ alignSelf: 'flex-start' }}
            >
              {saving ? 'Criando...' : 'Criar lote'}
            </Button>
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}
