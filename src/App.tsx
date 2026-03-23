import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { EspecialidadesPage } from './pages/EspecialidadesPage'
import { LoginPage } from './pages/LoginPage'
import { NovaEspecialidadePage } from './pages/NovaEspecialidadePage'
import { NovoRegistroPage } from './pages/NovoRegistroPage'
import { RegistrosPage } from './pages/RegistrosPage'
import { NovoUsuarioPage } from './pages/NovoUsuarioPage'
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
