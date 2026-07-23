import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import type { Fornecedor, LoteEstoqueFornecedor } from '../types/estoque'
import { formatarCnpj, formatarTelefone } from '../utils/fornecedorFormat'

type FornecedorDetalhe = Fornecedor | LoteEstoqueFornecedor

interface FornecedorDetalheDialogProps {
  fornecedor: FornecedorDetalhe | null
  open: boolean
  onClose: () => void
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{valor}</Typography>
    </Stack>
  )
}

export function FornecedorDetalheDialog({
  fornecedor,
  open,
  onClose,
}: FornecedorDetalheDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Fornecedor</DialogTitle>
      <DialogContent>
        {fornecedor ? (
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <Campo label="Nome fantasia" valor={fornecedor.tradeName} />
            <Campo label="Razão social" valor={fornecedor.legalName} />
            <Campo label="CNPJ" valor={formatarCnpj(fornecedor.cnpj)} />
            <Campo label="Telefone" valor={formatarTelefone(fornecedor.phone)} />
            <Campo label="E-mail" valor={fornecedor.email} />
            <Campo label="Website" valor={fornecedor.website?.trim() || '—'} />
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  )
}
