import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  baixarCanvasJpeg,
  copiarCartao,
  desenharCartaoVirtual,
  nomeArquivoCartao,
  type CartaoVirtualDados,
} from '../utils/cartaoVirtual'

interface CartaoVirtualDialogProps {
  open: boolean
  dados: CartaoVirtualDados | null
  onClose: () => void
}

export function CartaoVirtualDialog({ open, dados, onClose }: CartaoVirtualDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const bitmapRef = useRef<HTMLCanvasElement | null>(null)
  const [geracao, setGeracao] = useState(0)
  const [pronto, setPronto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [baixando, setBaixando] = useState(false)

  const ligarCanvas = useCallback((node: HTMLCanvasElement | null) => {
    if (canvasRef.current === node) return
    canvasRef.current = node
    setGeracao((atual) => atual + 1)
  }, [])

  useEffect(() => {
    if (!open || !dados || !canvasRef.current) return
    const canvas = canvasRef.current
    let cancelado = false
    setPronto(false)
    setErro(null)
    const bitmap = document.createElement('canvas')
    void desenharCartaoVirtual(bitmap, dados)
      .then(() => {
        if (cancelado) return
        bitmapRef.current = bitmap
        copiarCartao(canvas, bitmap)
        setPronto(true)
      })
      .catch((error: unknown) => {
        if (!cancelado) {
          setErro(error instanceof Error ? error.message : 'Não foi possível gerar o cartão.')
        }
      })
    return () => {
      cancelado = true
    }
  }, [open, dados, geracao])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    const bitmap = bitmapRef.current
    if (!open || !canvas || !bitmap) return
    copiarCartao(canvas, bitmap)
  }, [open, pronto, geracao])

  async function baixar() {
    const bitmap = bitmapRef.current
    if (!bitmap || !dados) return
    setBaixando(true)
    setErro(null)
    try {
      await baixarCanvasJpeg(bitmap, nomeArquivoCartao(dados.cardNumber, dados.nome))
    } catch (error: unknown) {
      setErro(error instanceof Error ? error.message : 'Não foi possível baixar o cartão.')
    } finally {
      setBaixando(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cartão virtual</DialogTitle>
      <DialogContent>
        {erro ? (
          <Alert severity="error" sx={{ mb: 1 }}>
            {erro}
          </Alert>
        ) : null}
        {!pronto && !erro ? (
          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2">Gerando cartão...</Typography>
          </Stack>
        ) : null}
        <canvas
          ref={ligarCanvas}
          style={{
            display: erro ? 'none' : 'block',
            width: '100%',
            maxWidth: 360,
            height: 'auto',
            borderRadius: 8,
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
        <Button variant="contained" disabled={!pronto || baixando} onClick={() => void baixar()}>
          {baixando ? 'Baixando...' : 'Baixar JPEG'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
