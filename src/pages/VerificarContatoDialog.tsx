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
import { useState } from 'react'
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
}: {
  contexto: ContextoContato
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [papel, setPapel] = useState<ContactSubjectRole>('PATIENT')
  const [origem, setOrigem] = useState<ContactOrigin>('IN_PERSON')
  const [conferencia, setConferencia] = useState<'informada' | 'verificada'>('informada')
  const [procedimento, setProcedimento] = useState<ContactVerificationProcedure | ''>('')
  const [vinculo, setVinculo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const numeroDisponivel = Boolean(contexto.informedPhoneRef)

  async function salvar() {
    setError(null)
    if (!contexto.informedPhoneRef) {
      setError('Este agendamento não trouxe uma referência de número. O telefone não pode ser digitado nesta tela.')
      return
    }
    if (conferencia === 'verificada' && procedimento === '') {
      setError('Escolha o procedimento realizado. Marcar uma opção não verifica o número.')
      return
    }
    if (conferencia === 'verificada' && papel === 'GUARDIAN' && !vinculo) {
      setError('Responsável legal só fica verificado quando o vínculo é confirmado neste atendimento.')
      return
    }
    setSalvando(true)
    try {
      const atuais = await listarVerificacoes(contexto.patientRef)
      const ativo = atuais.find(
        (item) =>
          !item.revokedAt &&
          item.recipientRef === contexto.recipientRef &&
          item.informedPhoneRef === contexto.informedPhoneRef &&
          item.role === papel,
      )
      if (ativo?.status === 'VERIFIED') {
        setError('Este contato já teve o procedimento registrado. Uma nova declaração não autoriza o envio.')
        return
      }
      const registro = ativo ?? await informarContato({
        patientRef: contexto.patientRef,
        recipientRef: contexto.recipientRef,
        informedPhoneRef: contexto.informedPhoneRef,
        role: papel,
        origin: origem,
      })
      if (conferencia === 'verificada') {
        await verificarContato(registro.id, {
          procedure: procedimento as ContactVerificationProcedure,
          legalGuardianVerified: papel === 'GUARDIAN' && vinculo,
        })
      }
      await onSaved()
    } catch (reason) {
      setError(mensagemErroApi(reason, 'Não foi possível registrar o contato.'))
    } finally {
      setSalvando(false)
    }
  }

  const motivo = contexto.reasonCode
    ? (REASON_LABELS[contexto.reasonCode] ?? contexto.reasonCode)
    : 'Pendência de contato'

  return (
    <Dialog open onClose={salvando ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Verificar contato</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
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
        <Button onClick={onClose} disabled={salvando}>Cancelar</Button>
        <Button variant="contained" onClick={() => void salvar()} disabled={salvando || !numeroDisponivel}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
