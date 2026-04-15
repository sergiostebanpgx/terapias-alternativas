import { useAuth } from "../AuthContext";
import Spinner from "../components/ui/Spinner";
import { useDashboard } from "../hooks/useData";
import {
  Wallet,
  Calendar,
  Users,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Package,
} from "lucide-react";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboard();

  if (isLoading) return <Spinner />;
  if (!stats) return null;

  const dailyRevenue = Number(stats.dailyRevenue || 0);
  const dailyAppointments = Number(stats.dailyAppointments || 0);
  const newPatients = Number(stats.newPatients || 0);
  const lowStockItems = Number(stats.lowStockItems || 0);

  const toCurrency = (amount) =>
    `$${Number(amount || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

  const currentDate = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="greeting">
            Hola, {user?.name?.split(" ")[0] || "Equipo"}
          </h1>
          <p className="subtitle">
            Resumen de operaciones del dia
          </p>
        </div>
        <div className="header-date">
          <Calendar size={16} />
          <span>{currentDate}</span>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-header">
            <div className="stat-icon icon-success">
              <Wallet size={20} />
            </div>
            <span className="stat-trend positive">
              <TrendingUp size={14} />
              Hoy
            </span>
          </div>
          <div className="stat-body">
            <span className="stat-value success">{toCurrency(dailyRevenue)}</span>
            <span className="stat-label">Ingresos del Dia</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-header">
            <div className="stat-icon icon-primary">
              <Calendar size={20} />
            </div>
            <span className="stat-trend neutral">Programadas</span>
          </div>
          <div className="stat-body">
            <span className="stat-value primary">{dailyAppointments}</span>
            <span className="stat-label">Citas para Hoy</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-header">
            <div className="stat-icon icon-info">
              <Users size={20} />
            </div>
            <span className="stat-trend neutral">Nuevos</span>
          </div>
          <div className="stat-body">
            <span className="stat-value">{newPatients}</span>
            <span className="stat-label">Pacientes Registrados</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-header">
            <div className={`stat-icon ${lowStockItems > 0 ? "icon-danger" : "icon-success"}`}>
              <Package size={20} />
            </div>
            {lowStockItems > 0 && (
              <span className="stat-trend negative">
                <AlertTriangle size={14} />
                Alerta
              </span>
            )}
          </div>
          <div className="stat-body">
            <span className={`stat-value ${lowStockItems > 0 ? "danger" : "success"}`}>
              {lowStockItems}
            </span>
            <span className="stat-label">Productos Stock Bajo</span>
          </div>
        </article>
      </section>

      {/* Recent Activity */}
      <section className="activity-section">
        <div className="section-header">
          <h2>Movimientos Recientes</h2>
          <span className="section-badge">Ingresos de hoy</span>
        </div>

        <div className="activity-card">
          {!stats.recentPayments || stats.recentPayments.length === 0 ? (
            <div className="empty-activity">
              <Wallet size={32} />
              <p>No hay ingresos registrados hoy</p>
            </div>
          ) : (
            <div className="activity-list">
              {stats.recentPayments.map((payment, index) => {
                const name = payment.patient_name || "Paciente";
                const initials = name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase();

                return (
                  <div
                    key={`${payment.transaction_date}-${name}-${index}`}
                    className="activity-item"
                  >
                    <div className="activity-avatar">
                      {initials || "PA"}
                    </div>
                    <div className="activity-details">
                      <span className="activity-name">{name}</span>
                      <span className="activity-time">
                        {new Date(payment.transaction_date).toLocaleTimeString(
                          "es-CO",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>
                    </div>
                    <div className="activity-amount">
                      <span className="amount-value">+{toCurrency(payment.amount)}</span>
                      <ArrowUpRight size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
