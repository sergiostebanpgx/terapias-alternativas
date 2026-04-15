import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Select from "../components/ui/Select";
import Input from "../components/ui/Input";
import {
  CalendarCheck2,
  BadgeCheck,
  IdCard,
  Stethoscope,
  FileText,
  ShieldCheck,
} from "lucide-react";
import "./PublicBooking.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export default function PublicBookAppointment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const [formData, setFormData] = useState({
    document_number: "",
    doctor_id: "",
    appointment_date: "",
    notes: "",
  });

  const {
    data: slots = [],
    isLoading: loadingSlots,
    error: slotsError,
  } = useQuery({
    queryKey: ["public-slots", formData.doctor_id, selectedDate],
    enabled: Boolean(formData.doctor_id && selectedDate),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE}/appointments_public.php?doctor_id=${encodeURIComponent(formData.doctor_id)}&date=${encodeURIComponent(selectedDate)}`,
      );
      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "No fue posible consultar horarios");
      }

      return Array.isArray(data.data) ? data.data : [];
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryDocument = params.get("document");
    if (!queryDocument) return;

    setFormData((prev) => ({
      ...prev,
      document_number: prev.document_number || queryDocument,
    }));
  }, [location.search]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, appointment_date: "" }));
  }, [formData.doctor_id, selectedDate]);

  useEffect(() => {
    if (!formData.appointment_date) return;

    const stillAvailable = slots.some(
      (slot) => slot.value === formData.appointment_date,
    );

    if (!stillAvailable) {
      setFormData((prev) => ({ ...prev, appointment_date: "" }));
      setError(
        "El horario seleccionado ya fue tomado. Por favor elige otro disponible.",
      );
    }
  }, [slots, formData.appointment_date]);

  const {
    data: doctors = [],
    isLoading: loadingDoctors,
    error: doctorsError,
  } = useQuery({
    queryKey: ["public-doctors"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/doctors_public.php`);
      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "No fue posible cargar doctoras");
      }

      return data.data || [];
    },
  });

  const doctorOptions = useMemo(
    () => [
      { value: "", label: "Seleccione una doctora" },
      ...doctors.map((doctor) => ({
        value: doctor.id,
        label: doctor.specialty
          ? `${doctor.name} - ${doctor.specialty}`
          : doctor.name,
      })),
    ],
    [doctors],
  );

  const slotOptions = useMemo(
    () => [
      {
        value: "",
        label: loadingSlots ? "Cargando horarios..." : "Seleccione una hora",
      },
      ...slots.map((slot) => ({ value: slot.value, label: slot.label })),
    ],
    [loadingSlots, slots],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (!formData.document_number.trim()) {
      return setError("Debes ingresar tu numero de documento");
    }
    if (!formData.doctor_id) {
      return setError("Debes seleccionar una doctora");
    }
    if (!selectedDate) {
      return setError("Debes seleccionar una fecha");
    }
    if (!formData.appointment_date) {
      return setError("Debes seleccionar un horario disponible");
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/appointments_public.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_number: formData.document_number.trim(),
          doctor_id: Number(formData.doctor_id),
          appointment_date: formData.appointment_date,
          notes: formData.notes?.trim() || "",
        }),
      });

      const data = await response.json();
      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "No fue posible agendar la cita");
      }

      navigate("/agendar/exito", {
        replace: true,
        state: {
          appointmentId: data.id,
          appointmentDate: data.appointment_date || formData.appointment_date,
          doctorName: data.doctor_name,
        },
      });
    } catch (err) {
      setError(err.message || "No fue posible agendar la cita");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="public-booking-page">
      <section className="public-booking-shell">
        <header className="public-booking-header">
          <p className="public-booking-kicker">Agendamiento en linea</p>
          <h1>
            <CalendarCheck2 size={26} /> Agenda tu cita por documento
          </h1>
          <p>
            Reserva tu espacio en menos de un minuto. Solo necesitas el numero
            de documento registrado en el centro.
          </p>
        </header>

        <div className="public-booking-grid">
          <article className="public-booking-benefits">
            <h2>
              <ShieldCheck size={18} /> Lo que debes saber
            </h2>
            <ul>
              <li>
                Tu identificacion publica se hace unicamente por documento.
              </li>
              <li>
                La cita queda creada de inmediato al confirmar el formulario.
              </li>
              <li>Recuerda llegar 10 minutos antes de la hora asignada.</li>
            </ul>
          </article>

          <article className="public-booking-card">
            <h2>
              <BadgeCheck size={18} /> Formulario de agenda
            </h2>

            {loadingDoctors ? (
              <p className="public-booking-loading">
                Cargando disponibilidad...
              </p>
            ) : (
              <form onSubmit={handleSubmit}>
                <Input
                  label="Documento"
                  icon={IdCard}
                  required
                  value={formData.document_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      document_number: e.target.value,
                    })
                  }
                  placeholder="Ej: 1023456789"
                />

                <Select
                  label="Doctora"
                  icon={Stethoscope}
                  required
                  value={formData.doctor_id}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      doctor_id: e.target.value,
                      appointment_date: "",
                    });
                  }}
                  options={doctorOptions}
                />

                <Input
                  label="Fecha"
                  icon={CalendarCheck2}
                  type="date"
                  required
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />

                <Select
                  label="Horario disponible"
                  icon={CalendarCheck2}
                  required
                  value={formData.appointment_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      appointment_date: e.target.value,
                    })
                  }
                  disabled={
                    !formData.doctor_id || !selectedDate || loadingSlots
                  }
                  options={slotOptions}
                />

                {!loadingSlots && selectedDate && slots.length === 0 && (
                  <p className="public-booking-loading">
                    No hay horarios disponibles para esta fecha.
                  </p>
                )}

                <Input
                  label="Notas (opcional)"
                  icon={FileText}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Ej: Primera valoracion"
                />

                {(error || doctorsError?.message || slotsError?.message) && (
                  <div className="public-booking-error">
                    {error || doctorsError?.message || slotsError?.message}
                  </div>
                )}

                <button
                  type="submit"
                  className="public-booking-submit"
                  disabled={submitting}
                >
                  {submitting ? "Agendando..." : "Confirmar cita"}
                </button>
              </form>
            )}
          </article>
        </div>

        <footer className="public-booking-footer">
          <Link to="/registrarse">Registrarme como paciente</Link>
          <span style={{ display: "inline-block", width: "12px" }} />
          <Link to="/login">Ir al panel administrativo</Link>
        </footer>
      </section>
    </main>
  );
}
