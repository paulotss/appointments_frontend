import { Alert, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { listarSimulacoes, type CampaignSimulation } from '../services/confirmacao.service'

const STATUS = { RUNNING: 'Em andamento', COMPLETED: 'Concluída', INVALIDATED: 'Invalidada' }
const BLOQUEIOS: Record<string, string> = {
  campaign_missing: 'Campanha não disponível', campaign_incomplete: 'Consulta da agenda incompleta',
  weekend: 'Fim de semana', holiday: 'Feriado', before_hours: 'Antes do horário de operação',
  after_hours: 'Após o horário de operação', campaign_weekend: 'Agendamentos em fim de semana',
  campaign_holiday: 'Agendamentos em feriado', campaign_stale: 'Data da campanha já passou',
  campaign_too_far: 'Campanha fora do período de operação',
}

function resumo(report: NonNullable<CampaignSimulation['report']>) {
  const simulated = report.items.filter((item) => item.result === 'simulated').length
  const remaining = report.items.length - simulated
  return `${simulated} ${simulated === 1 ? 'item simulado' : 'itens simulados'} · ${remaining} ${remaining === 1 ? 'item bloqueado, retido ou com falha' : 'itens bloqueados, retidos ou com falha'}.`
}

export function ConfirmacaoSimulacoes({ campaignId, revision }: { campaignId: number; revision: string }) {
  const [runs, setRuns] = useState<CampaignSimulation[]>([])
  const [refresh, setRefresh] = useState(0)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    void listarSimulacoes(campaignId).then((rows) => {
      if (rows.some((run) => run.mode !== 'simulation' || run.dispatchEnabled !== false)) throw new Error('invalid simulation history')
      if (active) setRuns(rows)
    }).catch(() => { if (active) setError(true) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [campaignId, revision, refresh])
  return (
    <Stack spacing={1} component="section" aria-label="Simulações sem envio">
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Simulações sem envio</Typography>
        <Button disabled={loading} onClick={() => setRefresh((value) => value + 1)}>Atualizar simulações</Button>
      </Stack>
      <Alert severity="info">Resultados de teste. Nenhuma mensagem foi enviada por estas simulações.</Alert>
      {error ? <Alert severity="warning">Não foi possível consultar as simulações.</Alert> : null}
      {loading ? <Typography>Consultando simulações.</Typography> : null}
      {!loading && !error && runs.length === 0 ? <Typography>Nenhuma simulação registrada.</Typography> : null}
      {!error && runs.map((run) => (
        <Paper key={run.runId} sx={{ p: 1.5 }}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Chip label={run.leaseExpired ? 'Interrompida' : STATUS[run.status]} />
              {!run.currentApproval ? <Chip color="warning" label="Aprovação não vigente" /> : null}
            </Stack>
            <Typography>{new Date(run.createdAt).toLocaleString('pt-BR')}</Typography>
            {run.report ? (
              <Typography>
                {run.report.blocked
                  ? `Simulação bloqueada: ${BLOQUEIOS[run.report.blocked] ?? 'Condições de operação não atendidas'}.`
                  : resumo(run.report)}
              </Typography>
            ) : null}
          </Stack>
        </Paper>
      ))}
    </Stack>
  )
}
