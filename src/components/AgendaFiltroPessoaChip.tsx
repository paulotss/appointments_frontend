import { Box, Chip } from '@mui/material'
import { PessoaAvatar, type PessoaAvatarTipo } from './PessoaAvatar'

interface AgendaFiltroPessoaChipProps {
  name: string
  tipo: PessoaAvatarTipo
  src?: string
  onDelete: () => void
}

export function AgendaFiltroPessoaChip({ name, tipo, src, onDelete }: AgendaFiltroPessoaChipProps) {
  return (
    <Chip
      variant="outlined"
      onDelete={onDelete}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
          <PessoaAvatar name={name} tipo={tipo} src={src} size={24} />
          <Box
            component="span"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </Box>
        </Box>
      }
      sx={{
        maxWidth: 220,
        height: 36,
        overflow: 'visible',
        '& .MuiChip-label': {
          display: 'flex',
          pl: 0.5,
          pr: 1,
          overflow: 'visible',
        },
      }}
    />
  )
}
