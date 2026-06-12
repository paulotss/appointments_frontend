import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { EspecialidadesPage } from './pages/EspecialidadesPage'
import { EspecialidadesAtendidasPage } from './pages/EspecialidadesAtendidasPage'
import { LoginPage } from './pages/LoginPage'
import { AtendimentosPage } from './pages/AtendimentosPage'
import { HorariosPage } from './pages/HorariosPage'
import { TaxaConversaoPage } from './pages/TaxaConversaoPage'
import { NovaEspecialidadePage } from './pages/NovaEspecialidadePage'
import { ChamadaDetalhePage } from './pages/ChamadaDetalhePage'
import { ChamadasPage } from './pages/ChamadasPage'
import { NovoRegistroPage } from './pages/NovoRegistroPage'
import { RegistrosPage } from './pages/RegistrosPage'
import { NovoUsuarioPage } from './pages/NovoUsuarioPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { UsuariosPage } from './pages/UsuariosPage'
import { AdminRoute } from './routes/AdminRoute'
import { ProtectedRoute } from './routes/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/registros" replace />} />
        <Route path="/registros" element={<RegistrosPage />} />
        <Route path="/registros/novo" element={<NovoRegistroPage />} />
        <Route path="/chamadas" element={<ChamadasPage />} />
        <Route path="/chamadas/:callId" element={<ChamadaDetalhePage />} />
        <Route path="/relatorios/horarios" element={<HorariosPage />} />
        <Route path="/relatorios/atendimentos" element={<AtendimentosPage />} />
        <Route path="/relatorios/taxa-conversao" element={<TaxaConversaoPage />} />
        <Route path="/relatorios/especialidades-atendidas" element={<EspecialidadesAtendidasPage />} />
        <Route
          path="/estoque/produtos"
          element={
            <AdminRoute>
              <PlaceholderPage title="Produtos" />
            </AdminRoute>
          }
        />
        <Route
          path="/estoque/movimentacoes"
          element={
            <AdminRoute>
              <PlaceholderPage title="Movimentações" />
            </AdminRoute>
          }
        />
        <Route
          path="/relatorios/estoque"
          element={
            <AdminRoute>
              <PlaceholderPage title="Relatório de Estoque" />
            </AdminRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/categorias"
          element={
            <AdminRoute>
              <PlaceholderPage title="Categorias" />
            </AdminRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/produtos"
          element={
            <AdminRoute>
              <PlaceholderPage title="Produtos" />
            </AdminRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/setores"
          element={
            <AdminRoute>
              <PlaceholderPage title="Setores" />
            </AdminRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/locais"
          element={
            <AdminRoute>
              <PlaceholderPage title="Locais" />
            </AdminRoute>
          }
        />
        <Route
          path="/especialidades"
          element={
            <AdminRoute>
              <EspecialidadesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/especialidades/nova"
          element={
            <AdminRoute>
              <NovaEspecialidadePage />
            </AdminRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <AdminRoute>
              <UsuariosPage />
            </AdminRoute>
          }
        />
        <Route
          path="/usuarios/novo"
          element={
            <AdminRoute>
              <NovoUsuarioPage />
            </AdminRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/registros" replace />} />
    </Routes>
  )
}

export default App
