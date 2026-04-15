import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { useResponsiveTables } from "./components/hooks/useResponsiveTables";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Weights from "./pages/Weights";
import Inventory from "./pages/Inventory";
import Payments from "./pages/Payments";
import Appointments from "./pages/Appointments";
import Doctors from "./pages/Doctors";
import Receivables from "./pages/Receivables";
import PublicBookAppointment from "./pages/PublicBookAppointment";
import PublicBookSuccess from "./pages/PublicBookSuccess";
import PublicPatientRegister from "./pages/PublicPatientRegister";
import PublicRegisterSuccess from "./pages/PublicRegisterSuccess";
import Layout from "./components/layout/Layout";
import { Toaster } from "./components/ui/sonner";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading)
    return (
      <div className="flex-center" style={{ height: "100vh" }}>
        Cargando...
      </div>
    );
  if (!token) return <Navigate to="/login" replace />;

  return children;
};

// Public Route (if logged in, go to dashboard)
const PublicRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading)
    return (
      <div className="flex-center" style={{ height: "100vh" }}>
        Cargando...
      </div>
    );
  if (token) return <Navigate to="/dashboard" replace />;

  return children;
};

function AppRoutes() {
  useResponsiveTables();

  return (
    <Routes>
      <Route path="/agendar" element={<PublicBookAppointment />} />
      <Route path="/agendar/exito" element={<PublicBookSuccess />} />
      <Route path="/registrarse" element={<PublicPatientRegister />} />
      <Route path="/registrarse/exito" element={<PublicRegisterSuccess />} />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="weights" element={<Weights />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="doctors" element={<Doctors />} />
        <Route path="payments" element={<Payments />} />
        <Route path="receivables" element={<Receivables />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster />
      </Router>
    </AuthProvider>
  );
}
