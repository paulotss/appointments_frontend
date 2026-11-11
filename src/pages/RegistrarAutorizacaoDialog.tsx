import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material'
import { useRef, useState } from 'react'
import { listarAutorizacoes, registrarAutorizacao } from '../services/confirmacao.service'
import { mensagemErroApi } from '../utils/apiError'

export type AlvoAutorizacao = { patientRef: string; recipientRef: string }
const referencia = /^[a-z0-9][a-z0-9_.:-]{0,63}$/

export function RegistrarAutorizacaoDialog({ alvo, onClose, onSaved }: {
  alvo: AlvoAutorizacao
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const emAndamento = useRef(false)
  const [fundamento, setFundamento] = useState('')
  const [evidencia, setEvidencia] = useState('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [registrada, setRegistrada] = useState(false)
  const [incerto, setIncerto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const bloqueado = salvando || registrada || incerto

  async function atualizar() {
    setSalvando(true)
    try { await onSaved(); onClose() }
    catch { setErro('Autorização registrada. Não foi possível atualizar a consulta; tente atualizar novamente.') }
    finally { setSalvando(false) }
  }

  async function salvar() {
    if (bloqueado || emAndamento.current) return
    setErro(null)
    const base = fundamento.trim(), prova = evidencia.trim()
    const de = new Date(inicio), ate = new Date(fim)
    if (!referencia.test(base) || !referencia.test(prova)) {
      setErro('Informe as referências do fundamento e da evidência já existentes: até 64 caracteres, com letras minúsculas, números, ponto, dois-pontos, hífen ou sublinhado.')
      return
    }
    if (!inicio || !fim || !Number.isFinite(de.getTime()) || !Number.isFinite(ate.getTime()) || ate <= de) {
      setErro('Informe o início e o fim da validade. O fim precisa ser posterior ao início.')
      return
    }
    emAndamento.current = true
    setSalvando(true)
    try {
      // An uncertain previous submission must be looked up, never blindly submitted again.
      const existentes = await listarAutorizacoes(alvo.patientRef)
      if (existentes.some(item => item.recipientRef === alvo.recipientRef && item.evidenceRef === prova)) {
        setErro('Esta evidência já tem autorização registrada para este destinatário. Consulte o histórico antes de criar outro registro.')
        return
      }
      try {
        await registrarAutorizacao({ ...alvo, purpose: 'appointment_contact', channel: 'whatsapp',
          legalBasis: base, evidenceRef: prova, validFrom: de.toISOString(), expiresAt: ate.toISOString() })
      } catch (reason) {
        const status = (reason as { response?: { status?: number } })?.response?.status
        if (!status || status >= 500 || status === 408) {
          setIncerto(true)
          setErro('Não foi possível comprovar se o registro foi concluído. Consulte o histórico antes de tentar novamente; o pedido não será repetido automaticamente.')
        } else setErro(mensagemErroApi(reason, 'O registro foi recusado. Confira os dados e as permissões.'))
        return
      }
      setRegistrada(true)
      try { await onSaved(); onClose() }
      catch { setErro('Autorização registrada. Não foi possível atualizar a consulta; use Atualizar consulta. O registro não será repetido.') }
    } catch (reason) {
      setErro(mensagemErroApi(reason, 'Não foi possível conferir as autorizações existentes. Nenhum registro foi enviado.'))
    } finally { emAndamento.current = false; setSalvando(false) }
  }

  return (
    <Dialog open onClose={salvando ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Registrar autorização de contato</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography>Contato de agenda por WhatsApp, para o destinatário selecionado.</Typography>
          <Alert severity="info">Registre uma autorização já obtida e documentada. Este formulário não verifica titularidade, não comprova vínculo de responsável legal e não libera envio.</Alert>
          <TextField label="Referência do fundamento adotado pela clínica" required value={fundamento} disabled={bloqueado}
            onChange={e => setFundamento(e.target.value)} helperText="Use a referência do procedimento definido pela clínica. Nenhum fundamento é escolhido automaticamente." />
          <TextField label="Referência da evidência da autorização" required value={evidencia} disabled={bloqueado}
            onChange={e => setEvidencia(e.target.value)} helperText="Identificador do registro comprobatório. Não inclua nome, telefone ou o conteúdo da conversa." />
          <TextField label="Início da validade" type="datetime-local" required value={inicio} disabled={bloqueado}
            onChange={e => setInicio(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Fim da validade" type="datetime-local" required value={fim} disabled={bloqueado}
            onChange={e => setFim(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <Typography variant="body2" color="text.secondary">Horário local deste dispositivo. A validade deve corresponder ao registro da autorização; não é preenchida automaticamente.</Typography>
          {erro ? <Alert severity={registrada ? 'warning' : 'error'}>{erro}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={salvando}>Fechar</Button>
        {registrada ? <Button onClick={() => void atualizar()} disabled={salvando}>Atualizar consulta</Button>
          : <Button variant="contained" onClick={() => void salvar()} disabled={bloqueado}>Registrar autorização</Button>}
      </DialogActions>
    </Dialog>
  )
}
