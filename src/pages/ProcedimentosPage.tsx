import AddIcon from '@mui/icons-material/Add'
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
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProcedimentoForm } from '../components/ProcedimentoForm'
import { ProcedimentosTable } from '../components/ProcedimentosTable'
import { listarEspecialidades } from '../services/especialidades.service'
import { listarPlanosSaude } from '../services/health-plans.service'
import {
  atualizarProcedimento,
  excluirProcedimento,
  listarProcedimentos,
} from '../services/procedures.service'
import type { Procedure } from '../types/procedimento'
import type { HealthPlan } from '../types/planoSaude'
import type { Especialidade } from '../types/registro'
import { mensagemErroApi } from '../utils/apiError'
import { parseValorDecimal } from '../utils/moedaBRL'
import type { ProcedimentoFormValues } from '../schemas/procedimento.schema'

export function ProcedimentosPage() {
  const navigate = useNavigate()
  const [procedimentos, setProcedimentos] = useState<Procedure[]>([])
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([])
  const [planos, setPlanos] = useState<HealthPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [filtroEspecialidadeId, setFiltroEspecialidadeId] = useState<number | ''>('')
  const [editando, setEditando] = useState<Procedure | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const procedimentosFiltrados = useMemo(() => {
    if (filtroEspecialidadeId === '') return procedimentos
    return procedimentos.filter((item) => item.specialtyId === filtroEspecialidadeId)
  }, [procedimentos, filtroEspecialidadeId])

  async function carregar() {
    setLoading(true)
    setError(null)
    try {
      const [procedimentosData, especialidadesData, planosData] = await Promise.all([
        listarProcedimentos(
          filtroEspecialidadeId === '' ? undefined : { specialtyId: filtroEspecialidadeId },
        ),
        listarEspecialidades(),
        listarPlanosSaude(),
      ])
      setProcedimentos(procedimentosData)
      setEspecialidades(especialidadesData)
      setPlanos(planosData)
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível carregar os procedimentos.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void carregar()
    // Recarrega quando o filtro de especialidade muda para usar o query param da API.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEspecialidadeId])

  function fecharEdicao() {
    setEditando(null)
  }

  async function salvarEdicao(values: ProcedimentoFormValues) {
    if (!editando) return
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarProcedimento(editando.id, {
        specialtyId: values.specialtyId,
        name: values.name.trim(),
        value: values.value,
        healthPlanPrices: values.healthPlanPrices,
      })
      setProcedimentos((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
      fecharEdicao()
      setSuccess('Procedimento atualizado com sucesso.')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível editar o procedimento.'))
    } finally {
      setSavingEdit(false)
    }
  }

  async function excluir(procedimento: Procedure) {
    const confirmou = window.confirm(`Confirma excluir o procedimento "${procedimento.name}"?`)
    if (!confirmou) return
    setError(null)
    setSuccess(null)
    try {
      await excluirProcedimento(procedimento.id)
      setProcedimentos((prev) => prev.filter((item) => item.id !== procedimento.id))
      setSuccess('Procedimento excluído com sucesso.')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível excluir o procedimento.'))
    }
  }

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Procedimentos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/procedimentos/novo')}
        >
          Novo procedimento
        </Button>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando procedimentos...</Typography>
        </Paper>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {!loading ? (
        <Autocomplete
          options={especialidades}
          getOptionLabel={(item) => item.nome}
          isOptionEqualToValue={(option, selected) => option.id === selected.id}
          value={especialidades.find((item) => item.id === filtroEspecialidadeId) ?? null}
          onChange={(_, item) => setFiltroEspecialidadeId(item?.id ?? '')}
          sx={{ minWidth: { xs: '100%', md: 280 }, maxWidth: 360 }}
          renderInput={(params) => (
            <TextField {...params} label="Especialidade" size="small" placeholder="Todas" />
          )}
        />
      ) : null}

      {!loading && !error && procedimentosFiltrados.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum procedimento encontrado.</Typography>
        </Paper>
      ) : null}

      {!loading && procedimentosFiltrados.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <ProcedimentosTable
            procedimentos={procedimentosFiltrados}
            onEditar={setEditando}
            onExcluir={(item) => void excluir(item)}
          />
        </Paper>
      ) : null}

      <Dialog open={Boolean(editando)} onClose={fecharEdicao} fullWidth maxWidth="sm">
        <DialogTitle>Editar procedimento</DialogTitle>
        <DialogContent>
          {editando ? (
            <Box sx={{ mt: 1 }}>
              <ProcedimentoForm
                key={editando.id}
                defaultValues={{
                  specialtyId: editando.specialtyId,
                  name: editando.name,
                  value: parseValorDecimal(editando.value),
                  healthPlanPrices: editando.healthPlanPrices.map((item) => ({
                    healthPlanId: item.healthPlanId,
                    tissCode: item.tissCode,
                    value: parseValorDecimal(item.value),
                  })),
                }}
                especialidades={especialidades}
                planos={planos}
                loading={savingEdit}
                submitLabel="Salvar"
                onSubmit={(values) => void salvarEdicao(values)}
              />
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharEdicao}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
