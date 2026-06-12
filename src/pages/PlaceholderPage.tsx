import { Box, Paper, Typography } from '@mui/material'

interface PlaceholderPageProps {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
        {title}
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">Em construção</Typography>
      </Paper>
    </Box>
  )
}
