import AddIcon from '@mui/icons-material/Add'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { AtribuirPacoteDialog } from './AtribuirPacoteDialog'
import {
  cancelarPacoteDoPaciente,
  listarPacotesDoPaciente,
} from '../services/patient-packages.service'
import type { PatientPackage } from '../types/pacote'
import { PATIENT_PACKAGE_STATUS_LABELS } from '../types/pacote'
import { mensagemErroApi } from '../utils/apiError'
import { formatarMoedaBRL } from '../utils/moedaBRL'

interface PacientePacotesSecaoProps {
  patientId: number
}

function corStatus(status: PatientPackage['status']) {
  if (status === 'active') return 'success'
  if (status === 'exhausted') return 'default'
  return 'warning'
}

export function PacientePacotesSecao({ patientId }: PacientePacotesSecaoProps) {
  const [pacotes, setPacotes] = useState<PatientPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dialogAberto, setDialogAberto] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setPacotes(await listarPacotesDoPaciente(patientId))
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível carregar os pacotes do paciente.'))
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function cancelar(item: PatientPackage) {
    const confirmou = window.confirm(
      `Cancelar o pacote "${item.package?.name ?? `#${item.id}`}"? O pagamento não será estornado.`,
    )
    if (!confirmou) return
    setError(null)
    setSuccess(null)
    try {
      await cancelarPacoteDoPaciente(item.id)
      setSuccess('Pacote cancelado.')
      await carregar()
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível cancelar o pacote.'))
    }
  }

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Typography variant="subtitle1" fontWeight={700}>
          Pacotes
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setDialogAberto(true)}
        >
          Atribuir pacote
        </Button>
      </Stack>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}
      {loading ? (
        <Stack direction="row" alignItems="center" gap={1}>
          <CircularProgress size={16} />
          <Typography variant="body2">Carregando pacotes...</Typography>
        </Stack>
      ) : null}
      {!loading && pacotes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nenhum pacote.
        </Typography>
      ) : null}
      {!loading && pacotes.length > 0
        ? pacotes.map((pacote) => (
            <Accordion
              key={pacote.id}
              disableGutters
              elevation={0}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden',
                '&:before': { display: 'none' },
                '&.Mui-expanded': { margin: 0 },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={1}
                  sx={{ width: '100%', pr: 1 }}
                >
                  <Typography variant="subtitle2">
                    {pacote.package?.name ?? `Pacote #${pacote.packageId}`}
                  </Typography>
                  <Chip
                    size="small"
                    label={PATIENT_PACKAGE_STATUS_LABELS[pacote.status]}
                    color={corStatus(pacote.status)}
                  />
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Procedimento</TableCell>
                        <TableCell align="right">Saldo</TableCell>
                        <TableCell align="right">Valor</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pacote.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.procedure?.name ?? `#${item.procedureId}`}</TableCell>
                          <TableCell align="right">
                            {item.remainingQuantity} de {item.quantity}
                          </TableCell>
                          <TableCell align="right">{formatarMoedaBRL(item.unitValue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {pacote.status === 'active' && pacote.items.every((item) => item.usedQuantity === 0) ? (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => void cancelar(pacote)}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Cancelar atribuição
                    </Button>
                  ) : null}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))
        : null}
      <AtribuirPacoteDialog
        open={dialogAberto}
        patientId={patientId}
        onClose={() => setDialogAberto(false)}
        onAssigned={() => {
          setSuccess('Pacote atribuído e pago.')
          void carregar()
        }}
      />
    </Stack>
  )
}
