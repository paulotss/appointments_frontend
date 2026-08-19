import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
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
  Typography,
} from '@mui/material'
import { Fragment, useState } from 'react'
import type { Procedure } from '../types/procedimento'
import { formatarMoedaBRL } from '../utils/moedaBRL'

interface ProcedimentosTableProps {
  procedimentos: Procedure[]
  onEditar: (procedimento: Procedure) => void
  onExcluir: (procedimento: Procedure) => void
}

function ProcedimentoConveniosTabela({ procedimento }: { procedimento: Procedure }) {
  if (procedimento.healthPlanPrices.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Nenhum convênio cadastrado para este procedimento.
      </Typography>
    )
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Convênio</TableCell>
            <TableCell align="right">Valor</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {procedimento.healthPlanPrices.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.healthPlan?.name ?? `Plano ${item.healthPlanId}`}</TableCell>
              <TableCell align="right">{formatarMoedaBRL(item.value) || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function ProcedimentoRow({
  procedimento,
  onEditar,
  onExcluir,
}: {
  procedimento: Procedure
  onEditar: (procedimento: Procedure) => void
  onExcluir: (procedimento: Procedure) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Fragment>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            size="small"
            aria-label={open ? 'Recolher convênios' : 'Expandir convênios'}
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{procedimento.tissCode}</TableCell>
        <TableCell>{procedimento.name}</TableCell>
        <TableCell>{procedimento.specialty?.name ?? '—'}</TableCell>
        <TableCell>{formatarMoedaBRL(procedimento.value) || '—'}</TableCell>
        <TableCell align="right">
          <IconButton
            size="small"
            aria-label="Editar procedimento"
            onClick={() => onEditar(procedimento)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            aria-label="Excluir procedimento"
            onClick={() => onExcluir(procedimento)}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6} sx={{ py: 0, px: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 1.5, px: 2 }}>
              <ProcedimentoConveniosTabela procedimento={procedimento} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  )
}

export function ProcedimentosTable({ procedimentos, onEditar, onExcluir }: ProcedimentosTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell width={48} />
            <TableCell>TISS</TableCell>
            <TableCell>Nome</TableCell>
            <TableCell>Especialidade</TableCell>
            <TableCell>Valor particular</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {procedimentos.map((procedimento) => (
            <ProcedimentoRow
              key={procedimento.id}
              procedimento={procedimento}
              onEditar={onEditar}
              onExcluir={onExcluir}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
