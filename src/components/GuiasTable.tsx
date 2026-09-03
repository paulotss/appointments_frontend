import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { Fragment, useState, type MouseEvent } from 'react'
import type { InsuranceGuide, InsuranceGuideStatus } from '../types/guia'
import { guiaElegivelParaFaturar, guiaProcedimentosTotalmenteUtilizados, INSURANCE_GUIDE_STATUS_LABELS } from '../types/guia'
import { formatarDataISO, statusPrazoGuia } from '../utils/dataISO'
import { saldoDisponivelGuia } from '../utils/saldoGuia'
import { GuiaProcedimentosTabela } from './GuiaProcedimentosTabela'

interface GuiasTableProps {
  guias: InsuranceGuide[]
  onAbrir: (guia: InsuranceGuide) => void
  onEditar: (guia: InsuranceGuide) => void
  onExcluir: (guia: InsuranceGuide) => void
  onFaturar: (guia: InsuranceGuide) => void
}

const sxSomenteMd = { display: { xs: 'none', md: 'table-cell' } } as const
const COLSPAN_LINHA = 9

const sxTextoTruncado = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: 0,
} as const

function corChipStatusGuia(status: InsuranceGuideStatus) {
  if (status === 'pending') {
    return { bgcolor: 'error.light', color: '#fff' }
  }
  if (status === 'under_analysis') {
    return { bgcolor: 'warning.main', color: 'warning.contrastText' }
  }
  if (status === 'authorized') {
    return { bgcolor: 'success.main', color: 'success.contrastText' }
  }
  return undefined
}

function corLinhaGuia(guia: InsuranceGuide) {
  if (guia.isBilled) {
    return {
      bgcolor: 'success.light',
      '&:hover': { bgcolor: 'success.light' },
    }
  }
  const status = statusPrazoGuia(guia.expirationDate)
  if (status === 'vencida' || status === 'ultimoDia') {
    return {
      bgcolor: 'error.light',
      '&:hover': { bgcolor: 'error.light' },
    }
  }
  if (status === 'proxima') {
    return {
      bgcolor: 'warning.light',
      '&:hover': { bgcolor: 'warning.light' },
    }
  }
  return undefined
}

function pararClique(event: MouseEvent) {
  event.stopPropagation()
}

function GuiaRow({
  guia,
  onAbrir,
  onEditar,
  onExcluir,
  onFaturar,
}: {
  guia: InsuranceGuide
  onAbrir: (guia: InsuranceGuide) => void
  onEditar: (guia: InsuranceGuide) => void
  onExcluir: (guia: InsuranceGuide) => void
  onFaturar: (guia: InsuranceGuide) => void
}) {
  const [open, setOpen] = useState(false)
  const corLinha = corLinhaGuia(guia)
  const podeFaturar = guiaElegivelParaFaturar(guia)
  const saldo = saldoDisponivelGuia(guia)

  return (
    <Fragment>
      <TableRow
        hover
        onClick={() => onAbrir(guia)}
        sx={{ ...corLinha, cursor: 'pointer', '& > *': { borderBottom: 'unset' } }}
      >
        <TableCell sx={sxSomenteMd}>
          <IconButton
            size="small"
            aria-label={open ? 'Recolher procedimentos' : 'Expandir procedimentos'}
            onClick={(event) => {
              pararClique(event)
              setOpen((prev) => !prev)
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }} title={guia.guideNumber?.trim() || undefined}>
          {guia.guideNumber?.trim() || '-'}
        </TableCell>
        <TableCell sx={sxTextoTruncado} title={guia.patient?.name ?? undefined}>
          {guia.patient?.name ?? '—'}
        </TableCell>
        <TableCell sx={{ ...sxTextoTruncado, ...sxSomenteMd }} title={guia.healthPlan?.name ?? undefined}>
          {guia.healthPlan?.name ?? '—'}
        </TableCell>
        <TableCell sx={{ ...sxTextoTruncado, ...sxSomenteMd }} title={guia.healthProfessional?.name ?? undefined}>
          {guia.healthProfessional?.name ?? '—'}
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', ...sxSomenteMd }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, flexWrap: 'nowrap' }}>
            <Chip
              size="small"
              label={INSURANCE_GUIDE_STATUS_LABELS[guia.status] ?? guia.status}
              sx={corChipStatusGuia(guia.status)}
            />
            {guiaProcedimentosTotalmenteUtilizados(guia.procedures) ? (
              <CheckCircleIcon
                fontSize="small"
                color="success"
                aria-label="Quantidade utilizada igual à autorizada em todos os procedimentos"
              />
            ) : null}
          </Box>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', ...sxSomenteMd }}>{formatarDataISO(guia.expirationDate)}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', ...sxSomenteMd }}>
          <Chip size="small" label={saldo} color={saldo > 0 ? 'primary' : 'default'} />
        </TableCell>
        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
          <Box
            sx={{ display: 'inline-flex', flexWrap: 'nowrap', justifyContent: 'flex-end' }}
            onClick={pararClique}
          >
            <IconButton size="small" aria-label="Ver guia" onClick={() => onAbrir(guia)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
            {podeFaturar ? (
              <IconButton size="small" color="primary" aria-label="Faturar guia" onClick={() => onFaturar(guia)}>
                <ReceiptLongIcon fontSize="small" />
              </IconButton>
            ) : null}
            <IconButton size="small" aria-label="Editar guia" onClick={() => onEditar(guia)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              aria-label="Excluir guia"
              onClick={() => onExcluir(guia)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>
      <TableRow sx={{ display: { xs: 'none', md: 'table-row' } }}>
        <TableCell colSpan={COLSPAN_LINHA} sx={{ py: 0, px: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 1.5, px: 2 }}>
              <GuiaProcedimentosTabela
                procedimentos={guia.procedures}
                healthPlanId={guia.healthPlanId}
              />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  )
}

export function GuiasTable({ guias, onAbrir, onEditar, onExcluir, onFaturar }: GuiasTableProps) {
  return (
    <TableContainer>
      <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 48, ...sxSomenteMd }} />
            <TableCell sx={{ width: 130, whiteSpace: 'nowrap' }}>Guia</TableCell>
            <TableCell sx={{ width: '32%' }}>Paciente</TableCell>
            <TableCell sx={{ width: '20%', ...sxSomenteMd }}>Plano</TableCell>
            <TableCell sx={{ width: '24%', ...sxSomenteMd }}>Profissional</TableCell>
            <TableCell sx={{ width: 160, whiteSpace: 'nowrap', ...sxSomenteMd }}>Status</TableCell>
            <TableCell sx={{ width: 110, whiteSpace: 'nowrap', ...sxSomenteMd }}>Validade</TableCell>
            <TableCell sx={{ width: 88, whiteSpace: 'nowrap', ...sxSomenteMd }}>Saldo</TableCell>
            <TableCell align="right" sx={{ width: 216, whiteSpace: 'nowrap' }}>
              Ações
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {guias.map((guia) => (
            <GuiaRow
              key={guia.id}
              guia={guia}
              onAbrir={onAbrir}
              onEditar={onEditar}
              onExcluir={onExcluir}
              onFaturar={onFaturar}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
