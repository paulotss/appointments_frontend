import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Chip,
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
import { useRef, useState } from 'react'
import {
  associarPaciente,
  listarAssociacoes,
  listarAuditoriaContato,
  listarAutorizacoes,
  listarVerificacoes,
  pesquisarPacientes,
  reavaliarContato,
  revogarAutorizacao,
  revogarVerificacao,
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
  type ContactVerification,
  type PatientCandidate,
} from '../types/confirmacao'
import { mensagemErroApi } from '../utils/apiError'
import { VerificarContatoDialog, type ContextoContato } from './VerificarContatoDialog'

function quando(valor: string): string {
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return 'Data não disponível'
  return data.toLocaleString('pt-BR', { timeZone: 'UTC' })
}

export function ConfirmacaoContatosPage() {
  const ultimaConsulta = useRef(0)
  const [nome, setNome] = useState('')
  const [resultados, setResultados] = useState<PatientCandidate[]>([])
  const [pesquisa, setPesquisa] = useState<'idle' | 'empty' | 'ready' | 'partial' | 'unavailable'>('idle')
  const [truncado, setTruncado] = useState(false)
  const [selecionado, setSelecionado] = useState<PatientCandidate | null>(null)
  const [patientRef, setPatientRef] = useState('')
  const [higiaPatientId, setHigiaPatientId] = useState('')
  const [verificacoes, setVerificacoes] = useState<ContactVerification[]>([])
  const [autorizacoes, setAutorizacoes] = useState<ContactAuthorization[]>([])
  const [associacoes, setAssociacoes] = useState<ContactAssociation[]>([])
  const [historico, setHistorico] = useState<ContactAuditEvent[]>([])
  const [reavaliando, setReavaliando] = useState(false)
  const [consultado, setConsultado] = useState(false)
  const [contexto, setContexto] = useState<ContextoContato | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function consultar(ref = patientRef) {
    const alvo = ref.trim()
    if (!alvo) {
      setError('A consulta avançada precisa da referência interna do paciente.')
      return
    }
    const consulta = ++ultimaConsulta.current
    const [nextVerifications, nextAuthorizations, nextAssociations, nextAudit] = await Promise.all([
      listarVerificacoes(alvo),
      listarAutorizacoes(alvo),
      listarAssociacoes(alvo),
      listarAuditoriaContato(alvo),
    ])
    if (consulta !== ultimaConsulta.current) return
    setPatientRef(alvo)
    setVerificacoes(nextVerifications)
    setAutorizacoes(nextAuthorizations)
    setAssociacoes(nextAssociations)
    setHistorico(nextAudit)
    setConsultado(true)
  }

  async function pesquisar() {
    ultimaConsulta.current++
    setError(null)
    setInfo(null)
    setSelecionado(null)
    setConsultado(false)
    try {
      const resposta = await pesquisarPacientes(nome.trim())
      setResultados(resposta.people)
      setTruncado(resposta.truncated)
      setPesquisa(resposta.state === 'ready' && resposta.people.length === 0 ? 'empty' : resposta.state)
    } catch (reason) {
      setResultados([])
      setPesquisa('unavailable')
      setError(mensagemErroApi(reason, 'Não foi possível pesquisar pacientes.'))
    }
  }

  async function escolher(pessoa: PatientCandidate) {
    setConsultado(false)
    setSelecionado(pessoa)
    setError(null)
    try {
      await consultar(pessoa.patientRef)
    } catch (reason) {
      setError(mensagemErroApi(reason, 'Consulta não concluída.'))
    }
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

  const revogacaoRegistrada = autorizacoes.some(
    item => item.revokedAt && item.purpose === 'appointment_contact' && item.channel === 'whatsapp',
  )

  return (
    <Stack spacing={2}>
      <div>
        <Typography variant="h5">Contatos da confirmação</Typography>
        <Typography color="text.secondary">
          Pesquise pelo nome do paciente na agenda. O nome não comprova titularidade e o envio continua bloqueado.
        </Typography>
      </div>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {info ? <Alert severity="success">{info}</Alert> : null}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <TextField
          fullWidth
          label="Nome do paciente"
          disabled={reavaliando}
          value={nome}
          onChange={(event) => setNome(event.target.value)}
        />
        <Button variant="contained" disabled={reavaliando} onClick={() => void pesquisar()}>Pesquisar</Button>
      </Stack>
      {pesquisa === 'unavailable' ? <Alert severity="warning">Identificação indisponível.</Alert> : null}
      {pesquisa === 'empty' ? <Alert severity="info">Nenhum paciente encontrado com esse nome.</Alert> : null}
      {pesquisa === 'partial' ? <Alert severity="warning">A pesquisa ficou incompleta. Os nomes abaixo são só os que a agenda conseguiu identificar.</Alert> : null}
      {truncado ? <Alert severity="info">Há mais pacientes com esse nome. Refine a pesquisa antes de escolher.</Alert> : null}
      {resultados.length > 0 ? (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Paciente</TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {resultados.map((pessoa) => (
                <TableRow key={pessoa.patientRef} selected={selecionado?.patientRef === pessoa.patientRef}>
                  <TableCell>{pessoa.displayName}</TableCell>
                  <TableCell>
                    {pessoa.phoneStatus === 'available' && pessoa.maskedPhone
                      ? pessoa.maskedPhone
                      : pessoa.phoneStatus === 'invalid'
                        ? 'Telefone inválido'
                        : 'Telefone não disponível'}
                  </TableCell>
                  <TableCell>
                    <Button size="small" disabled={reavaliando} onClick={() => void escolher(pessoa)}>Selecionar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      ) : null}
      {selecionado ? (
        <Alert severity="info">
          {selecionado.displayName} selecionado. A escolha não vincula outro cadastro e não autoriza envio.
        </Alert>
      ) : (
        <Alert severity="info">
          Escolha o paciente certo quando houver homônimos. A pesquisa não seleciona ninguém sozinha.
        </Alert>
      )}
      {consultado ? (
        <>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Chip label={`${verificacoes.length} registro(s)`} />
            <Button disabled={reavaliando} onClick={() => {
              setReavaliando(true)
              void executar(() => reavaliarContato(patientRef).then(() => undefined), 'Contato reavaliado. Confira a situação na campanha; nenhum envio foi realizado.')
                .finally(() => setReavaliando(false))
            }}>
              Reavaliar contato
            </Button>
          </Stack>
          <Alert severity="info">
            Registre a conferência do número e do destinatário. A elegibilidade é reavaliada pelo sistema; nenhuma mensagem é enviada aqui.
          </Alert>
          {revogacaoRegistrada ? (
            <Alert severity="warning">Há revogações de contato no histórico. Elas continuam bloqueando os destinatários correspondentes.</Alert>
          ) : null}
          <Paper>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Situação</TableCell>
                  <TableCell>De quem é o número</TableCell>
                  <TableCell>Origem</TableCell>
                  <TableCell>Verificação</TableCell>
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
                    <TableCell>
                      {item.procedure ? PROCEDURE_LABELS[item.procedure] : 'Não verificada'}
                    </TableCell>
                    <TableCell>{item.role === 'GUARDIAN' ? (item.legalGuardianVerified ? 'Vínculo verificado' : 'Vínculo pendente') : 'Não se aplica'}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        {!item.revokedAt && item.status === 'INFORMED' ? (
                          <Button
                            size="small"
                            onClick={() => setContexto({
                              patientRef: item.patientRef,
                              recipientRef: item.recipientRef,
                              informedPhoneRef: item.informedPhoneRef,
                            })}
                          >
                            Verificar contato
                          </Button>
                        ) : null}
                        {item.revokedAt ? null : (
                          <Button size="small" color="error" onClick={() => void executar(() => revogarVerificacao(item.id).then(() => undefined), 'Verificação revogada. O contato deixa de ser considerado verificado.')}>
                            Revogar
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
          {autorizacoes.length > 0 ? (
            <Paper>
              <Typography sx={{ p: 2 }}>Registros anteriores de contato</Typography>
              <Table size="small">
                <TableHead><TableRow><TableCell>Situação</TableCell><TableCell>Registro</TableCell><TableCell /></TableRow></TableHead>
                <TableBody>
                  {autorizacoes.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.revokedAt ? 'Revogação registrada' : 'Registro anterior preservado'}</TableCell>
                      <TableCell>{quando(item.recordedAt)} · {item.recordedBy.name}</TableCell>
                      <TableCell>{!item.revokedAt ? (
                        <Button size="small" color="error" onClick={() => void executar(() => revogarAutorizacao(item.id).then(() => undefined), 'Revogação de contato registrada.')}>
                          Revogar contato
                        </Button>
                      ) : null}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          ) : null}
          <Typography variant="h6">Histórico</Typography>
          <Stack spacing={1}>
            {historico.length === 0 ? <Typography color="text.secondary">Nenhuma alteração registrada.</Typography> : null}
            {historico.map((event) => (
              <Paper key={event.id} sx={{ p: 1.5 }}>
                <Typography>{AUDIT_ACTION_LABELS[event.action] ?? event.action} · {event.actor.name}</Typography>
                <Typography variant="body2" color="text.secondary">{quando(event.createdAt)}</Typography>
              </Paper>
            ))}
          </Stack>
        </>
      ) : null}

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Detalhes técnicos</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              Os identificadores abaixo pertencem ao paciente selecionado. Eles não são digitados no atendimento.
            </Typography>
            {consultado ? (
              <>
                <Typography variant="body2">Número e identificadores ficam restritos a esta seção.</Typography>
                {verificacoes.map((item) => (
                  <Typography key={item.id} variant="body2">
                    {CONTACT_ROLE_LABELS[item.role]} · número {item.informedPhoneRef}
                    {item.verifiedPhoneRef ? ` · verificado ${item.verifiedPhoneRef}` : ''}
                  </Typography>
                ))}
                {autorizacoes.map((item) => (
                  <Typography key={item.id} variant="body2">
                    Fundamento {item.legalBasis} · {item.validFrom} — {item.expiresAt}
                  </Typography>
                ))}
                <TextField
                  label="Id do paciente no Higia"
                  value={higiaPatientId}
                  onChange={(event) => setHigiaPatientId(event.target.value)}
                  helperText="Associação explícita. Não há busca por nome ou telefone."
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
                    Paciente Higia {item.higiaPatientId ?? 'não vinculado'} · {item.associatedBy.name}
                  </Typography>
                ))}
              </>
            ) : null}
          </Stack>
        </AccordionDetails>
      </Accordion>
      {contexto ? (
        <VerificarContatoDialog
          contexto={contexto}
          onClose={() => setContexto(null)}
          onSaved={async () => {
            setContexto(null)
            await consultar()
            setInfo('Contato atualizado. A elegibilidade será reavaliada; nenhuma mensagem foi enviada.')
          }}
        />
      ) : null}
    </Stack>
  )
}
