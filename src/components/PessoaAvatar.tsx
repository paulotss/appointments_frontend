import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import PersonIcon from '@mui/icons-material/Person'
import { Avatar, Box } from '@mui/material'

export type PessoaAvatarTipo = 'paciente' | 'profissional'

function iniciaisDoNome(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return '?'
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  const first = parts[0][0] ?? ''
  const last = parts[parts.length - 1][0] ?? ''
  return `${first}${last}`.toUpperCase()
}

interface PessoaAvatarProps {
  name: string
  tipo: PessoaAvatarTipo
  src?: string
  size?: number
}

export function PessoaAvatar({ name, tipo, src, size = 24 }: PessoaAvatarProps) {
  const badgeSize = Math.max(12, Math.round(size * 0.45))
  const Icon = tipo === 'profissional' ? MedicalServicesIcon : PersonIcon

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <Avatar
        src={src}
        alt={name}
        sx={{
          width: size,
          height: size,
          fontSize: size * 0.4,
          fontWeight: 700,
          bgcolor: tipo === 'profissional' ? 'primary.main' : 'info.main',
          color: 'common.white',
        }}
      >
        {iniciaisDoNome(name)}
      </Avatar>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          right: -2,
          bottom: -2,
          width: badgeSize,
          height: badgeSize,
          borderRadius: '50%',
          bgcolor: tipo === 'profissional' ? 'primary.dark' : 'info.dark',
          color: 'common.white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid',
          borderColor: 'background.paper',
        }}
      >
        <Icon sx={{ fontSize: badgeSize - 2 }} />
      </Box>
    </Box>
  )
}
