import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, IconButton, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import {
  adicionarDiasYmd,
  DIAS_SEMANA_CURTOS,
  gradeDoMes,
  mesmoMes,
  primeiroDiaDoMes,
  tituloMesPt,
  ultimoDiaDoMes,
  ymdEmSaoPaulo,
} from '../utils/dataHoraSaoPaulo'

function capitalizar(texto: string): string {
  if (!texto) return texto
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

interface AgendaCalendarioMiniProps {
  dataSelecionada: string
  onSelecionar: (ymd: string) => void
}

export function AgendaCalendarioMini({ dataSelecionada, onSelecionar }: AgendaCalendarioMiniProps) {
  const [mesExibido, setMesExibido] = useState(() => primeiroDiaDoMes(dataSelecionada))
  const hoje = ymdEmSaoPaulo()
  const dias = gradeDoMes(mesExibido)

  useEffect(() => {
    setMesExibido(primeiroDiaDoMes(dataSelecionada))
  }, [dataSelecionada])

  function irMesAnterior() {
    setMesExibido((prev) => primeiroDiaDoMes(adicionarDiasYmd(primeiroDiaDoMes(prev), -1)))
  }

  function irProximoMes() {
    setMesExibido((prev) => primeiroDiaDoMes(adicionarDiasYmd(ultimoDiaDoMes(prev), 1)))
  }

  return (
    <Box sx={{ width: 280, p: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1, pl: 0.5 }}>
          {capitalizar(tituloMesPt(mesExibido))}
        </Typography>
        <IconButton aria-label="Mês anterior" size="small" onClick={irMesAnterior}>
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <IconButton aria-label="Próximo mês" size="small" onClick={irProximoMes}>
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          mb: 0.5,
        }}
      >
        {DIAS_SEMANA_CURTOS.map((dia) => (
          <Typography
            key={dia}
            variant="caption"
            sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', py: 0.5 }}
          >
            {dia.charAt(0)}
          </Typography>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', justifyItems: 'center' }}>
        {dias.map((ymd) => {
          const dia = Number(ymd.slice(8, 10))
          const doMes = mesmoMes(ymd, mesExibido)
          const ehHoje = ymd === hoje
          const ehSelecionado = ymd === dataSelecionada

          return (
            <Box
              key={ymd}
              component="button"
              type="button"
              onClick={() => onSelecionar(ymd)}
              aria-label={ymd}
              aria-current={ehHoje ? 'date' : undefined}
              sx={{
                appearance: 'none',
                WebkitAppearance: 'none',
                fontFamily: 'inherit',
                width: 32,
                height: 32,
                m: 0.25,
                p: 0,
                border: ehSelecionado && !ehHoje ? '1px solid' : '1px solid transparent',
                borderColor: ehSelecionado && !ehHoje ? 'primary.main' : 'transparent',
                borderRadius: '50%',
                bgcolor: ehHoje ? 'primary.main' : 'transparent',
                color: ehHoje ? 'primary.contrastText' : doMes ? 'text.primary' : 'text.disabled',
                fontSize: 13,
                fontWeight: ehHoje || ehSelecionado ? 700 : 400,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: ehHoje ? 'primary.dark' : 'action.hover',
                },
              }}
            >
              {dia}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
