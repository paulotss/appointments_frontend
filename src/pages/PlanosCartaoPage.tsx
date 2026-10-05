import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlanoCartaoForm } from '../components/PlanoCartaoForm'
import type { PlanoCartaoFormValues } from '../schemas/cartao.schema'
import { listarProcedimentos } from '../services/procedures.service'
import {
  atualizarPlanoCartao,
  excluirPlanoCartao,
  listarPlanosCartao,
} from '../services/benefit-plans.service'
import { BENEFIT_KIND_LABELS, type BenefitPlan } from '../types/cartao'
import type { Procedure } from '../types/procedimento'
import { mensagemErroApi } from '../utils/apiError'
import { formatarMoedaBRL } from '../utils/moedaBRL'

function payloadDoFormulario(values: PlanoCartaoFormValues) {
  return {
    name: values.name.trim(),
    annualPrice: values.annualPrice,
    adhesionFee: values.adhesionFee,
    dependentFee: values.dependentFee,
    isActive: values.isActive,
    benefits: values.benefits.map((benefit) =>
      benefit.kind === 'quota'
        ? {
            title: benefit.title.trim(),
            description: benefit.description?.trim() || undefined,
            kind: benefit.kind,
            quantity: benefit.quantity,
            procedureIds: benefit.procedureIds,
          }
        : {
            title: benefit.title.trim(),
            description: benefit.description?.trim() || undefined,
            kind: benefit.kind,
            discountPercent: benefit.discountPercent,
          },
    ),
  }
}

export function PlanosCartaoPage() {
  const navigate = useNavigate()
  const [planos, setPlanos] = useState<BenefitPlan[]>([])
  const [procedimentos, setProcedimentos] = useState<Procedure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editando, setEditando] = useState<BenefitPlan | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  async function carregar() {
    setLoading(true)
    setError(null)
    try {
      const [planosData, procedimentosData] = await Promise.all([
        listarPlanosCartao(),
        listarProcedimentos(),
      ])
      setPlanos(planosData)
      setProcedimentos(procedimentosData)
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível carregar os planos do cartão.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void carregar()
  }, [])

  async function salvarEdicao(values: PlanoCartaoFormValues) {
    if (!editando) return
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarPlanoCartao(editando.id, payloadDoFormulario(values))
      setPlanos((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
      setEditando(null)
      setSuccess('Plano atualizado.')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível editar o plano.'))
    } finally {
      setSavingEdit(false)
    }
  }

  async function excluir(plano: BenefitPlan) {
    const confirmou = window.confirm(`Remover o plano "${plano.name}"?`)
    if (!confirmou) return
    setError(null)
    setSuccess(null)
    try {
      await excluirPlanoCartao(plano.id)
      setPlanos((prev) => prev.filter((item) => item.id !== plano.id))
      setSuccess('Plano removido.')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível remover o plano.'))
    }
  }

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Planos do cartão
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/cartao/planos/novo')}>
          Novo plano
        </Button>
      </Box>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}
      {loading ? (
        <Stack direction="row" alignItems="center" gap={1.5}>
          <CircularProgress size={20} />
          <Typography>Carregando planos...</Typography>
        </Stack>
      ) : null}
      {!loading ? (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell align="right">Anuidade</TableCell>
                <TableCell>Benefícios</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {planos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>Nenhum plano cadastrado.</TableCell>
                </TableRow>
              ) : (
                planos.map((plano) => (
                  <TableRow key={plano.id} hover>
                    <TableCell>{plano.name}</TableCell>
                    <TableCell align="right">{formatarMoedaBRL(plano.annualPrice)}</TableCell>
                    <TableCell>
                      {plano.benefits
                        .map((benefit) =>
                          benefit.kind === 'discount'
                            ? `${benefit.title} (${benefit.discountPercent}%)`
                            : `${benefit.title} (${BENEFIT_KIND_LABELS[benefit.kind]} ${benefit.quantity})`,
                        )
                        .join(', ')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={plano.isActive ? 'Ativo' : 'Inativo'}
                        color={plano.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => setEditando(plano)}>
                        Editar
                      </Button>
                      <Button size="small" color="error" onClick={() => void excluir(plano)}>
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      ) : null}

      <Dialog open={editando != null} onClose={() => setEditando(null)} fullWidth maxWidth="md">
        <DialogTitle>Editar plano</DialogTitle>
        <DialogContent>
          {editando ? (
            <Box sx={{ mt: 1 }}>
              <PlanoCartaoForm
                procedimentos={procedimentos}
                loading={savingEdit}
                submitLabel="Salvar"
                onCancel={() => setEditando(null)}
                onSubmit={(values) => void salvarEdicao(values)}
                defaultValues={{
                  name: editando.name,
                  annualPrice: editando.annualPrice,
                  adhesionFee: editando.adhesionFee,
                  dependentFee: editando.dependentFee,
                  isActive: editando.isActive,
                  benefits: editando.benefits.map((benefit) => ({
                    title: benefit.title,
                    description: benefit.description ?? '',
                    kind: benefit.kind,
                    quantity: benefit.quantity ?? 1,
                    discountPercent: benefit.discountPercent ?? 0,
                    procedureIds: benefit.procedures.map((item) => item.procedureId),
                  })),
                }}
              />
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>
    </Stack>
  )
}
