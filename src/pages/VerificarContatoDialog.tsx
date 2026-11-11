import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useRef, useState } from 'react'
import { informarContato, listarVerificacoes, verificarContato } from '../services/confirmacao.service'
import {
  CONTACT_ORIGIN_LABELS,
  CONTACT_ROLE_LABELS,
  PROCEDURE_LABELS,
  REASON_LABELS,
  type ContactOrigin,
  type ContactSubjectRole,
  type ContactVerificationProcedure,
} from '../types/confirmacao'
import { mensagemErroApi } from '../utils/apiError'

function textoTelefone(
  maskedPhone?: string | null,
  phoneStatus?: 'available' | 'missing' | 'invalid' | null,
  identityStatus?: 'ready' | 'partial' | 'unavailable' | null,
): string {
  if (identityStatus === 'unavailable') return 'identificação indisponível'
  if (phoneStatus === 'invalid') return 'inválido nesta consulta'
  if (phoneStatus === 'available' && maskedPhone) return maskedPhone
  return 'não disponível'
}

export interface ContextoContato {
  campaignItemId?: number
  patientRef: string
  recipientRef: string
  informedPhoneRef: string | null
  appointmentTime?: string | null
  professionalRef?: string | null
  professionalName?: string | null
  displayName?: string | null
  maskedPhone?: string | null
  phoneStatus?: 'available' | 'missing' | 'invalid' | null
  identityStatus?: 'ready' | 'partial' | 'unavailable' | null
  reasonCode?: string | null
  horariosRelacionados?: number
}

export function VerificarContatoDialog({
  contexto,
  onClose,
  onSaved,
  onRefresh,
}: {
  contexto: ContextoContato
  onClose: () => void
  onSaved: () => Promise<void>
  onRefresh?: () => Promise<void>
}) {
  const emAndamento = useRef(false)
  const [concluido, setConcluido] = useState(false)
  const [incerto, setIncerto] = useState(false)
  const [atualizando, setAtualizando] = useState(false)
  const [papel, setPapel] = useState<ContactSubjectRole>('PATIENT')
  const [origem, setOrigem] = useState<ContactOrigin>('IN_PERSON')
  const [conferencia, setConferencia] = useState<'informada' | 'verificada'>('informada')
  const [procedimento, setProcedimento] = useState<ContactVerificationProcedure | ''>('')
  const [vinculo, setVinculo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const numeroDisponivel = Boolean(contexto.informedPhoneRef)

  function validarContexto(): string | null {
    if (!contexto.patientRef || !contexto.recipientRef) return 'Não foi possível identificar o destinatário deste agendamento. Atualize os dados na campanha.'
    if (contexto.reasonCode === 'appointment_identity_changed' || contexto.reasonCode === 'appointment_not_available')
      return 'O agendamento mudou na origem. Confira os dados da campanha antes de registrar a verificação.'
    if (contexto.identityStatus === 'unavailable') return 'A identificação deste agendamento está indisponível. Atualize os dados antes de registrar a verificação.'
    if (!contexto.informedPhoneRef) return 'Este agendamento não possui uma referência válida de telefone para registrar a verificação. Atualize os dados do agendamento. Se continuar assim, é necessária correção na origem.'
    return null
  }

  async function atualizarCampanha() {
    if (emAndamento.current) return
    emAndamento.current = true
    setSalvando(true)
    try { await onSaved() }
    catch { setError('O contato foi salvo. Não foi possível atualizar a tela; use Atualizar campanha, sem repetir o registro.') }
    finally { emAndamento.current = false; setSalvando(false) }
  }

  async function conferirRegistro() {
    if (emAndamento.current) return
    emAndamento.current = true
    setSalvando(true)
    try {
      const atuais = await listarVerificacoes(contexto.patientRef, AbortSignal.timeout(20000))
      const registro = atuais.find(item => !item.revokedAt && item.recipientRef === contexto.recipientRef &&
        item.informedPhoneRef === contexto.informedPhoneRef && item.role === papel &&
        (conferencia === 'informada' || item.status === 'VERIFIED'))
      if (!registro) { setError('O resultado ainda não foi comprovado. Aguarde e use Conferir registro novamente. Nenhum pedido de gravação será repetido.'); return }
      setConcluido(true)
      setIncerto(false)
      try { await onSaved() }
      catch { setError('O contato foi salvo. Use Atualizar campanha para atualizar a tela, sem repetir o registro.') }
    } catch { setError('Não foi possível consultar o resultado. Aguarde e confira novamente; nenhuma gravação foi repetida.') }
    finally { emAndamento.current = false; setSalvando(false) }
  }

  async function atualizarOrigem() {
    if (!onRefresh || emAndamento.current) return
    emAndamento.current = true
    setAtualizando(true)
    setError(null)
    try { await onRefresh() }
    catch (reason) { setError(mensagemErroApi(reason, 'Não foi possível atualizar os dados do agendamento.')) }
    finally { emAndamento.current = false; setAtualizando(false) }
  }

  async function salvar() {
    if (emAndamento.current || concluido || incerto) return
    setError(null)
    const contextoInvalido = validarContexto()
    if (contextoInvalido) { setError(contextoInvalido); return }
    if (conferencia === 'verificada' && procedimento === '') {
      setError('Escolha o procedimento realizado. Marcar uma opção não verifica o número.')
      return
    }
    if (conferencia === 'verificada' && papel === 'GUARDIAN' && !vinculo) {
      setError('Responsável legal só fica verificado quando o vínculo é confirmado neste atendimento.')
      return
    }
    emAndamento.current = true
    setSalvando(true)
    let gravando = false
    try {
      const atuais = await listarVerificacoes(contexto.patientRef, AbortSignal.timeout(20000))
      const ativo = atuais.find(item => !item.revokedAt && item.recipientRef === contexto.recipientRef &&
        item.informedPhoneRef === contexto.informedPhoneRef && item.role === papel)
      if (ativo?.status !== 'VERIFIED') {
        gravando = !ativo
        const registro = ativo ?? await informarContato({
          patientRef: contexto.patientRef, recipientRef: contexto.recipientRef,
          informedPhoneRef: contexto.informedPhoneRef!, role: papel, origin: origem,
        }, AbortSignal.timeout(30000))
        gravando = false
        if (conferencia === 'verificada') {
          gravando = true
          await verificarContato(registro.id, { procedure: procedimento as ContactVerificationProcedure,
            legalGuardianVerified: papel === 'GUARDIAN' && vinculo }, AbortSignal.timeout(30000))
          gravando = false
        }
      }
      setConcluido(true)
      try { await onSaved() }
      catch { setError('O contato foi salvo. Não foi possível atualizar a tela; use Atualizar campanha, sem repetir o registro.') }
    } catch (reason) {
      const status = (reason as { response?: { status?: number } })?.response?.status
      if (gravando && (!status || status >= 500 || status === 408)) {
        setIncerto(true)
        setError('Não foi possível comprovar o resultado da gravação. Use Conferir registro antes de tentar novamente. O pedido não será repetido automaticamente.')
      } else setError(mensagemErroApi(reason, 'Não foi possível registrar o contato.'))
    } finally { emAndamento.current = false; setSalvando(false) }
  }

  const motivo = contexto.reasonCode
    ? (REASON_LABELS[contexto.reasonCode] ?? contexto.reasonCode)
    : 'Pendência de contato'

  const ocupado = salvando || atualizando
  const editando = ocupado || concluido || incerto
  return (
    <Dialog open onClose={ocupado ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Verificar contato</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {!numeroDisponivel ? <Alert severity="warning">Falta a referência necessária para salvar a verificação. Atualize os dados do agendamento; a máscara não será usada para reconstruir o número.</Alert> : null}
          <Alert severity="info">
            Salvar registra a conferência da recepção. Não envia mensagem e não libera o contato.
          </Alert>
          <Typography>
            {contexto.identityStatus === 'unavailable'
              ? 'Identificação indisponível'
              : (contexto.displayName ?? 'Nome indisponível')}
          </Typography>
          <Typography>
            Agendamento {contexto.appointmentTime ?? 'sem horário'} · {contexto.professionalName ?? 'Profissional não informado'}
          </Typography>
          <Typography>
            Telefone cadastrado: {textoTelefone(contexto.maskedPhone, contexto.phoneStatus, contexto.identityStatus)}
          </Typography>
          <Typography color="text.secondary">Pendência: {motivo}</Typography>
          {(contexto.horariosRelacionados ?? 0) > 1 ? (
            <Typography color="text.secondary">
              Este contato aparece em {contexto.horariosRelacionados} horários. Um registro vale para todos.
            </Typography>
          ) : null}
          <TextField
            select
            disabled={editando}
            label="De quem é o número"
            value={papel}
            onChange={(event) => {
              setPapel(event.target.value as ContactSubjectRole)
              setVinculo(false)
            }}
          >
            {Object.entries(CONTACT_ROLE_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            disabled={editando}
            label="Como o número foi informado"
            value={origem}
            onChange={(event) => setOrigem(event.target.value as ContactOrigin)}
          >
            {Object.entries(CONTACT_ORIGIN_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            disabled={editando}
            label="Verificação do número"
            value={conferencia}
            onChange={(event) => setConferencia(event.target.value as 'informada' | 'verificada')}
            helperText="Informar o número não comprova que ele pertence à pessoa."
          >
            <MenuItem value="informada">Ainda não verificado</MenuItem>
            <MenuItem value="verificada">Verificação realizada neste atendimento</MenuItem>
          </TextField>
          {conferencia === 'verificada' ? (
            <TextField
              select
              disabled={editando}
              label="Procedimento realizado"
              value={procedimento}
              onChange={(event) => setProcedimento(event.target.value as ContactVerificationProcedure)}
            >
              <MenuItem value="">Selecione</MenuItem>
              {Object.entries(PROCEDURE_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </TextField>
          ) : null}
          {conferencia === 'verificada' && papel === 'GUARDIAN' ? (
            <TextField
              select
              disabled={editando}
              label="Vínculo do responsável legal"
              value={vinculo ? 'sim' : 'nao'}
              onChange={(event) => setVinculo(event.target.value === 'sim')}
              helperText="O vínculo precisa ser confirmado neste atendimento. Escolher responsável legal não basta."
            >
              <MenuItem value="nao">Ainda não verificado</MenuItem>
              <MenuItem value="sim">Verificado neste atendimento</MenuItem>
            </TextField>
          ) : null}
          <Alert severity="info">O sistema revalida a identidade e eventuais revogações antes de qualquer envio. Registrar este procedimento não dispara mensagens.</Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={ocupado}>Fechar</Button>
        {onRefresh && !concluido && !incerto ? <Button disabled={ocupado} onClick={() => void atualizarOrigem()}>Atualizar dados do agendamento</Button> : null}
        <Button variant="contained" disabled={ocupado} onClick={() => void (concluido ? atualizarCampanha() : incerto ? conferirRegistro() : salvar())}>
          {ocupado ? 'Processando...' : concluido ? 'Atualizar campanha' : incerto ? 'Conferir registro' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
