import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import type { ProfessionalScheduleDay, ScheduleExceptionInput, ScheduleExceptionKind } from '../types/bloqueioHorario'
import {
  minutoParaHorario,
  paraIntervalo,
  resolverBloqueiosEfetivos,
} from '../utils/bloqueioHorario'
import { tituloDiaPt } from '../utils/dataHoraSaoPaulo'

type ExcecaoRascunho = {
  key: string
  kind: ScheduleExceptionKind
  startTime: string
  endTime: string
  note: string
}

interface AjusteBloqueioDiaDialogProps {
  open: boolean
  profissionalNome: string
  dia: ProfessionalScheduleDay | null
  saving: boolean
  onClose: () => void
  onSave: (exceptions: ScheduleExceptionInput[]) => void
}

function novaExcecao(kind: ScheduleExceptionKind, startTime: string, endTime: string): ExcecaoRascunho {
  return {
    key: `${kind}-${startTime}-${endTime}-${Date.now()}-${Math.random()}`,
    kind,
    startTime,
    endTime,
    note: '',
  }
}

export function AjusteBloqueioDiaDialog({
  open,
  profissionalNome,
  dia,
  saving,
  onClose,
  onSave,
}: AjusteBloqueioDiaDialogProps) {
  const [excecoes, setExcecoes] = useState<ExcecaoRascunho[]>([])

  useEffect(() => {
    if (!open || !dia) return
    setExcecoes(
      dia.exceptions.map((item, index) => ({
        key: `${dia.date}-${index}`,
        kind: item.kind,
        startTime: item.startTime,
        endTime: item.endTime,
        note: item.note ?? '',
      })),
    )
  }, [open, dia])

  const previa = useMemo(() => {
    if (!dia) return []
    const semanais = dia.weeklyBlocks
      .map((item) => paraIntervalo(item))
      .filter((item): item is NonNullable<typeof item> => item != null)
    const liberacoes = excecoes
      .filter((item) => item.kind === 'release')
      .map((item) => paraIntervalo(item))
      .filter((item): item is NonNullable<typeof item> => item != null)
    const bloqueios = excecoes
      .filter((item) => item.kind === 'block')
      .map((item) => paraIntervalo(item))
      .filter((item): item is NonNullable<typeof item> => item != null)
    return resolverBloqueiosEfetivos({ semanais, liberacoes, bloqueios }).map((item) => ({
      startTime: minutoParaHorario(item.startMinute),
      endTime: minutoParaHorario(item.endMinute),
    }))
  }, [dia, excecoes])

  const invalida = excecoes.some((item) => !paraIntervalo(item))

  function atualizar(key: string, patch: Partial<ExcecaoRascunho>) {
    setExcecoes((atual) => atual.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  }

  function liberarSemanal(startTime: string, endTime: string) {
    setExcecoes((atual) => {
      const jaExiste = atual.some(
        (item) => item.kind === 'release' && item.startTime === startTime && item.endTime === endTime,
      )
      if (jaExiste) return atual
      return [...atual, novaExcecao('release', startTime, endTime)]
    })
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Bloqueio de {profissionalNome} em {dia ? tituloDiaPt(dia.date) : ''}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Stack spacing={1}>
            <Typography variant="subtitle2" fontWeight={700}>
              Regra da semana
            </Typography>
            {dia && dia.weeklyBlocks.length > 0 ? (
              dia.weeklyBlocks.map((item) => (
                <Stack key={`${item.startTime}-${item.endTime}`} direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {item.startTime}–{item.endTime}
                  </Typography>
                  <Button size="small" onClick={() => liberarSemanal(item.startTime, item.endTime)}>
                    Liberar neste dia
                  </Button>
                </Stack>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                Nenhum bloqueio semanal neste dia da semana.
              </Typography>
            )}
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2" fontWeight={700}>
              Ajustes deste dia
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setExcecoes((atual) => [...atual, novaExcecao('block', '00:00', '24:00')])}
              >
                Bloquear dia inteiro
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setExcecoes((atual) => [...atual, novaExcecao('block', '08:00', '12:00')])}
              >
                Bloquear período
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setExcecoes((atual) => [...atual, novaExcecao('release', '08:00', '12:00')])}
              >
                Liberar período
              </Button>
            </Stack>
            {excecoes.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Nenhum ajuste só para esta data.
              </Typography>
            ) : null}
            {excecoes.map((item) => (
              <Stack key={item.key} spacing={1}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    select
                    label="Tipo"
                    value={item.kind}
                    onChange={(event) =>
                      atualizar(item.key, { kind: event.target.value as ScheduleExceptionKind })
                    }
                    sx={{ minWidth: 140 }}
                  >
                    <MenuItem value="block">Bloquear</MenuItem>
                    <MenuItem value="release">Liberar</MenuItem>
                  </TextField>
                  <TextField
                    label="Início"
                    value={item.startTime}
                    onChange={(event) => atualizar(item.key, { startTime: event.target.value })}
                    slotProps={{ htmlInput: { maxLength: 5 } }}
                  />
                  <TextField
                    label="Fim"
                    value={item.endTime}
                    onChange={(event) => atualizar(item.key, { endTime: event.target.value })}
                    slotProps={{ htmlInput: { maxLength: 5 } }}
                  />
                  <IconButton aria-label="Remover ajuste" onClick={() => setExcecoes((atual) => atual.filter((row) => row.key !== item.key))}>
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
                <TextField
                  label="Observação (opcional)"
                  value={item.note}
                  onChange={(event) => atualizar(item.key, { note: event.target.value })}
                  placeholder="Folga, atestado"
                  slotProps={{ htmlInput: { maxLength: 200 } }}
                />
              </Stack>
            ))}
          </Stack>

          {invalida ? (
            <Alert severity="error">O horário final deve ser depois do início.</Alert>
          ) : (
            <Alert severity="info">
              {previa.length === 0
                ? 'Neste dia nenhum horário fica bloqueado.'
                : `Neste dia ficam bloqueados: ${previa.map((item) => `${item.startTime}–${item.endTime}`).join(', ')}.`}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={saving || invalida || !dia}
          onClick={() =>
            onSave(
              excecoes.map((item) => ({
                kind: item.kind,
                startTime: item.startTime,
                endTime: item.endTime,
                ...(item.note.trim() ? { note: item.note.trim() } : {}),
              })),
            )
          }
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
