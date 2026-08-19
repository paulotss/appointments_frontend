import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GuiasTable } from '../components/GuiasTable'
import { listarPlanosSaude } from '../services/health-plans.service'
import { listarProfissionais } from '../services/health-professionals.service'
import { atualizarGuia, excluirGuia, listarGuias } from '../services/insurance-guides.service'
import { listarPacientes } from '../services/patients.service'
import { listarProcedimentos } from '../services/procedures.service'
import {
  INSURANCE_GUIDE_STATUSES,
  INSURANCE_GUIDE_STATUS_LABELS,
  type InsuranceGuide,
  type InsuranceGuideStatus,
} from '../types/guia'
import type { Patient } from '../types/paciente'
import type { HealthPlan } from '../types/planoSaude'
import type { Procedure } from '../types/procedimento'
import type { HealthProfessional } from '../types/profissional'
import { mensagemErroApi } from '../utils/apiError'
import { adicionarDiasISO, statusPrazoGuia } from '../utils/dataISO'

function prazoDoPlano(guia: InsuranceGuide, planos: HealthPlan[]): number | undefined {
  return (
    guia.healthPlan?.submissionDeadlineDays ??
    planos.find((item) => item.id === guia.healthPlanId)?.submissionDeadlineDays
  )
}

type ProcedimentoEdicao = {
  procedureId: number | ''
  authorizedQuantity: string
  usedQuantity: number
}

export function GuiasPage() {
  const navigate = useNavigate()
  const [guias, setGuias] = useState<InsuranceGuide[]>([])
  const [pacientes, setPacientes] = useState<Patient[]>([])
  const [planos, setPlanos] = useState<HealthPlan[]>([])
  const [profissionais, setProfissionais] = useState<HealthProfessional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editando, setEditando] = useState<InsuranceGuide | null>(null)
  const [patientIdEdicao, setPatientIdEdicao] = useState<number | ''>('')
  const [healthPlanIdEdicao, setHealthPlanIdEdicao] = useState<number | ''>('')
  const [healthProfessionalIdEdicao, setHealthProfessionalIdEdicao] = useState<number | ''>('')
  const [statusEdicao, setStatusEdicao] = useState<InsuranceGuideStatus>('pending')
  const [startDateEdicao, setStartDateEdicao] = useState('')
  const [expirationDateEdicao, setExpirationDateEdicao] = useState('')
  const [procedimentosEdicao, setProcedimentosEdicao] = useState<ProcedimentoEdicao[]>([])
  const [procedimentosPlano, setProcedimentosPlano] = useState<Procedure[]>([])
  const [savingEdit, setSavingEdit] = useState(false)
  const [faturando, setFaturando] = useState<InsuranceGuide | null>(null)
  const [savingFaturar, setSavingFaturar] = useState(false)
  const [filtroPlanoId, setFiltroPlanoId] = useState<number | ''>('')
  const [filtroStatus, setFiltroStatus] = useState<InsuranceGuideStatus | ''>('')
  const [filtroPertoVencer, setFiltroPertoVencer] = useState(false)
  const [filtroMostrarFaturadas, setFiltroMostrarFaturadas] = useState(false)

  const profissionaisEdicao = useMemo(() => {
    return profissionais.filter((item) => item.isActive || item.id === healthProfessionalIdEdicao)
  }, [profissionais, healthProfessionalIdEdicao])

  const especialidadeIdsDoProfissional = useMemo(() => {
    const profissional = profissionais.find((item) => item.id === healthProfessionalIdEdicao)
    return new Set((profissional?.specialties ?? []).map((item) => item.specialtyId))
  }, [profissionais, healthProfessionalIdEdicao])

  const procedimentosElegiveis = useMemo(() => {
    if (especialidadeIdsDoProfissional.size === 0) return procedimentosPlano
    return procedimentosPlano.filter((item) => especialidadeIdsDoProfissional.has(item.specialtyId))
  }, [procedimentosPlano, especialidadeIdsDoProfissional])

  const prazoPlano =
    healthPlanIdEdicao === ''
      ? undefined
      : planos.find((item) => item.id === healthPlanIdEdicao)?.submissionDeadlineDays

  function recalcularValidade(startDate: string, prazo: number | undefined) {
    if (prazo == null || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return
    setExpirationDateEdicao(adicionarDiasISO(startDate, prazo))
  }

  function abrirEdicao(guia: InsuranceGuide) {
    const prazo = prazoDoPlano(guia, planos)
    setEditando(guia)
    setPatientIdEdicao(guia.patientId)
    setHealthPlanIdEdicao(guia.healthPlanId)
    setHealthProfessionalIdEdicao(guia.healthProfessionalId)
    setStatusEdicao(guia.status)
    setExpirationDateEdicao(guia.expirationDate)
    setStartDateEdicao(prazo != null ? adicionarDiasISO(guia.expirationDate, -prazo) : '')
    setProcedimentosEdicao(
      guia.procedures.length > 0
        ? guia.procedures.map((item) => ({
            procedureId: item.procedureId,
            authorizedQuantity: String(item.authorizedQuantity),
            usedQuantity: item.usedQuantity,
          }))
        : [{ procedureId: '', authorizedQuantity: '1', usedQuantity: 0 }],
    )
  }

  function fecharEdicao() {
    setEditando(null)
    setPatientIdEdicao('')
    setHealthPlanIdEdicao('')
    setHealthProfessionalIdEdicao('')
    setStatusEdicao('pending')
    setStartDateEdicao('')
    setExpirationDateEdicao('')
    setProcedimentosEdicao([])
    setProcedimentosPlano([])
  }

  async function salvarEdicao() {
    if (
      !editando ||
      patientIdEdicao === '' ||
      healthPlanIdEdicao === '' ||
      healthProfessionalIdEdicao === ''
    ) {
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDateEdicao)) {
      setError('Informe a data de início.')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expirationDateEdicao)) {
      setError('Informe a data de validade.')
      return
    }
    const procedures = procedimentosEdicao
      .filter((item) => item.procedureId !== '')
      .map((item) => ({
        procedureId: item.procedureId as number,
        authorizedQuantity: Number(item.authorizedQuantity),
        usedQuantity: item.usedQuantity,
      }))
    if (procedures.length < 1) {
      setError('Informe ao menos um procedimento.')
      return
    }
    if (new Set(procedures.map((item) => item.procedureId)).size !== procedures.length) {
      setError('Procedimentos duplicados não são permitidos.')
      return
    }
    if (procedures.some((item) => !Number.isInteger(item.authorizedQuantity) || item.authorizedQuantity < 1)) {
      setError('Quantidade autorizada deve ser um inteiro maior ou igual a 1.')
      return
    }
    if (procedures.some((item) => item.authorizedQuantity < item.usedQuantity)) {
      setError('A quantidade autorizada não pode ser menor que a quantidade já utilizada.')
      return
    }
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarGuia(editando.id, {
        patientId: patientIdEdicao,
        healthPlanId: healthPlanIdEdicao,
        healthProfessionalId: healthProfessionalIdEdicao,
        status: statusEdicao,
        expirationDate: expirationDateEdicao,
        procedures: procedures.map((item) => ({
          procedureId: item.procedureId,
          authorizedQuantity: item.authorizedQuantity,
        })),
      })
      setGuias((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
      fecharEdicao()
      setSuccess('Guia atualizada com sucesso.')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível editar a guia.'))
    } finally {
      setSavingEdit(false)
    }
  }

  function abrirFaturar(guia: InsuranceGuide) {
    setFaturando(guia)
  }

  function fecharFaturar() {
    if (savingFaturar) return
    setFaturando(null)
  }

  async function confirmarFaturar() {
    if (!faturando) return
    setSavingFaturar(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarGuia(faturando.id, { isBilled: true })
      setGuias((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
      setFaturando(null)
      setSuccess('Guia faturada com sucesso.')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível faturar a guia.'))
    } finally {
      setSavingFaturar(false)
    }
  }

  async function excluir(guia: InsuranceGuide) {
    const confirmou = window.confirm(
      `Confirma excluir a guia de ${guia.patient?.name ?? 'paciente'}?`,
    )
    if (!confirmou) return
    setError(null)
    setSuccess(null)
    try {
      await excluirGuia(guia.id)
      setGuias((prev) => prev.filter((item) => item.id !== guia.id))
      setSuccess('Guia excluída com sucesso.')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível excluir a guia.'))
    }
  }

  const startDateInvalida = !/^\d{4}-\d{2}-\d{2}$/.test(startDateEdicao)
  const expirationInvalida = !/^\d{4}-\d{2}-\d{2}$/.test(expirationDateEdicao)
  const proceduresInvalidos =
    procedimentosEdicao.length === 0 ||
    procedimentosEdicao.some((item) => {
      const qtd = Number(item.authorizedQuantity)
      return (
        item.procedureId === '' ||
        !Number.isInteger(qtd) ||
        qtd < 1 ||
        qtd < item.usedQuantity
      )
    }) ||
    new Set(procedimentosEdicao.map((item) => item.procedureId).filter((id) => id !== '')).size !==
      procedimentosEdicao.filter((item) => item.procedureId !== '').length
  const formInvalido =
    patientIdEdicao === '' ||
    healthPlanIdEdicao === '' ||
    healthProfessionalIdEdicao === '' ||
    proceduresInvalidos ||
    startDateInvalida ||
    expirationInvalida

  const guiasFiltradas = useMemo(() => {
    return guias.filter((guia) => {
      if (!filtroMostrarFaturadas && guia.isBilled) return false
      if (filtroPlanoId !== '' && guia.healthPlanId !== filtroPlanoId) return false
      if (filtroStatus !== '' && guia.status !== filtroStatus) return false
      if (filtroPertoVencer && statusPrazoGuia(guia.expirationDate) !== 'proxima') return false
      return true
    })
  }, [guias, filtroPlanoId, filtroStatus, filtroPertoVencer, filtroMostrarFaturadas])

  useEffect(() => {
    async function carregarDados() {
      setLoading(true)
      setError(null)
      try {
        const [guiasData, pacientesData, planosData, profissionaisData] = await Promise.all([
          listarGuias(),
          listarPacientes(),
          listarPlanosSaude(),
          listarProfissionais(),
        ])
        setGuias(guiasData)
        setPacientes(pacientesData)
        setPlanos(planosData)
        setProfissionais(profissionaisData)
      } catch (err) {
        setError(mensagemErroApi(err, 'Não foi possível carregar as guias.'))
      } finally {
        setLoading(false)
      }
    }

    void carregarDados()
  }, [])

  useEffect(() => {
    async function carregarProcedimentos() {
      if (healthPlanIdEdicao === '') {
        setProcedimentosPlano([])
        return
      }
      try {
        const data = await listarProcedimentos({ healthPlanId: healthPlanIdEdicao })
        setProcedimentosPlano(data)
      } catch {
        setProcedimentosPlano([])
      }
    }
    if (editando) {
      void carregarProcedimentos()
    }
  }, [healthPlanIdEdicao, editando])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Guias
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/guias/novo')}>
          Nova guia
        </Button>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando guias...</Typography>
        </Paper>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {!loading && !error ? (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} flexWrap="wrap">
          <Autocomplete
            options={planos}
            getOptionLabel={(plano) => plano.name}
            isOptionEqualToValue={(option, selected) => option.id === selected.id}
            value={planos.find((plano) => plano.id === filtroPlanoId) ?? null}
            onChange={(_, plano) => setFiltroPlanoId(plano?.id ?? '')}
            sx={{ minWidth: { xs: '100%', md: 240 } }}
            renderInput={(params) => (
              <TextField {...params} label="Plano de saúde" size="small" placeholder="Todos" />
            )}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={filtroStatus}
            onChange={(event) => setFiltroStatus(event.target.value as InsuranceGuideStatus | '')}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {INSURANCE_GUIDE_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {INSURANCE_GUIDE_STATUS_LABELS[status]}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={filtroPertoVencer}
                onChange={(_, checked) => setFiltroPertoVencer(checked)}
              />
            }
            label="Perto de vencer (7 dias)"
          />
          <FormControlLabel
            control={
              <Switch
                checked={filtroMostrarFaturadas}
                onChange={(_, checked) => setFiltroMostrarFaturadas(checked)}
              />
            }
            label="Mostrar faturadas"
          />
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ ml: { md: 'auto' } }}>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: 'success.light', borderRadius: 0.5 }} />
              Faturada
            </Typography>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: 'warning.light', borderRadius: 0.5 }} />
              Faltam até 7 dias
            </Typography>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: 'error.light', borderRadius: 0.5 }} />
              Último dia de validade
            </Typography>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: 'grey.300', borderRadius: 0.5 }} />
              Vencida
            </Typography>
          </Stack>
        </Stack>
      ) : null}

      {!loading && !error && guias.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhuma guia encontrada.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && guias.length > 0 && guiasFiltradas.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhuma guia encontrada para os filtros selecionados.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && guiasFiltradas.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <GuiasTable
            guias={guiasFiltradas}
            onEditar={abrirEdicao}
            onFaturar={abrirFaturar}
            onExcluir={(guia) => void excluir(guia)}
          />
        </Paper>
      ) : null}

      <Dialog open={Boolean(editando)} onClose={fecharEdicao} fullWidth maxWidth="md">
        <DialogTitle>Editar guia</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <Autocomplete
              options={pacientes}
              getOptionLabel={(paciente) => paciente.name}
              isOptionEqualToValue={(option, selected) => option.id === selected.id}
              value={pacientes.find((paciente) => paciente.id === patientIdEdicao) ?? null}
              onChange={(_, paciente) => setPatientIdEdicao(paciente?.id ?? '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Paciente"
                  error={patientIdEdicao === ''}
                  helperText={patientIdEdicao === '' ? 'Selecione o paciente' : ' '}
                />
              )}
            />
            <Autocomplete
              options={planos}
              getOptionLabel={(plano) => plano.name}
              isOptionEqualToValue={(option, selected) => option.id === selected.id}
              value={planos.find((plano) => plano.id === healthPlanIdEdicao) ?? null}
              onChange={(_, plano) => {
                setHealthPlanIdEdicao(plano?.id ?? '')
                if (plano) recalcularValidade(startDateEdicao, plano.submissionDeadlineDays)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Plano de saúde"
                  error={healthPlanIdEdicao === ''}
                  helperText={healthPlanIdEdicao === '' ? 'Selecione o plano de saúde' : ' '}
                />
              )}
            />
            <Autocomplete
              options={profissionaisEdicao}
              getOptionLabel={(profissional) => profissional.name}
              isOptionEqualToValue={(option, selected) => option.id === selected.id}
              value={
                profissionaisEdicao.find((profissional) => profissional.id === healthProfessionalIdEdicao) ??
                null
              }
              onChange={(_, profissional) => setHealthProfessionalIdEdicao(profissional?.id ?? '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Profissional"
                  error={healthProfessionalIdEdicao === ''}
                  helperText={healthProfessionalIdEdicao === '' ? 'Selecione o profissional' : ' '}
                />
              )}
            />
            <TextField
              select
              label="Status"
              value={statusEdicao}
              onChange={(event) => setStatusEdicao(event.target.value as InsuranceGuideStatus)}
            >
              {INSURANCE_GUIDE_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {INSURANCE_GUIDE_STATUS_LABELS[status]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Data de início"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={startDateEdicao}
              onChange={(event) => {
                const next = event.target.value
                setStartDateEdicao(next)
                recalcularValidade(next, prazoPlano)
              }}
              error={startDateInvalida}
              helperText={startDateInvalida ? 'Informe a data de início' : ' '}
            />
            <TextField
              label="Data de validade"
              type="date"
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
              value={expirationDateEdicao}
              error={expirationInvalida}
              helperText={
                expirationInvalida
                  ? 'Informe a data de validade'
                  : prazoPlano != null
                    ? `Calculada com base na data de início + prazo do plano (${prazoPlano} dias).`
                    : ' '
              }
            />

            <Typography variant="subtitle2" fontWeight={700}>
              Procedimentos
            </Typography>
            {procedimentosEdicao.map((item, index) => {
              const selecionados = procedimentosEdicao
                .map((row, rowIndex) => (rowIndex === index ? undefined : row.procedureId))
                .filter((id): id is number => typeof id === 'number')
              const opcoes = procedimentosElegiveis.filter(
                (proc) => !selecionados.includes(proc.id) || proc.id === item.procedureId,
              )
              const qtd = Number(item.authorizedQuantity)
              const qtdInvalida = !Number.isInteger(qtd) || qtd < 1 || qtd < item.usedQuantity
              const podeRemover = item.usedQuantity === 0

              return (
                <Stack key={`${item.procedureId}-${index}`} direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    select
                    label="Procedimento"
                    value={item.procedureId}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      setProcedimentosEdicao((prev) =>
                        prev.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, procedureId: value } : row,
                        ),
                      )
                    }}
                    error={item.procedureId === ''}
                    helperText={item.procedureId === '' ? 'Selecione o procedimento' : ' '}
                    sx={{ flex: 1, minWidth: 220 }}
                    disabled={item.usedQuantity > 0}
                  >
                    <MenuItem value="" disabled>
                      Selecione
                    </MenuItem>
                    {opcoes.map((proc) => (
                      <MenuItem key={proc.id} value={proc.id}>
                        {proc.name} ({proc.tissCode})
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Autorizado"
                    type="number"
                    inputProps={{ min: Math.max(1, item.usedQuantity), step: 1 }}
                    value={item.authorizedQuantity}
                    onChange={(event) => {
                      const value = event.target.value
                      setProcedimentosEdicao((prev) =>
                        prev.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, authorizedQuantity: value } : row,
                        ),
                      )
                    }}
                    error={qtdInvalida}
                    helperText={
                      qtdInvalida
                        ? item.usedQuantity > 0
                          ? `Mínimo ${item.usedQuantity} (já utilizado)`
                          : 'Informe um inteiro ≥ 1'
                        : ' '
                    }
                    sx={{ width: { xs: '100%', sm: 140 } }}
                  />
                  <TextField
                    label="Utilizado"
                    value={item.usedQuantity}
                    InputProps={{ readOnly: true }}
                    sx={{ width: { xs: '100%', sm: 120 } }}
                  />
                  <TextField
                    label="Saldo"
                    value={Math.max(0, (Number.isFinite(qtd) ? qtd : 0) - item.usedQuantity)}
                    InputProps={{ readOnly: true }}
                    sx={{ width: { xs: '100%', sm: 120 } }}
                  />
                  <IconButton
                    aria-label="Remover procedimento"
                    onClick={() =>
                      setProcedimentosEdicao((prev) => prev.filter((_, rowIndex) => rowIndex !== index))
                    }
                    disabled={!podeRemover || procedimentosEdicao.length === 1}
                    sx={{ mt: 0.5 }}
                    title={
                      !podeRemover
                        ? 'Não é possível remover procedimento com quantidade utilizada'
                        : 'Remover'
                    }
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              )
            })}
            <Button
              type="button"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() =>
                setProcedimentosEdicao((prev) => [
                  ...prev,
                  { procedureId: '', authorizedQuantity: '1', usedQuantity: 0 },
                ])
              }
              sx={{ alignSelf: 'flex-start' }}
            >
              Adicionar procedimento
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharEdicao}>Cancelar</Button>
          <Button onClick={() => void salvarEdicao()} variant="contained" disabled={savingEdit || formInvalido}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(faturando)} onClose={fecharFaturar} fullWidth maxWidth="sm">
        <DialogTitle>Faturar guia</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 0.5 }}>
            Confirma o faturamento desta guia? Guias faturadas não podem ser associadas a novos agendamentos.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharFaturar} disabled={savingFaturar}>
            Cancelar
          </Button>
          <Button onClick={() => void confirmarFaturar()} variant="contained" disabled={savingFaturar}>
            {savingFaturar ? 'Faturando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
