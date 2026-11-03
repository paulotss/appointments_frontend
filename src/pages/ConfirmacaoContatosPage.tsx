import {
  Alert,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  associarPaciente,
  informarContato,
  listarAssociacoes,
  listarAuditoriaContato,
  listarAutorizacoes,
  listarVerificacoes,
  registrarAutorizacao,
  revogarAutorizacao,
  revogarVerificacao,
  verificarContato,
} from '../services/confirmacao.service'
import {
  AUDIT_ACTION_LABELS,
  CONTACT_ORIGIN_LABELS,
  CONTACT_ROLE_LABELS,
  PROCEDURE_LABELS,
  VERIFICATION_STATUS_LABELS,
  type ContactAssociation,
  type ContactAuditEvent,
  type ContactAuthorization,
  type ContactOrigin,
  type ContactSubjectRole,
  type ContactVerification,
  type ContactVerificationProcedure,
} from '../types/confirmacao'
import { mensagemErroApi } from '../utils/apiError'

export function ConfirmacaoContatosPage() {
  const [params] = useSearchParams()
  const [patientRef, setPatientRef] = useState(params.get('patientRef') ?? '')
  const [recipientRef, setRecipientRef] = useState(params.get('recipientRef') ?? '')
  const [informedPhoneRef, setInformedPhoneRef] = useState(params.get('informedPhoneRef') ?? '')
  const [role, setRole] = useState<ContactSubjectRole>('PATIENT')
  const [origin, setOrigin] = useState<ContactOrigin>('IN_PERSON')
  const [evidenceRef, setEvidenceRef] = useState('')
  const [procedure, setProcedure] = useState<ContactVerificationProcedure>('DOCUMENT_PRESENTED')
  const [guardianChecked, setGuardianChecked] = useState(false)
  const [legalBasis, setLegalBasis] = useState('clinic.basis.example')
  const [validFrom, setValidFrom] = useState('2026-11-01T00:00:00Z')
  const [expiresAt, setExpiresAt] = useState('2026-12-01T00:00:00Z')
  const [higiaPatientId, setHigiaPatientId] = useState('')
  const [verificacoes, setVerificacoes] = useState<ContactVerification[]>([])
  const [autorizacoes, setAutorizacoes] = useState<ContactAuthorization[]>([])
  const [associacoes, setAssociacoes] = useState<ContactAssociation[]>([])
  const [historico, setHistorico] = useState<ContactAuditEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function consultar(ref = patientRef) {
    const alvo = ref.trim()
    const [nextVerifications, nextAuthorizations, nextAssociations, nextAudit] = await Promise.all([
      listarVerificacoes(alvo),
      listarAutorizacoes(alvo),
      listarAssociacoes(alvo),
      listarAuditoriaContato(alvo),
    ])
    setVerificacoes(nextVerifications)
    setAutorizacoes(nextAuthorizations)
    setAssociacoes(nextAssociations)
    setHistorico(nextAudit)
  }

  async function executar(acao: () => Promise<void>, sucesso: string) {
    setError(null)
    setInfo(null)
    try {
      await acao()
      await consultar()
      setInfo(sucesso)
    } catch (reason) {
      setError(mensagemErroApi(reason, 'Não foi possível concluir a operação.'))
    }
  }

  return (
    <Stack spacing={2}>
      <div>
        <Typography variant="h5">Contatos da confirmação</Typography>
        <Typography color="text.secondary">
          Informe a referência opaca. Preencher este formulário não comprova titularidade nem autoriza envio.
        </Typography>
      </div>
      <Alert severity="info">
        Número informado e número verificado são referências diferentes. Trocar a referência exige um novo registro.
        Menor de idade só segue com responsável legal verificado.
      </Alert>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {info ? <Alert severity="success">{info}</Alert> : null}
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <TextField
            fullWidth
            label="Referência do paciente"
            value={patientRef}
            onChange={(event) => setPatientRef(event.target.value)}
          />
          <Button variant="contained" onClick={() => void consultar().catch((reason: unknown) => setError(mensagemErroApi(reason, 'Consulta não concluída.')))}>
            Consultar
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6">Registrar como o contato foi informado</Typography>
          <TextField label="Referência do destinatário" value={recipientRef} onChange={(event) => setRecipientRef(event.target.value)} />
          <TextField
            label="Referência do número informado"
            value={informedPhoneRef}
            onChange={(event) => setInformedPhoneRef(event.target.value)}
            helperText="Esta referência ainda não está verificada."
          />
          <TextField select label="Quem é o contato" value={role} onChange={(event) => setRole(event.target.value as ContactSubjectRole)}>
            {Object.entries(CONTACT_ROLE_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Origem da informação" value={origin} onChange={(event) => setOrigin(event.target.value as ContactOrigin)}>
            {Object.entries(CONTACT_ORIGIN_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Evidência adicional (opcional)"
            value={evidenceRef}
            onChange={(event) => setEvidenceRef(event.target.value)}
            helperText="Código opaco de um documento já existente. Não é obrigatório e não prova o número."
          />
          <Button
            variant="outlined"
            onClick={() => void executar(async () => {
              await informarContato({
                patientRef: patientRef.trim(),
                recipientRef: recipientRef.trim(),
                informedPhoneRef: informedPhoneRef.trim(),
                role,
                origin,
                ...(evidenceRef.trim() ? { evidenceRef: evidenceRef.trim() } : {}),
              })
            }, 'Contato informado. A titularidade continua pendente.')}
          >
            Registrar informação
          </Button>
        </Stack>
      </Paper>

      <Typography variant="h6">Verificações</Typography>
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Situação</TableCell>
              <TableCell>Papel</TableCell>
              <TableCell>Origem</TableCell>
              <TableCell>Referência informada</TableCell>
              <TableCell>Referência verificada</TableCell>
              <TableCell>Responsável legal</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {verificacoes.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Chip
                    size="small"
                    color={item.revokedAt ? 'default' : item.status === 'VERIFIED' ? 'success' : 'warning'}
                    label={item.revokedAt ? 'Revogado' : VERIFICATION_STATUS_LABELS[item.status]}
                  />
                </TableCell>
                <TableCell>{CONTACT_ROLE_LABELS[item.role]}</TableCell>
                <TableCell>{CONTACT_ORIGIN_LABELS[item.origin]}</TableCell>
                <TableCell>{item.informedPhoneRef}</TableCell>
                <TableCell>{item.verifiedPhoneRef ?? 'Pendente'}</TableCell>
                <TableCell>{item.legalGuardianVerified ? 'Verificado' : 'Não verificado'}</TableCell>
                <TableCell>
                  {item.revokedAt ? null : (
                    <Button size="small" color="error" onClick={() => void executar(() => revogarVerificacao(item.id).then(() => undefined), 'Verificação revogada.')}>
                      Revogar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6">Registrar procedimento de verificação</Typography>
          <TextField select label="Procedimento" value={procedure} onChange={(event) => setProcedure(event.target.value as ContactVerificationProcedure)}>
            {Object.entries(PROCEDURE_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Responsável legal verificado"
            value={guardianChecked ? 'sim' : 'nao'}
            onChange={(event) => setGuardianChecked(event.target.value === 'sim')}
            helperText="Obrigatório para concluir a verificação de um responsável. Não libera paciente menor por si só."
          >
            <MenuItem value="nao">Não</MenuItem>
            <MenuItem value="sim">Sim, a responsabilidade foi checada</MenuItem>
          </TextField>
          <Button
            variant="contained"
            onClick={() => {
              const alvo = verificacoes.find((item) => item.status === 'INFORMED' && !item.revokedAt)
              if (!alvo) {
                setError('Não há contato informado aguardando verificação.')
                return
              }
              void executar(
                () => verificarContato(alvo.id, { procedure, legalGuardianVerified: guardianChecked }).then(() => undefined),
                'Procedimento registrado para a referência informada. Isso não autoriza o envio.',
              )
            }}
          >
            Concluir verificação do contato informado
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6">Autorização de contato</Typography>
          <Typography variant="body2" color="text.secondary">
            Finalidade appointment_contact, canal WhatsApp. A autorização não torna o número titular.
          </Typography>
          <TextField label="Fundamento jurídico documentado" value={legalBasis} onChange={(event) => setLegalBasis(event.target.value)} />
          <TextField label="Vigência inicial" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} />
          <TextField label="Vigência final" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
          <Button
            variant="outlined"
            onClick={() => void executar(async () => {
              await registrarAutorizacao({
                patientRef: patientRef.trim(),
                recipientRef: recipientRef.trim(),
                purpose: 'appointment_contact',
                channel: 'whatsapp',
                legalBasis: legalBasis.trim(),
                ...(evidenceRef.trim() ? { evidenceRef: evidenceRef.trim() } : {}),
                validFrom: validFrom.trim(),
                expiresAt: expiresAt.trim(),
              })
            }, 'Autorização registrada. O envio continua bloqueado.')}
          >
            Registrar autorização
          </Button>
        </Stack>
      </Paper>
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fundamento</TableCell>
              <TableCell>Vigência</TableCell>
              <TableCell>Situação</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {autorizacoes.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.legalBasis}</TableCell>
                <TableCell>{item.validFrom} — {item.expiresAt}</TableCell>
                <TableCell>{item.revokedAt ? 'Revogada' : 'Vigente no registro'}</TableCell>
                <TableCell>
                  {item.revokedAt ? null : (
                    <Button size="small" color="error" onClick={() => void executar(() => revogarAutorizacao(item.id).then(() => undefined), 'Autorização revogada.')}>
                      Revogar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6">Associação com o cadastro do Higia</Typography>
          <Typography variant="body2" color="text.secondary">
            O vínculo é explícito pelo identificador interno. Não há busca por nome ou telefone, e o paciente do Saúde Vianet não precisa ter cadastro aqui.
          </Typography>
          <TextField
            label="Id do paciente no Higia (opcional)"
            value={higiaPatientId}
            onChange={(event) => setHigiaPatientId(event.target.value)}
          />
          <Button
            variant="outlined"
            onClick={() => void executar(async () => {
              const id = higiaPatientId.trim()
              await associarPaciente({
                patientRef: patientRef.trim(),
                ...(id ? { higiaPatientId: Number(id) } : {}),
              })
            }, 'Associação registrada.')}
          >
            Registrar associação
          </Button>
          {associacoes.map((item) => (
            <Typography key={item.id} variant="body2">
              {item.patientRef} · paciente Higia {item.higiaPatientId ?? 'não vinculado'} · {item.associatedBy.name}
            </Typography>
          ))}
        </Stack>
      </Paper>

      <Typography variant="h6">Histórico</Typography>
      <Stack spacing={1}>
        {historico.map((event) => (
          <Paper key={event.id} sx={{ p: 1.5 }}>
            <Typography>{AUDIT_ACTION_LABELS[event.action] ?? event.action} · {event.actor.name}</Typography>
            <Typography variant="body2" color="text.secondary">{event.createdAt}</Typography>
          </Paper>
        ))}
      </Stack>
    </Stack>
  )
}
