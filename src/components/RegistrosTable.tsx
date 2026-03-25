import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  Box,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { Fragment, useState } from 'react'
import type { RegistroAtendimento } from '../types/registro'

interface RegistrosTableProps {
  registros: RegistroAtendimento[]
}

interface RegistroRowProps {
  registro: RegistroAtendimento
}

function RegistroRow({ registro }: RegistroRowProps) {
  const [open, setOpen] = useState(false)

  function formatarAtendimento(value: RegistroAtendimento['atendimento']) {
    if (value === 'telefone') {
      return 'Telefone'
    }
    if (value === 'outro') {
      return 'Outro'
    }
    return 'WhatsApp'
  }

  const data = new Date(registro.data)
  const dataFormatada = data.toLocaleDateString('pt-BR')
  const horaFormatada = data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return (
    <Fragment>
      <TableRow hover>
        <TableCell padding="checkbox">
          <IconButton size="small" onClick={() => setOpen((prev) => !prev)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{`${dataFormatada} ${horaFormatada}`}</TableCell>
        <TableCell>{registro.nome}</TableCell>
        <TableCell>{registro.telefone}</TableCell>
        <TableCell>{formatarAtendimento(registro.atendimento)}</TableCell>
        <TableCell>{registro.primeira_vez === 'sim' ? 'Sim' : 'Nao'}</TableCell>
        <TableCell>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            {registro.agendamento === 'sim' ? 'Sim' : 'Nao'}
            {registro.agendamento === 'nao' && registro.motivo ? (
              <Tooltip title={registro.motivo} arrow>
                <IconButton size="small" aria-label="Ver motivo do agendamento">
                  <InfoOutlinedIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Box>
        </TableCell>
        <TableCell>{registro.atendente}</TableCell>
      </TableRow>

      <TableRow>
        <TableCell sx={{ py: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2, display: 'grid', gap: 1 }}>
              <Typography variant="body2">
                <strong>Especialidade:</strong> {registro.especialidade_nome ?? '-'}
              </Typography>
              <Typography variant="body2">
                <strong>Observações:</strong> {registro.observacoes || '-'}
              </Typography>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  )
}

export function RegistrosTable({ registros }: RegistrosTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Data</TableCell>
            <TableCell>Nome</TableCell>
            <TableCell>Telefone</TableCell>
            <TableCell>Atend.</TableCell>
            <TableCell>1a vez</TableCell>
            <TableCell>Agend.</TableCell>
            <TableCell>Atendente</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {registros.map((registro) => (
            <RegistroRow key={registro.id} registro={registro} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
