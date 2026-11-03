import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { criarCampanha, listarCampanhas } from '../services/confirmacao.service'
import {
  CAMPAIGN_STATUS_LABELS,
  RECIPIENT_STATE_LABELS,
  type CampaignRecipientState,
  type CampaignSourceKey,
  type CampaignSummary,
} from '../types/confirmacao'
import { mensagemErroApi } from '../utils/apiError'

const ESTADO_COR: Record<CampaignRecipientState, 'success' | 'warning' | 'default'> = {
  ELIGIBLE: 'success',
  PENDING: 'warning',
  UNAVAILABLE: 'default',
}

export function ConfirmacaoCampanhasPage() {
  const [campanhas, setCampanhas] = useState<CampaignSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aberto, setAberto] = useState(false)
  const [data, setData] = useState('')
  const [origem, setOrigem] = useState<CampaignSourceKey>('SAUDEVIANET')
  const [agendamento, setAgendamento] = useState('')
  const [paciente, setPaciente] = useState('')
  const [destinatario, setDestinatario] = useState('')
  const [telefone, setTelefone] = useState('')
  const [estado, setEstado] = useState<CampaignRecipientState>('PENDING')
  const [pendencia, setPendencia] = useState('verification_missing')
  const [salvando, setSalvando] = useState(false)
  const [erroModal, setErroModal] = useState<string | null>(null)

  async function carregar() {
    setCampanhas(await listarCampanhas())
  }

  useEffect(() => {
    void carregar()
      .catch((reason: unknown) => setError(mensagemErroApi(reason, 'Não foi possível listar as campanhas.')))
      .finally(() => setLoading(false))
  }, [])

  async function salvar() {
    setSalvando(true)
    setErroModal(null)
    try {
      await criarCampanha({
        campaignDate: data,
        source: origem,
        items: agendamento.trim()
          ? [
              {
                appointmentRef: agendamento.trim(),
                patientRef: paciente.trim() || null,
                recipientRef: destinatario.trim() || null,
                informedPhoneRef: telefone.trim() || null,
                recipientState: estado,
                reasonCode: pendencia.trim() || null,
              },
            ]
          : [],
      })
      setAberto(false)
      await carregar()
    } catch (reason) {
      setErroModal(mensagemErroApi(reason, 'Não foi possível abrir a campanha.'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5">Confirmação de agenda</Typography>
          <Typography color="text.secondary">
            A aprovação é administrativa. Esta tela não dispara mensagens.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAberto(true)}>
          Abrir campanha
        </Button>
      </Stack>
      <Alert severity="info">
        Apto, pendente e indisponível descrevem a revisão da recepção. Não autorizam o envio nem
        dispensam a revalidação de cada destinatário.
      </Alert>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? <Typography>Carregando campanhas.</Typography> : null}
      {!loading && campanhas.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary">Nenhuma campanha aberta.</Typography>
        </Paper>
      ) : null}
      {campanhas.length > 0 ? (
        <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Origem</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Analisados</TableCell>
              <TableCell>Aptos</TableCell>
              <TableCell>Pendências</TableCell>
              <TableCell>Indisponíveis</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {campanhas.map((campanha) => (
              <TableRow key={campanha.id} hover>
                <TableCell>{campanha.campaignDate}</TableCell>
                <TableCell>{campanha.sourceLabel}</TableCell>
                <TableCell>{CAMPAIGN_STATUS_LABELS[campanha.status]}</TableCell>
                <TableCell>{campanha.appointmentsAnalyzed}</TableCell>
                <TableCell>
                  <Chip size="small" color={ESTADO_COR.ELIGIBLE} label={campanha.eligibleRecipients} />
                </TableCell>
                <TableCell>
                  <Chip size="small" color={ESTADO_COR.PENDING} label={campanha.pendingVerifications} />
                </TableCell>
                <TableCell>
                  <Chip size="small" label={campanha.unavailableRecipients} />
                </TableCell>
                <TableCell>
                  <Button component={RouterLink} to={`/confirmacao/campanhas/${campanha.id}`} size="small">
                    Revisar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TableContainer>
      ) : null}

      <Dialog open={aberto} onClose={() => setAberto(false)} fullWidth maxWidth="sm">
        <DialogTitle>Abrir campanha</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            {erroModal ? <Alert severity="error">{erroModal}</Alert> : null}
            <TextField
              label="Data"
              type="date"
              value={data}
              onChange={(event) => setData(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField select label="Origem dos agendamentos" value={origem} onChange={(event) => setOrigem(event.target.value as CampaignSourceKey)}>
              <MenuItem value="SAUDEVIANET">Saúde Vianet</MenuItem>
              <MenuItem value="HIGIA">Higia</MenuItem>
            </TextField>
            <Typography variant="body2" color="text.secondary">
              A origem ainda não é consultada automaticamente. Informe a referência opaca do agendamento, se já houver uma pendência.
            </Typography>
            <TextField label="Referência do agendamento" value={agendamento} onChange={(event) => setAgendamento(event.target.value)} />
            <TextField label="Referência do paciente" value={paciente} onChange={(event) => setPaciente(event.target.value)} />
            <TextField label="Referência do destinatário" value={destinatario} onChange={(event) => setDestinatario(event.target.value)} />
            <TextField
              label="Referência do número informado"
              value={telefone}
              onChange={(event) => setTelefone(event.target.value)}
              helperText="Não cole o telefone. Use a referência opaca. Informar não comprova titularidade."
            />
            <TextField select label="Situação na revisão" value={estado} onChange={(event) => setEstado(event.target.value as CampaignRecipientState)}>
              {Object.entries(RECIPIENT_STATE_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </TextField>
            <TextField label="Código da pendência" value={pendencia} onChange={(event) => setPendencia(event.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAberto(false)}>Cancelar</Button>
          <Button variant="contained" disabled={salvando || data === ''} onClick={() => void salvar()}>
            Abrir
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
