import { Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { consultarNovosAgendamentos, incluirNovosAgendamentos, obterCampanha, type NewCampaignAppointments } from '../services/confirmacao.service'
import { RECIPIENT_STATE_LABELS, type CampaignDetail } from '../types/confirmacao'
import { mensagemErroApi } from '../utils/apiError'

export function ConfirmacaoNovosAgendamentos({ campanha, busy, onBusy, onUpdated }: {
  campanha: CampaignDetail; busy: boolean; onBusy: (busy: boolean) => void; onUpdated: (campaign: CampaignDetail) => void
}) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<NewCampaignAppointments | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [uncertain, setUncertain] = useState(false)
  const alive = useRef(true)
  const inflight = useRef(false)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => { setOpen(false); setPreview(null); setSelected([]); setError(null); setUncertain(false) }, [campanha])
  async function run(action: () => Promise<void>) {
    if (busy || inflight.current) return
    inflight.current = true; onBusy(true)
    try { await action() }
    finally { inflight.current = false; if (alive.current) onBusy(false) }
  }
  async function consult() {
    setError(null); setPreview(null); setSelected([]); setUncertain(false); setOpen(true)
    try {
      const result = await consultarNovosAgendamentos(campanha.id)
      if (alive.current) setPreview(result)
    } catch (reason) { if (alive.current) setError(mensagemErroApi(reason, 'Não foi possível consultar novos agendamentos.')) }
  }
  async function include() {
    if (!preview || !selected.length || uncertain) return
    setError(null)
    try {
      const result = await incluirNovosAgendamentos(campanha.id, preview.revision, preview.sourceRevision, selected)
      if (alive.current) { setOpen(false); setPreview(null); setSelected([]); onUpdated(result) }
    } catch (reason) {
      if (alive.current) { setUncertain(true); setError(mensagemErroApi(reason, 'Não foi possível confirmar o resultado da inclusão.')) }
    }
  }
  async function check() {
    setError(null)
    try {
      const result = await obterCampanha(campanha.id)
      if (alive.current) { setOpen(false); onUpdated(result) }
    } catch (reason) { if (alive.current) setError(mensagemErroApi(reason, 'Não foi possível conferir a campanha.')) }
  }
  return <>
    <Button variant="outlined" disabled={busy || campanha.status === 'APPROVED'} onClick={() => void run(consult)}>Consultar novos agendamentos</Button>
    <Dialog open={open} onClose={() => { if (!busy && !uncertain) setOpen(false) }} fullWidth maxWidth="md">
      <DialogTitle>Incluir novos agendamentos</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        <Alert severity="info">Selecione somente os novos agendamentos que deseja incluir. Os itens e o histórico existentes serão preservados. Esta ação não envia mensagens; será necessário aprovar e liberar os envios novamente.</Alert>
        {busy && !preview ? <Typography>Consultando agenda...</Typography> : null}
        {error && <Alert severity="error">{error}</Alert>}
        {uncertain && <Alert severity="warning">Confira a campanha antes de fazer outra inclusão. A consulta não repete a gravação.</Alert>}
        {preview && preview.items.length === 0 && <Typography>Nenhum novo agendamento encontrado.</Typography>}
        {preview?.items.map(item => <FormControlLabel key={item.appointmentRef}
          control={<Checkbox checked={selected.includes(item.appointmentRef)} disabled={busy || uncertain || item.identityStatus !== 'ready'}
            onChange={(_, checked) => setSelected(current => checked ? [...current, item.appointmentRef] : current.filter(ref => ref !== item.appointmentRef))} />}
          label={`${item.appointmentTime?.slice(0, 5) ?? ''} · ${item.displayName ?? 'Identificação indisponível'} · ${item.professionalName ?? 'Profissional não informado'} · ${item.maskedPhone ?? 'Contato indisponível'} · ${RECIPIENT_STATE_LABELS[item.recipientState]}`} />)}
      </Stack></DialogContent>
      <DialogActions>
        <Button disabled={busy} onClick={() => { setOpen(false) }}>Fechar</Button>
        {uncertain ? <Button disabled={busy} onClick={() => void run(check)}>Conferir campanha</Button>
          : <Button variant="contained" disabled={busy || !preview || !selected.length} onClick={() => void run(include)}>Incluir selecionados</Button>}
      </DialogActions>
    </Dialog>
  </>
}
