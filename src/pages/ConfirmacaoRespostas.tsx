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
import { useEffect, useState } from 'react'
import {
  assumirPendencia,
  concluirPendencia,
  listarRespostas,
  type CampaignResponses,
} from '../services/confirmacao.service'
import { getLoggedUser } from '../services/authStorage'
import { mensagemErroApi } from '../utils/apiError'

const labels: Record<string, string> = {
  execution_outside_scope: 'Agendamento fora do lote autorizado',
  send_release_not_permitted: 'Envio sem liberação válida',
  campaign_item_not_eligible: 'Agendamento deixou de estar apto',
  shared_phone: 'Telefone vinculado a mais de um agendamento',
  source_timeout: 'Consulta da agenda excedeu o tempo de espera',
  source_http_error: 'Falha de comunicação ao consultar a agenda',
  source_invalid_response: 'A agenda retornou dados que não puderam ser validados',
  source_query_failed: 'Não foi possível concluir a consulta da agenda',
  source_not_configured: 'Fonte da agenda sem configuração',
  source_authentication_failed: 'Acesso à fonte da agenda recusado',
  source_unavailable: 'Fonte da agenda indisponível',
  source_disconnected: 'Fonte da agenda desconectada',
  source_partial: 'Leitura incompleta da agenda — revisão necessária',
  source_empty: 'A consulta atual não retornou agendamentos',
  source_phone_missing: 'Telefone não localizado na consulta atual',
  appointment_missing: 'Agendamento não localizado na consulta atual',
  appointment_ambiguous: 'Agendamento com identificação ambígua',
  recipient_not_eligible: 'Destinatário deixou de estar apto',
  contact_not_ready: 'Contato com pendência na consulta atual',
  patient_changed: 'Paciente diferente do aprovado — revisão necessária',
  recipient_changed: 'Destinatário diferente do aprovado — revisão necessária',
  phone_changed: 'Telefone diferente do aprovado — revisão necessária',
  appointment_time_changed: 'Horário diferente do aprovado — revisão necessária',
  agenda_changed: 'Agenda diferente da aprovada — revisão necessária',
  minor_status_changed: 'Classificação de idade mudou — revisão necessária',
  approval_timeout: 'Verificação da aprovação excedeu o tempo de espera',
  approval_access_denied: 'Acesso à verificação da aprovação recusado',
  approval_rate_limited: 'Verificação da aprovação temporariamente limitada',
  approval_service_unavailable: 'Serviço de verificação da aprovação indisponível',
  approval_invalid_response: 'Não foi possível validar a resposta da aprovação',
  approval_revalidation_failed: 'Aprovação não pôde ser revalidada',
  recipient_timeout: 'Verificação do destinatário excedeu o tempo de espera',
  recipient_access_denied: 'Acesso à verificação do destinatário recusado',
  recipient_rate_limited: 'Verificação do destinatário temporariamente limitada',
  recipient_service_unavailable: 'Serviço de verificação do destinatário indisponível',
  recipient_unavailable: 'Não foi possível concluir a verificação do destinatário',
  recipient_selection_changed: 'Agendamento mudou na verificação do destinatário',
  recipient_not_authorized: 'Contato não atende às verificações obrigatórias',
  recipient_invalid_response: 'Não foi possível validar os dados do destinatário',
  recipient_phone_changed: 'Telefone mudou durante a verificação — revisão necessária',

  waiting: 'Aguardando resposta',
  confirmed: 'Confirmação recebida',
  change_requested: 'Alteração solicitada',
  needs_review: 'Análise necessária',
  expired: 'Prazo vencido',
  human: 'Atendimento humano',
  accepted: 'Aceita pelo transporte',
  delivered: 'Entregue',
  read: 'Lida',
  failed: 'Falha de entrega',
  delivery_unknown: 'Resultado do transporte desconhecido',
  blocked: 'Transporte bloqueado',
  rejected: 'Transporte rejeitado',
  interpretation_required: 'Resposta não reconhecida',
  ambiguous_context: 'Vínculo ambíguo — não selecionar horário',
  sender_mismatch: 'Remetente incompatível',
  late_response: 'Resposta após o prazo',
  approval_changed: 'Aprovação alterada',
  revalidation_failed: 'Revalidação negativa ou indisponível',
  human_attendance: 'Atendimento humano preservado',
  conflicting_response: 'Resposta conflitante',
  no_response: 'Sem resposta',
  transport_unknown: 'Resultado do transporte desconhecido',
  transport_blocked: 'Tentativa bloqueada — análise interna',
  transport_rejected: 'Tentativa rejeitada pelo transporte',
  delivery_failed: 'Falha de entrega',
  channel_unavailable: 'Conversa indisponível',
  appointment_blocked: 'Confirmação no Saúde Vianet bloqueada',
  appointment_refused: 'Confirmação no Saúde Vianet recusada',
  appointment_indeterminate: 'Resultado no Saúde Vianet desconhecido — análise necessária',
  OPEN: 'Aberta',
  ASSIGNED: 'Em atendimento',
  COMPLETED: 'Concluída',
  ASSIGN: 'Assumida',
  COMPLETE: 'Concluída',
  CONTACT_HANDLED: 'Contato tratado pela recepção',
  CHANGE_REVIEWED: 'Pedido de alteração analisado',
  NO_ACTION_REQUIRED: 'Análise concluída sem ação adicional',
  TECHNICAL_REVIEWED: 'Questão técnica analisada',
}
export const responseLabel = (value: string) =>
  labels[value] ?? 'Situação indisponível'
export const appointmentLabel = (value?: string) => ({
  not_requested: 'Não solicitada',
  confirmed: 'Confirmado no Saúde Vianet',
  already_confirmed: 'Já confirmado no Saúde Vianet',
  blocked: 'Confirmação bloqueada',
  refused: 'Confirmação recusada',
  indeterminate: 'Resultado desconhecido — análise necessária',
}[value ?? 'not_requested'] ?? 'Situação indisponível')
export const localInstant = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
function safeConversation(value: string | null) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      /^\/app\/accounts\/\d+\/conversations\/\d+$/.test(url.pathname) &&
      !url.search &&
      !url.hash
      ? url.href
      : undefined
  } catch {
    return undefined
  }
}
export function ConfirmacaoRespostas({ campaignId }: { campaignId: number }) {
  const [data, setData] = useState<CampaignResponses | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState(false)
  const [resolution, setResolution] = useState<Record<string, string>>({})
  async function reload() {
    setData(await listarRespostas(campaignId))
  }
  useEffect(() => {
    let active = true
    void listarRespostas(campaignId)
      .then((value) => {
        if (active) setData(value)
      })
      .catch((reason) => {
        if (active)
          setError(
            mensagemErroApi(reason, 'Não foi possível consultar as respostas.'),
          )
      })
    return () => {
      active = false
    }
  }, [campaignId])
  async function act(work: () => Promise<unknown>) {
    setBusy(true)
    setError(null)
    try {
      await work()
      await reload()
    } catch (reason) {
      setError(
        mensagemErroApi(
          reason,
          'Não foi possível atualizar. Recarregue a lista antes de tentar novamente.',
        ),
      )
    } finally {
      setBusy(false)
    }
  }
  const rows =
    data?.responses.filter(
      (row) =>
        filter === 'all' ||
        row.responseStatus === filter ||
        (filter === 'pending_open' &&
          data.pending.some(
            (p) =>
              p.executionKey === row.executionKey && p.status !== 'COMPLETED',
          )) ||
        (filter === 'pending_complete' &&
          data.pending.some(
            (p) =>
              p.executionKey === row.executionKey && p.status === 'COMPLETED',
          )),
    ) ?? []
  const userName = (id: number | null) =>
    data?.users.find((user) => user.id === id)?.name ?? 'Não atribuído'
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Respostas e pendências</Typography>
      <Typography color="text.secondary">
        A resposta do paciente e o resultado da confirmação no Saúde Vianet
        são apresentados separadamente.
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack direction="row" spacing={2}>
        <TextField
          select
          label="Filtrar respostas"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          sx={{ minWidth: 240 }}
        >
          {[
            ['all', 'Todas'],
            ['waiting', 'Aguardando resposta'],
            ['confirmed', 'Confirmação recebida'],
            ['change_requested', 'Alteração solicitada'],
            ['expired', 'Prazo vencido'],
            ['pending_open', 'Pendências abertas'],
            ['pending_complete', 'Pendências concluídas'],
          ].map(([key, label]) => (
            <MenuItem key={key} value={key}>
              {label}
            </MenuItem>
          ))}
        </TextField>
        <Button disabled={busy} onClick={() => void act(reload)}>
          Atualizar respostas
        </Button>
      </Stack>
      {!data ? (
        <Typography>Carregando respostas.</Typography>
      ) : !data.responses.length ? (
        <Typography>Nenhuma tentativa operacional registrada.</Typography>
      ) : (
        <Paper sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Horário</TableCell>
                <TableCell>Transporte / entrega</TableCell>
                <TableCell>Resposta</TableCell>
                <TableCell>Saúde Vianet</TableCell>
                <TableCell>Prazo</TableCell>
                <TableCell>Pendências e histórico</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.executionKey}>
                  <TableCell>
                    {data.pending.some(
                      (p) =>
                        p.executionKey === row.executionKey &&
                        p.reason === 'ambiguous_context',
                    )
                      ? 'Vínculo ambíguo; horário candidato'
                      : row.appointmentTime}
                    <br />
                    {safeConversation(row.conversationUrl) && (
                      <Button
                        href={safeConversation(row.conversationUrl)!}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir conversa
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {responseLabel(row.transportStatus)}
                    <br />
                    {row.deliveryStatus
                      ? responseLabel(row.deliveryStatus)
                      : 'Entrega não comprovada'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={responseLabel(row.responseStatus)}
                    />
                    <Typography variant="caption" display="block">
                      {localInstant(row.updatedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>{appointmentLabel(row.appointmentStatus)}</TableCell>
                  <TableCell>{localInstant(row.responseDeadlineAt)}</TableCell>
                  <TableCell>
                    <Stack spacing={1}>
                      {data.pending
                        .filter((p) => p.executionKey === row.executionKey)
                        .map((p) => (
                          <Paper
                            key={p.id}
                            data-testid={`response-pending-${p.id}`}
                            variant="outlined"
                            sx={{ p: 1 }}
                          >
                            <Typography>
                              {responseLabel(p.reason)} ·{' '}
                              {responseLabel(p.status)}
                            </Typography>
                            <Typography variant="body2">
                              Responsável: {userName(p.assignedUserId)}
                            </Typography>
                            {p.status === 'OPEN' && (
                              <Button
                                disabled={busy}
                                onClick={() =>
                                  void act(() =>
                                    assumirPendencia(
                                      campaignId,
                                      p.id,
                                      p.version,
                                    ),
                                  )
                                }
                              >
                                Assumir pendência
                              </Button>
                            )}
                            {p.status === 'ASSIGNED' &&
                              p.assignedUserId === getLoggedUser()?.id && (
                                <Stack spacing={1}>
                                  <TextField
                                    select
                                    label="Resultado administrativo"
                                    value={resolution[p.id] ?? ''}
                                    onChange={(event) =>
                                      setResolution((old) => ({
                                        ...old,
                                        [p.id]: event.target.value,
                                      }))
                                    }
                                  >
                                    {[
                                      'CONTACT_HANDLED',
                                      'CHANGE_REVIEWED',
                                      'NO_ACTION_REQUIRED',
                                      'TECHNICAL_REVIEWED',
                                    ].map((code) => (
                                      <MenuItem key={code} value={code}>
                                        {responseLabel(code)}
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                  <Button
                                    disabled={busy || !resolution[p.id]}
                                    onClick={() =>
                                      void act(() =>
                                        concluirPendencia(
                                          campaignId,
                                          p.id,
                                          p.version,
                                          resolution[p.id],
                                        ),
                                      )
                                    }
                                  >
                                    Concluir pendência
                                  </Button>
                                </Stack>
                              )}
                            {p.resolution && (
                              <Typography>
                                {responseLabel(p.resolution)}
                              </Typography>
                            )}
                            {data.actions
                              .filter((a) => a.pendingId === p.id)
                              .map((a) => (
                                <Typography
                                  variant="caption"
                                  display="block"
                                  key={a.id}
                                >
                                  {responseLabel(a.action)} ·{' '}
                                  {userName(a.actorUserId)} ·{' '}
                                  {localInstant(a.createdAt)}
                                </Typography>
                              ))}
                          </Paper>
                        ))}
                    </Stack>
                    <details>
                      <summary>Histórico de respostas</summary>
                      {data.events
                        .filter(
                          (event) => event.executionKey === row.executionKey,
                        )
                        .map((event) => (
                          <Typography variant="body2" key={event.eventId}>
                            {localInstant(event.result.occurredAt)} ·{' '}
                            {responseLabel(event.result.responseStatus)}
                            {event.result.reason
                              ? ` · ${responseLabel(event.result.reason)}`
                              : ''}
                          </Typography>
                        ))}
                    </details>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Stack>
  )
}
