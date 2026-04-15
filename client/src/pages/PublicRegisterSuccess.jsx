import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  UserRoundPlus,
} from "lucide-react";
import "./PublicBooking.css";

export default function PublicRegisterSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  if (!state.documentNumber) {
    navigate("/registrarse", { replace: true });
    return null;
  }

  return (
    <main className="public-booking-page">
      <section className="public-booking-shell public-booking-success-shell">
        <article className="public-booking-success-card">
          <CheckCircle2 size={42} />
          <h1>Registro completado</h1>
          <p>
            {state.alreadyExists
              ? "Tu identificacion ya existia en el sistema y puedes continuar a agendar."
              : "Tus datos quedaron guardados y ya puedes continuar con tu agendamiento."}
          </p>

          <div className="public-booking-success-data">
            <p>
              <UserRoundPlus size={16} />
              <span>{state.name || "Paciente"}</span>
            </p>
            <p>
              <BadgeCheck size={16} />
              <span>Documento: {state.documentNumber}</span>
            </p>
          </div>

          <div className="public-booking-success-actions">
            <Link
              className="public-booking-submit"
              to={`/agendar?document=${encodeURIComponent(state.documentNumber)}`}
            >
              Ir a agendar cita
            </Link>
            <Link className="public-booking-link-secondary" to="/registrarse">
              <ArrowLeft size={14} /> Volver a registro
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
