import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { RegistroVisita } from './pages/RegistroVisita';
import { Login } from './pages/Login';
import { ListadoVisitas } from './pages/ListadoVisitas';
import { Calendario } from './pages/Calendario';
import { Configuraciones } from './pages/Configuraciones';
import { DetalleVisita } from './pages/DetalleVisita';
import { GestionUsuarios } from './pages/GestionUsuarios';
import { EditarVisita } from './pages/EditarVisita';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Gestores } from './pages/Gestores';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública sin el Layout principal */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rutas protegidas (envueltas en el Layout) */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout><Dashboard /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/nueva-visita" element={
          <ProtectedRoute>
            <MainLayout><RegistroVisita /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/visitas" element={
          <ProtectedRoute>
            <MainLayout><ListadoVisitas /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/visitas/editar/:id" element={
          <ProtectedRoute>
            <MainLayout><EditarVisita /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/visitas/:id" element={
          <ProtectedRoute>
            <MainLayout><DetalleVisita /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/calendario" element={
          <ProtectedRoute>
            <MainLayout><Calendario /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/configuraciones" element={
          <ProtectedRoute>
            <MainLayout><Configuraciones /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/usuarios" element={
          <ProtectedRoute>
            <MainLayout><GestionUsuarios /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/gestores" element={
          <ProtectedRoute>
            <MainLayout><Gestores /></MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;