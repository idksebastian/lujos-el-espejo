import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ConfiguracionProvider } from './contexts/ConfiguracionContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import PublicLayout from './pages/public/PublicLayout'
import HomePage from './pages/public/HomePage'
import LunasPage from './pages/public/LunasPage'
import ServiciosPage from './pages/public/ServiciosPage'
import ServicioDetallePage from './pages/public/ServicioDetallePage'
import ProductosPage from './pages/public/ProductosPage'
import ContactoPage from './pages/public/ContactoPage'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import InventarioPage from './pages/inventario/InventarioPage'
import NuevaVentaPage from './pages/ventas/NuevaVentaPage'
import HistorialVentasPage from './pages/ventas/HistorialVentasPage'
import ReportesPage from './pages/reportes/ReportesPage'
import CierreDiaPage from './pages/cierre/CierreDiaPage'
import GastosPage from './pages/gastos/GastosPage'
import MecanicosPage from './pages/admin/MecanicosPage'
import UsuariosPage from './pages/admin/UsuariosPage'
import ConfiguracionPage from './pages/admin/ConfiguracionPage'
import SitioWebPage from './pages/admin/SitioWebPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfiguracionProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/lunas" element={<LunasPage />} />
              <Route path="/servicios" element={<ServiciosPage />} />
              <Route path="/servicios/:id" element={<ServicioDetallePage />} />
              <Route path="/productos" element={<ProductosPage />} />
              <Route path="/contacto" element={<ContactoPage />} />
            </Route>
            <Route path="/admin/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/inventario" element={<InventarioPage />} />

                <Route element={<ProtectedRoute roles={['admin']} />}>
                  <Route path="/admin/ventas/nueva" element={<NuevaVentaPage />} />
                  <Route path="/admin/ventas/historial" element={<HistorialVentasPage />} />
                  <Route path="/admin/reportes" element={<ReportesPage />} />
                  <Route path="/admin/cierre" element={<CierreDiaPage />} />
                  <Route path="/admin/gastos" element={<GastosPage />} />
                  <Route path="/admin/mecanicos" element={<MecanicosPage />} />
                  <Route path="/admin/usuarios" element={<UsuariosPage />} />
                  <Route path="/admin/configuracion" element={<ConfiguracionPage />} />
                  <Route path="/admin/sitio-web" element={<SitioWebPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </ConfiguracionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
