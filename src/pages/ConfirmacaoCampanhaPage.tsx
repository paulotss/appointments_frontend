import {
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
  Typography,
  TextField,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  aprovarCampanha,
  definirPrazoResposta,
  colocarCampanhaEmRevisao,
  obterCampanha,
  reabrirCampanha,
} from '../services/confirmacao.service'
import {
  AUDIT_ACTION_LABELS,
  CAMPAIGN_STATUS_LABELS,
  CONSULTATION_LABELS,
  REASON_LABELS,
  RECIPIENT_STATE_LABELS,
  type CampaignDetail,
  type CampaignRecipientState,
} from '../types/confirmacao'
import { mensagemErroApi } from '../utils/apiError'
import {
  acaoDaPendencia,
  falhaDeConsulta,
  pendenciaResolvivel,
} from '../utils/contatoConfirmacao'
import {
  VerificarContatoDialog,
  type ContextoContato,
} from './VerificarContatoDialog'
import { ConfirmacaoSimulacoes } from './ConfirmacaoSimulacoes'

import { ConfirmacaoRespostas, localInstant } from './ConfirmacaoRespostas'

const ESTADO_COR: Record<
  CampaignRecipientState,
  'success' | 'warning' | 'default'
> = {
  ELIGIBLE: 'success',
  PENDING: 'warning',
  UNAVAILABLE: 'default',
}

export function ConfirmacaoCampanhaPage() {
  const { id } = useParams()
  const campaignId = Number(id)
  const [campanha, setCampanha] = useState<CampaignDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [prazo, setPrazo] = useState('')
  const [busy, setBusy] = useState(false)
  const [contexto, setContexto] = useState<ContextoContato | null>(null)

  useEffect(() => {
    if (!Number.isInteger(campaignId)) {
      return
    }
    let ativo = true
    void obterCampanha(campaignId)
      .then((carregada) => {
        if (ativo) setCampanha(carregada)
      })
      .catch((reason: unknown) => {
        if (ativo)
          setError(
            mensagemErroApi(reason, 'Não foi possível abrir a campanha.'),
          )
      })
    return () => {
      ativo = false
    }
  }, [campaignId])

  async function executar(acao: (id: number) => Promise<CampaignDetail>) {
    setBusy(true)
    setError(null)
    try {
      setCampanha(await acao(campaignId))
    } catch (reason) {
      setError(
        mensagemErroApi(reason, 'Não foi possível atualizar a campanha.'),
      )
    } finally {
      setBusy(false)
    }
  }

  if (!Number.isInteger(campaignId)) {
    return <Alert severity="error">Campanha inválida.</Alert>
  }

  if (!campanha) {
    return error ? (
      <Alert severity="error">{error}</Alert>
    ) : (
      <Typography>Carregando campanha.</Typography>
    )
  }

  const agendamentos = campanha.items.filter((item) => !falhaDeConsulta(item))
  const falhas = campanha.items.filter((item) => falhaDeConsulta(item))
  const registroIndisponivel =
    agendamentos.some((item) => item.reasonCode === 'registry_unavailable') ||
    campanha.consultationReason === 'registry_unavailable'
  const contatoRevogado = agendamentos.some(item => item.reasonCode === 'authorization_revoked')

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <Typography variant="h5">Campanha {campanha.campaignDate}</Typography>
          <Typography color="text.secondary">
            {campanha.sourceLabel} · {CAMPAIGN_STATUS_LABELS[campanha.status]} ·
            disparo desligado
          </Typography>
        </div>
        <Button component={RouterLink} to="/confirmacao/campanhas">
          Voltar
        </Button>
      </Stack>
      <Alert
        severity={
          campanha.consultationState === 'FAILED'
            ? 'error'
            : campanha.consultationState === 'EMPTY'
              ? 'info'
              : 'warning'
        }
      >
        {CONSULTATION_LABELS[campanha.consultationState]}
        {campanha.consultationReason
          ? ` · ${REASON_LABELS[campanha.consultationReason] ?? campanha.consultationReason}`
          : ''}
        . Aprovar esta campanha não autoriza destinatários inválidos e não envia
        WhatsApp.
      </Alert>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Alert severity="info">
        A recepção pode resolver verificação ausente, verificação revogada e
        responsável legal não verificado. Contato revogado, registro
        indisponível, idade não confirmada e falha de agenda dependem de
        correção técnica. Nenhuma dessas ações envia mensagem.
      </Alert>
      {registroIndisponivel ? (
        <Alert severity="warning">
          O registro de contatos está indisponível. Verificações e revogações
          não foram consultadas. Essas linhas não ficam aptas e a recepção não
          as resolve.
        </Alert>
      ) : null}
      {contatoRevogado ? (
        <Alert severity="warning">
          Há contato com revogação registrada. A conferência do número não remove esse bloqueio.
        </Alert>
      ) : null}
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        <Chip label={`${campanha.appointmentsAnalyzed} agendamentos`} />
        <Chip color="success" label={`${campanha.eligibleRecipients} aptos`} />
        <Chip
          color="warning"
          label={`${campanha.pendingVerifications} pendentes`}
        />
        <Chip label={`${campanha.unavailableRecipients} indisponíveis`} />
        {campanha.technicalFailures > 0 ? (
          <Chip
            color="error"
            label={`${campanha.technicalFailures} falhas técnicas`}
          />
        ) : null}
      </Stack>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Prazo para resposta</Typography>
        <Typography>
          {campanha.responseDeadlineAt
            ? localInstant(campanha.responseDeadlineAt)
            : 'Prazo não definido'}{' '}
          · America/Sao_Paulo
        </Typography>
        {campanha.status !== 'APPROVED' && (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <TextField
              type="datetime-local"
              label="Novo prazo em São Paulo"
              slotProps={{ inputLabel: { shrink: true } }}
              value={prazo}
              onChange={(event) => setPrazo(event.target.value)}
            />
            <Button
              disabled={busy || !prazo}
              onClick={() =>
                void executar((id) =>
                  definirPrazoResposta(
                    id,
                    new Date(`${prazo}:00-03:00`).toISOString(),
                  ),
                )
              }
            >
              Salvar prazo
            </Button>
          </Stack>
        )}
      </Paper>
      <Stack direction="row" spacing={1}>
        {campanha.status === 'DRAFT' ? (
          <Button
            variant="contained"
            disabled={busy}
            onClick={() => void executar(colocarCampanhaEmRevisao)}
          >
            Colocar em revisão
          </Button>
        ) : null}
        {campanha.status === 'IN_REVIEW' ? (
          <Button
            variant="contained"
            disabled={busy || !campanha.responseDeadlineAt}
            onClick={() => void executar(aprovarCampanha)}
          >
            Aprovar administrativamente
          </Button>
        ) : null}
        {campanha.status === 'APPROVED' ? (
          <Button
            disabled={busy}
            onClick={() => void executar(reabrirCampanha)}
          >
            Reabrir revisão
          </Button>
        ) : null}
      </Stack>
      <Typography variant="h6">Agendamentos</Typography>
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Horário</TableCell>
              <TableCell>Profissional</TableCell>
              <TableCell>Contato</TableCell>
              <TableCell>Situação</TableCell>
              <TableCell>Pendência</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {agendamentos.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.appointmentTime ?? '—'}</TableCell>
                <TableCell>
                  {item.professionalName ?? 'Profissional não informado'}
                </TableCell>
                <TableCell>
                  {item.identityStatus === 'unavailable' ? (
                    'Identificação indisponível'
                  ) : (
                    <>
                      {item.displayName ?? 'Nome indisponível'}
                      <Typography variant="body2" color="text.secondary">
                        {item.phoneStatus === 'available' && item.maskedPhone
                          ? item.maskedPhone
                          : item.phoneStatus === 'invalid'
                            ? 'Telefone inválido'
                            : 'Telefone não disponível'}
                      </Typography>
                    </>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={ESTADO_COR[item.recipientState]}
                    label={RECIPIENT_STATE_LABELS[item.recipientState]}
                  />
                </TableCell>
                <TableCell>
                  {item.reasonCode
                    ? (REASON_LABELS[item.reasonCode] ?? item.reasonCode)
                    : '—'}
                </TableCell>
                <TableCell>
                  {pendenciaResolvivel(item) ? (
                    <Button
                      size="small"
                      onClick={() =>
                        setContexto({
                          patientRef: item.patientRef ?? '',
                          recipientRef: item.recipientRef ?? '',
                          informedPhoneRef: item.informedPhoneRef,
                          appointmentTime: item.appointmentTime,
                          professionalName: item.professionalName,
                          displayName: item.displayName,
                          maskedPhone: item.maskedPhone,
                          phoneStatus: item.phoneStatus,
                          identityStatus: item.identityStatus,
                          reasonCode: item.reasonCode,
                          horariosRelacionados: agendamentos.filter(
                            (outro) =>
                              outro.recipientRef &&
                              outro.recipientRef === item.recipientRef,
                          ).length,
                        })
                      }
                    >
                      Resolver pendência
                    </Button>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {acaoDaPendencia(item) ?? '—'}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      {falhas.length > 0 ? (
        <>
          <Typography variant="h6">Falhas técnicas da consulta</Typography>
          <Alert severity="warning">
            A coleta ficou incompleta. Estas linhas não são agendamentos e não
            podem ser resolvidas pela recepção.
          </Alert>
          <Paper>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Agenda</TableCell>
                  <TableCell>Motivo</TableCell>
                  <TableCell>Ação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {falhas.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.agendaRef ?? 'Agenda não identificada'}
                    </TableCell>
                    <TableCell>
                      {item.reasonCode
                        ? (REASON_LABELS[item.reasonCode] ?? item.reasonCode)
                        : '—'}
                    </TableCell>
                    <TableCell>Correção técnica</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      ) : null}
      {contexto ? (
        <VerificarContatoDialog
          contexto={contexto}
          onClose={() => setContexto(null)}
          onSaved={async () => {
            setContexto(null)
            setCampanha(await obterCampanha(campaignId))
          }}
        />
      ) : null}
      <ConfirmacaoRespostas campaignId={campaignId} />
      <ConfirmacaoSimulacoes
        campaignId={campaignId}
        revision={`${campanha.status}:${campanha.events.length}`}
      />
      <Typography variant="h6">Histórico</Typography>
      <Stack spacing={1}>
        {campanha.events.map((event) => (
          <Paper key={event.id} sx={{ p: 1.5 }}>
            <Typography>
              {AUDIT_ACTION_LABELS[event.action] ?? event.action} ·{' '}
              {event.actor.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {event.createdAt}
              {event.fromStatus
                ? ` · ${CAMPAIGN_STATUS_LABELS[event.fromStatus]}`
                : ''}
              {event.toStatus
                ? ` → ${CAMPAIGN_STATUS_LABELS[event.toStatus]}`
                : ''}
            </Typography>
          </Paper>
        ))}
      </Stack>
    </Stack>
  )
}
