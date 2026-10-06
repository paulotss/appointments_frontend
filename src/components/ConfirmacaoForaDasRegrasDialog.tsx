import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'

interface ConfirmacaoForaDasRegrasDialogProps {
  open: boolean
  warnings: { message: string }[]
  confirming: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmacaoForaDasRegrasDialog({
  open,
  warnings,
  confirming,
  onCancel,
  onConfirm,
}: ConfirmacaoForaDasRegrasDialogProps) {
  return (
    <Dialog open={open} onClose={confirming ? undefined : onCancel} fullWidth maxWidth="sm">
      <DialogTitle>Marcação fora das regras</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          <Typography>
            Esta marcação está fora das regras configuradas na ficha do profissional. Você pode
            continuar mesmo assim.
          </Typography>
          <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.5 }}>
            {warnings.map((item, index) => (
              <Typography key={`${item.message}-${index}`} component="li">
                {item.message}
              </Typography>
            ))}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={confirming}>
          Voltar
        </Button>
        <Button onClick={onConfirm} variant="contained" disabled={confirming}>
          Continuar mesmo assim
        </Button>
      </DialogActions>
    </Dialog>
  )
}
