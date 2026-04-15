import { useAuth } from "../AuthContext";
import Spinner from "../components/ui/Spinner";
import { useDashboard } from "../hooks/useData";
import {
  Wallet,
  Calendar,
  Users,
  AlertTriangle,
  Clock3,
  Activity,
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

  return (
    <div className="dashboard-wrapper">
      <section className="dashboard-hero">
        <div className="dashboard-greeting">
          <h1>Hola, {user?.name?.split(" ")[0] || "Equipo"}</h1>
          <p>Resumen diario de operación clínica.</p>
        </div>

        <div className="dashboard-time">
          <Clock3 size={16} />
          <span>
            {new Date().toLocaleDateString("es-CO", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
        </div>
      </section>

      <section className="stats-grid">
        <article className="glass-panel stat-card">
          <div className="stat-label">
            <Wallet size={16} />
            Ingresos Hoy
          </div>
          <div className="stat-value value-secondary">
            {toCurrency(dailyRevenue)}
          </div>
          <div className="stat-sub">Total recaudado en caja</div>
        </article>

        <article className="glass-panel stat-card">
          <div className="stat-label">
            <Calendar size={16} />
            Citas para Hoy
          </div>
          <div className="stat-value value-primary">{dailyAppointments}</div>
          <div className="stat-sub">Agenda del día</div>
        </article>

        <article className="glass-panel stat-card">
          <div className="stat-label">
            <Users size={16} />
            Pacientes Nuevos
          </div>
          <div className="stat-value">{newPatients}</div>
          <div className="stat-sub">Registros creados hoy</div>
        </article>

        <article className="glass-panel stat-card">
          <div className="stat-label split-label">
            <span>Stock Bajo</span>
            <AlertTriangle
              size={16}
              className={lowStockItems > 0 ? "danger-icon" : "ok-icon"}
            />
          </div>
          <div
            className={`stat-value ${lowStockItems > 0 ? "value-danger" : "value-ok"}`}
          >
            {lowStockItems}
          </div>
          <div className="stat-sub">Productos por reponer</div>
        </article>
      </section>

      <section className="dashboard-bottom">
        <article className="glass-panel panel-card minimal-feed">
          <div className="panel-header">
            <h3>Movimientos Recientes</h3>
            <span className="panel-badge badge-muted">
              <Activity size={12} />
              Caja
            </span>
          </div>

          {!stats.recentPayments || stats.recentPayments.length === 0 ? (
            <p className="empty-state">
              No hay ingresos registrados el día de hoy.
            </p>
          ) : (
            <div>
              {stats.recentPayments.map((payment) => {
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
                    key={`${payment.transaction_date}-${name}-${payment.amount}`}
                    className="activity-item"
                  >
                    <div className="activity-avatar" aria-hidden="true">
                      {initials || "PA"}
                    </div>
                    <div className="activity-info">
                      <p className="activity-name">{name}</p>
                      <p className="activity-time">
                        {new Date(payment.transaction_date).toLocaleTimeString(
                          "es-CO",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                    <p className="activity-amount">
                      + {toCurrency(payment.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
