import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  CalendarClock,
  Stethoscope,
  ArrowLeft,
} from "lucide-react";
import "./PublicBooking.css";

export default function PublicBookSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const hasBooking = Boolean(state.appointmentId && state.appointmentDate);

  if (!hasBooking) {
    navigate("/agendar", { replace: true });
    return null;
  }

  return (
    <main className="public-booking-page">
      <section className="public-booking-shell public-booking-success-shell">
        <article className="public-booking-success-card">
          <CheckCircle2 size={42} />
          <h1>Cita creada exitosamente</h1>
          <p>
            Tu reserva quedo registrada en el sistema. Conserva estos datos para
            futuras consultas.
          </p>

          <div className="public-booking-success-data">
            <p>
              <strong>ID de cita:</strong> #{state.appointmentId}
            </p>
            <p>
              <CalendarClock size={16} />
              <span>{new Date(state.appointmentDate).toLocaleString()}</span>
            </p>
            {state.doctorName && (
              <p>
                <Stethoscope size={16} />
                <span>{state.doctorName}</span>
              </p>
            )}
          </div>

          <div className="public-booking-success-actions">
            <Link className="public-booking-submit" to="/agendar">
              Crear otra cita
            </Link>
            <Link className="public-booking-link-secondary" to="/login">
              <ArrowLeft size={14} /> Ir al login
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
