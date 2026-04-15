import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, Mail, Phone, User, UserRoundPlus } from "lucide-react";
import Input from "../components/ui/Input";
import "./PublicBooking.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export default function PublicPatientRegister() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    document_number: "",
    phone: "",
    email: "",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (!formData.name.trim()) {
      setError("Debes ingresar el nombre completo");
      return;
    }
    if (!formData.document_number.trim()) {
      setError("Debes ingresar la identificacion");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Debes ingresar el telefono de WhatsApp");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/patients_public.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          document_number: formData.document_number.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok || result.status !== "success") {
        throw new Error(
          result.message || "No fue posible completar el registro",
        );
      }

      navigate("/registrarse/exito", {
        replace: true,
        state: {
          name: formData.name.trim(),
          documentNumber:
            result.document_number || formData.document_number.trim(),
          alreadyExists: Boolean(result.already_exists),
        },
      });
    } catch (err) {
      setError(err.message || "No fue posible completar el registro");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="public-booking-page">
      <section className="public-booking-shell">
        <header className="public-booking-header">
          <p className="public-booking-kicker">Registro publico</p>
          <h1>
            <UserRoundPlus size={26} /> Registrate para tu atencion
          </h1>
          <p>
            Completa tus datos y luego podras agendar tu cita sin depender de
            que el administrador te cree manualmente.
          </p>
        </header>

        <div className="public-booking-grid">
          <article className="public-booking-benefits">
            <h2>
              <BadgeCheck size={18} /> Informacion requerida
            </h2>
            <ul>
              <li>Nombre completo.</li>
              <li>Identificacion.</li>
              <li>Telefono WhatsApp.</li>
              <li>Correo electronico (opcional).</li>
            </ul>
          </article>

          <article className="public-booking-card">
            <h2>
              <UserRoundPlus size={18} /> Formulario de registro
            </h2>

            <form onSubmit={handleSubmit}>
              <Input
                label="Nombre completo"
                icon={User}
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Maria Fernanda Lopez"
              />

              <Input
                label="Identificacion"
                icon={BadgeCheck}
                required
                value={formData.document_number}
                onChange={(e) =>
                  setFormData({ ...formData, document_number: e.target.value })
                }
                placeholder="Ej: 1023456789"
              />

              <Input
                label="Telefono WhatsApp"
                icon={Phone}
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Ej: 3001234567"
              />

              <Input
                label="Correo (opcional)"
                icon={Mail}
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Ej: correo@dominio.com"
              />

              {error && <div className="public-booking-error">{error}</div>}

              <button
                type="submit"
                className="public-booking-submit"
                disabled={submitting}
              >
                {submitting ? "Registrando..." : "Completar registro"}
              </button>
            </form>
          </article>
        </div>

        <footer className="public-booking-footer">
          <Link to="/agendar">Ya tengo registro, ir a agendar</Link>
        </footer>
      </section>
    </main>
  );
}
