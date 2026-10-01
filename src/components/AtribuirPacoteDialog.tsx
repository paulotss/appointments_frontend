import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
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
import { listarPacotes } from '../services/procedure-packages.service'
import { atribuirPacoteAoPaciente } from '../services/patient-packages.service'
import type { ProcedurePackage } from '../types/pacote'
import { aplicarDescontoPercentual } from '../types/pacote'
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from '../types/financeiro'
import { mensagemErroApi } from '../utils/apiError'
import { formatarMoedaBRL, parseValorDecimal } from '../utils/moedaBRL'

interface AtribuirPacoteDialogProps {
  open: boolean
  patientId: number
  onClose: () => void
  onAssigned: () => void
}

export function AtribuirPacoteDialog({
  open,
  patientId,
  onClose,
  onAssigned,
}: AtribuirPacoteDialogProps) {
  const [pacotes, setPacotes] = useState<ProcedurePackage[]>([])
  const [packageId, setPackageId] = useState<number | ''>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingLista, setLoadingLista] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setPackageId('')
    setPaymentMethod('pix')
    setNotes('')
    setError(null)
    setLoadingLista(true)
    void listarPacotes({ isActive: true })
      .then(setPacotes)
      .catch((err) => {
        setPacotes([])
        setError(mensagemErroApi(err, 'Não foi possível carregar os pacotes.'))
      })
      .finally(() => setLoadingLista(false))
  }, [open])

  const selecionado = pacotes.find((item) => item.id === packageId) ?? null
  const linhas = useMemo(() => {
    if (!selecionado) return []
    return selecionado.items.map((item) => {
      const catalogo = parseValorDecimal(item.procedure?.value) || 0
      const unitValue = aplicarDescontoPercentual(catalogo, selecionado.discountPercent)
      return {
        id: item.id,
        nome: item.procedure?.name ?? `Procedimento #${item.procedureId}`,
        quantity: item.quantity,
        catalogo,
        unitValue,
        subtotal: unitValue * item.quantity,
      }
    })
  }, [selecionado])
  const bruto = linhas.reduce((sum, item) => sum + item.catalogo * item.quantity, 0)
  const total = linhas.reduce((sum, item) => sum + item.subtotal, 0)

  async function confirmar() {
    if (packageId === '') return
    setLoading(true)
    setError(null)
    try {
      await atribuirPacoteAoPaciente({
        patientId,
        packageId,
        paymentMethod,
        notes: notes.trim() || undefined,
      })
      onAssigned()
      onClose()
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível atribuir o pacote.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Atribuir pacote</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            select
            label="Pacote"
            value={packageId}
            onChange={(event) =>
              setPackageId(event.target.value === '' ? '' : Number(event.target.value))
            }
            disabled={loadingLista || loading}
          >
            <MenuItem value="" disabled>
              {loadingLista ? 'Carregando...' : 'Selecione um pacote'}
            </MenuItem>
            {pacotes.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name} ({item.discountPercent}%)
              </MenuItem>
            ))}
          </TextField>

          {selecionado ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Procedimento</TableCell>
                  <TableCell align="right">Valor</TableCell>
                  <TableCell align="right">Com desconto</TableCell>
                  <TableCell align="right">Qtd</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {linhas.map((linha) => (
                  <TableRow key={linha.id}>
                    <TableCell>{linha.nome}</TableCell>
                    <TableCell align="right">{formatarMoedaBRL(linha.catalogo)}</TableCell>
                    <TableCell align="right">{formatarMoedaBRL(linha.unitValue)}</TableCell>
                    <TableCell align="right">{linha.quantity}</TableCell>
                    <TableCell align="right">{formatarMoedaBRL(linha.subtotal)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={4}>Bruto (sem desconto)</TableCell>
                  <TableCell align="right">{formatarMoedaBRL(bruto)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4}>
                    <strong>Total a pagar</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{formatarMoedaBRL(total)}</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : null}

          <TextField
            select
            label="Forma de pagamento"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
            disabled={loading}
          >
            {PAYMENT_METHODS.map((metodo) => (
              <MenuItem key={metodo} value={metodo}>
                {PAYMENT_METHOD_LABELS[metodo]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Observações (opcional)"
            multiline
            minRows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={loading}
          />
          <Typography variant="body2" color="text.secondary">
            O pagamento do pacote é registrado agora. Os agendamentos só consomem a quantidade.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={() => void confirmar()}
          disabled={loading || packageId === ''}
        >
          {loading ? 'Registrando...' : 'Atribuir e receber'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
