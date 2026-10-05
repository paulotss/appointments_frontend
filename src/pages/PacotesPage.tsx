import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PacoteForm } from '../components/PacoteForm'
import { PacotesTable } from '../components/PacotesTable'
import type { PacoteFormValues } from '../schemas/pacote.schema'
import { listarProcedimentos } from '../services/procedures.service'
import {
  atualizarPacote,
  excluirPacote,
  listarPacotes,
} from '../services/procedure-packages.service'
import type { ProcedurePackage } from '../types/pacote'
import type { Procedure } from '../types/procedimento'
import { mensagemErroApi } from '../utils/apiError'

export function PacotesPage() {
  const navigate = useNavigate()
  const [pacotes, setPacotes] = useState<ProcedurePackage[]>([])
  const [procedimentos, setProcedimentos] = useState<Procedure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editando, setEditando] = useState<ProcedurePackage | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  async function carregar() {
    setLoading(true)
    setError(null)
    try {
      const [pacotesData, procedimentosData] = await Promise.all([
        listarPacotes(),
        listarProcedimentos(),
      ])
      setPacotes(pacotesData)
      setProcedimentos(procedimentosData)
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível carregar os pacotes.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void carregar()
  }, [])

  async function salvarEdicao(values: PacoteFormValues) {
    if (!editando) return
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarPacote(editando.id, {
        name: values.name.trim(),
        discountPercent: values.discountPercent,
        isActive: values.isActive,
        items: values.items,
      })
      setPacotes((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
      setEditando(null)
      setSuccess('Pacote atualizado com sucesso.')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível editar o pacote.'))
    } finally {
      setSavingEdit(false)
    }
  }

  async function excluir(pacote: ProcedurePackage) {
    const confirmou = window.confirm(`Confirma excluir o pacote "${pacote.name}"?`)
    if (!confirmou) return
    setError(null)
    setSuccess(null)
    try {
      await excluirPacote(pacote.id)
      setPacotes((prev) => prev.filter((item) => item.id !== pacote.id))
      setSuccess('Pacote excluído com sucesso.')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível excluir o pacote.'))
    }
  }

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Pacotes
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/pacotes/novo')}>
          Novo pacote
        </Button>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando pacotes...</Typography>
        </Paper>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {!loading && !error && pacotes.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum pacote cadastrado.</Typography>
        </Paper>
      ) : null}

      {!loading && pacotes.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <PacotesTable
            pacotes={pacotes}
            onEditar={setEditando}
            onExcluir={(item) => void excluir(item)}
          />
        </Paper>
      ) : null}

      <Dialog open={Boolean(editando)} onClose={() => setEditando(null)} fullWidth maxWidth="md">
        <DialogTitle>Editar pacote</DialogTitle>
        <DialogContent>
          {editando ? (
            <Box sx={{ mt: 1 }}>
              <PacoteForm
                key={editando.id}
                defaultValues={{
                  name: editando.name,
                  discountPercent: editando.discountPercent,
                  isActive: editando.isActive,
                  items: editando.items.map((item) => ({
                    procedureId: item.procedureId,
                    quantity: item.quantity,
                  })),
                }}
                procedimentos={procedimentos}
                loading={savingEdit}
                submitLabel="Salvar"
                onCancel={() => setEditando(null)}
                onSubmit={(values) => void salvarEdicao(values)}
              />
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>
    </Stack>
  )
}
