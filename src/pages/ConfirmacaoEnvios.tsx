import { Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { liberarEnvios, obterLiberacaoEnvios, pausarEnvios, type SendReleaseState } from '../services/confirmacao.service'
import type { CampaignDetail } from '../types/confirmacao'
import { mensagemErroApi } from '../utils/apiError'

export function ConfirmacaoEnvios({ campanha }: { campanha: CampaignDetail }) {
  const [state, setState] = useState<SendReleaseState | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    setState(null); setSelected([]); setConfirm(false); setError(null)
    void obterLiberacaoEnvios(campanha.id).then(value => {
      if (active) { setState(value); setSelected(value.itemIds.filter(id => value.eligibleItemIds.includes(id))) }
    }).catch(reason => { if (active) setError(mensagemErroApi(reason, 'Não foi possível consultar a liberação.')) })
    return () => { active = false }
  }, [campanha])
  async function change(pause: boolean) {
    if (!state || busy) return
    setBusy(true); setError(null); setConfirm(false)
    try {
      const next = pause ? await pausarEnvios(campanha.id, state.revision, state.version)
        : await liberarEnvios(campanha.id, state.revision, state.version, selected)
      setState(next)
    } catch (reason) { setError(mensagemErroApi(reason, 'Não foi possível alterar a liberação. Atualize antes de tentar novamente.')) }
    finally { setBusy(false) }
  }
  async function refresh() {
    if (busy) return
    setBusy(true); setError(null)
    try {
      const next = await obterLiberacaoEnvios(campanha.id)
      setState(next); setSelected(next.itemIds.filter(id => next.eligibleItemIds.includes(id)))
    } catch (reason) { setError(mensagemErroApi(reason, 'Não foi possível consultar a liberação.')) }
    finally { setBusy(false) }
  }
  return <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={2}>
    <Typography variant="h6">Envios da campanha</Typography>
    <Alert severity={state?.active ? 'success' : 'info'}>{state?.active
      ? 'Envios liberados para a seleção abaixo. A rotina envia durante o horário permitido, após nova conferência de cada agendamento.'
      : 'Novos envios não estão liberados. A aprovação administrativa não envia mensagens.'}</Alert>
    <Typography variant="body2">A liberação vale somente para os agendamentos selecionados nesta versão da campanha. Pausar bloqueia novas tentativas; uma mensagem que já começou a ser enviada pode chegar. As respostas às mensagens já enviadas continuam sendo tratadas.</Typography>
    {error && <Alert severity="error">{error}</Alert>}
    {campanha.items.filter(item => state?.eligibleItemIds.includes(item.id)).map(item => <FormControlLabel key={item.id}
      control={<Checkbox checked={selected.includes(item.id)} disabled={busy || state?.active}
        onChange={(_, checked) => setSelected(current => checked ? [...current, item.id] : current.filter(id => id !== item.id))} />}
      label={`${item.appointmentTime?.slice(0, 5) ?? ''} · ${item.displayName ?? 'Identificação indisponível'} · ${item.professionalName ?? 'Profissional não informado'}`} />)}
    <Stack direction="row" spacing={1}>
      <Button variant="contained" disabled={busy || !state || state.active || selected.length === 0} onClick={() => setConfirm(true)}>Liberar envios</Button>
      <Button variant="outlined" disabled={busy || !state?.active} onClick={() => void change(true)}>Pausar novos envios</Button>
      <Button disabled={busy} onClick={() => void refresh()}>Atualizar liberação</Button>
    </Stack>
    <Dialog open={confirm} onClose={() => setConfirm(false)}>
      <DialogTitle>Liberar mensagens desta campanha?</DialogTitle>
      <DialogContent>Você autoriza o envio real de WhatsApp para {selected.length} agendamento(s) selecionado(s). Respostas de confirmação poderão confirmar automaticamente o agendamento no Saúde Vianet, após as validações.</DialogContent>
      <DialogActions><Button onClick={() => setConfirm(false)}>Voltar</Button><Button onClick={() => void change(false)}>Autorizar envios selecionados</Button></DialogActions>
    </Dialog>
  </Stack></Paper>
}
