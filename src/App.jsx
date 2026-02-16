import { Routes, Route } from 'react-router-dom';
import Home from './pages/public/Home';
import Login from './pages/auth/Login';
import Dashboard from './pages/admin/Dashboard';
import Booking from './pages/public/Booking';
import PatientDetails from './pages/admin/PatientDetails';
import ServicesPanel from './pages/admin/ServicesPanel';
import Settings from './pages/admin/Settings';
import StatsDashboard from './pages/admin/StatsDashboard';
import SuperAdmin from './pages/sysadmin/SuperAdmin'; // <--- 1. IMPORTANTE: Importar el archivo

function App() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/agendar" element={<Booking />} />
      <Route path="/login" element={<Login />} />

      {/* Rutas Privadas (Admin) */}
      <Route path="/admin" element={<Dashboard />} />
      <Route path="/admin/pacientes/:id" element={<PatientDetails />} />
      <Route path="/admin/servicios" element={<ServicesPanel />} />
      <Route path="/admin/configuracion" element={<Settings />} />
      <Route path="/admin/estadisticas" element={<StatsDashboard />} />

      {/* Ruta Secreta de Super Admin */}
      <Route path="/sysadmin" element={<SuperAdmin />} /> {/* <--- 2. IMPORTANTE: La Puerta Secreta */}

      {/* Ruta 404 */}
      <Route path="*" element={<h1 className="text-center mt-10">404 - Página no encontrada</h1>} />
    </Routes>
  );
}

export default App;