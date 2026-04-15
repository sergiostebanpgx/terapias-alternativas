import { useState } from "react";
import Spinner from "../components/ui/Spinner";
import ConfirmModal from "../components/ui/ConfirmModal";
import Input from "../components/ui/Input";
import { useData } from "../hooks/useData";
import { useAuth } from "../AuthContext";
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Stethoscope,
  User,
  Phone,
  BriefcaseMedical,
  CalendarDays,
} from "lucide-react";
import "./Patients.css";
import "./Doctors.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const DAY_OPTIONS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miercoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sabado" },
];

const EMPTY_WEEK_SCHEDULE = DAY_OPTIONS.map((day) => ({
  day_of_week: day.value,
  is_active: false,
  start_time: "08:00",
  end_time: "17:00",
}));

export default function Doctors() {
  const { token } = useAuth();
  const { data: doctors = [], isLoading } = useData("doctors");
  const { mutate, isMutating } = useData("doctors");

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    specialty: "",
    phone: "",
  });
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    id: null,
  });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDoctor, setScheduleDoctor] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleRows, setScheduleRows] = useState(EMPTY_WEEK_SCHEDULE);

  const parseApiJson = async (response, fallbackMessage) => {
    const rawText = await response.text();
    try {
      const parsed = JSON.parse(rawText);
      return parsed;
    } catch {
      const detail = response.status ? ` (HTTP ${response.status})` : "";
      throw new Error(`${fallbackMessage}${detail}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isMutating) return;

    try {
      await mutate({ method: isEditing ? "PUT" : "POST", body: formData });
      closeModal();
    } catch {
      toast.error("No se pudo guardar la doctora");
    }
  };

  const executeDelete = async () => {
    if (isMutating) return;

    try {
      await mutate({ method: "DELETE", id: confirmDelete.id });
      setConfirmDelete({ isOpen: false, id: null });
    } catch {
      toast.error("No se pudo eliminar la doctora");
    }
  };

  const openEdit = (doctor) => {
    setFormData({
      id: doctor.id,
      name: doctor.name,
      specialty: doctor.specialty || "",
      phone: doctor.phone || "",
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setFormData({ id: "", name: "", specialty: "", phone: "" });
  };

  const openSchedule = async (doctor) => {
    if (!token) return;

    setShowScheduleModal(true);
    setScheduleDoctor(doctor);
    setScheduleRows(EMPTY_WEEK_SCHEDULE);
    setScheduleError("");
    setScheduleLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/doctor_schedules.php?doctor_id=${doctor.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await parseApiJson(
        response,
        "No fue posible cargar la agenda. Verifica el servidor",
      );
      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "No fue posible cargar la agenda");
      }

      const rows = Array.isArray(result.data)
        ? result.data
        : EMPTY_WEEK_SCHEDULE;
      setScheduleRows(
        DAY_OPTIONS.map((day) => {
          const match = rows.find(
            (row) => Number(row.day_of_week) === day.value,
          );
          return {
            day_of_week: day.value,
            is_active: Boolean(match?.is_active),
            start_time: match?.start_time || "08:00",
            end_time: match?.end_time || "17:00",
          };
        }),
      );
    } catch (err) {
      setScheduleError(err.message || "No fue posible cargar la agenda");
    } finally {
      setScheduleLoading(false);
    }
  };

  const closeScheduleModal = () => {
    setShowScheduleModal(false);
    setScheduleDoctor(null);
    setScheduleError("");
    setScheduleRows(EMPTY_WEEK_SCHEDULE);
  };

  const updateScheduleRow = (day, patch) => {
    setScheduleRows((prev) =>
      prev.map((row) => (row.day_of_week === day ? { ...row, ...patch } : row)),
    );
  };

  const saveSchedule = async () => {
    if (!scheduleDoctor || !token || scheduleSaving) return;

    setScheduleSaving(true);
    setScheduleError("");

    try {
      const response = await fetch(`${API_BASE}/doctor_schedules.php`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctor_id: scheduleDoctor.id,
          schedules: scheduleRows,
        }),
      });

      const result = await parseApiJson(
        response,
        "No fue posible guardar la agenda. Verifica el servidor",
      );
      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "No fue posible guardar la agenda");
      }

      closeScheduleModal();
    } catch (err) {
      setScheduleError(err.message || "No fue posible guardar la agenda");
    } finally {
      setScheduleSaving(false);
    }
  };

  return (
    <div className="patients-container page-wrapper">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <Stethoscope size={28} /> Doctoras
          </h2>
          <p className="page-description">
            Registro de profesionales para asignación de citas.
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Nueva Doctora
          </button>
        </div>
      </div>

      <div className="table-wrapper glass-panel">
        {isLoading ? (
          <Spinner />
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Especialidad</th>
                <th>Teléfono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan="4">No hay doctoras registradas</td>
                </tr>
              ) : (
                doctors.map((doctor) => (
                  <tr key={doctor.id}>
                    <td className="table-cell-primary">{doctor.name}</td>
                    <td>{doctor.specialty || "General"}</td>
                    <td>{doctor.phone || "-"}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="action-btn"
                          onClick={() => openSchedule(doctor)}
                          title="Agenda"
                          aria-label="Configurar agenda"
                        >
                          <CalendarDays size={16} />
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => openEdit(doctor)}
                          title="Editar"
                          aria-label="Editar doctora"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-btn action-delete"
                          onClick={() =>
                            setConfirmDelete({ isOpen: true, id: doctor.id })
                          }
                          title="Eliminar"
                          aria-label="Eliminar doctora"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay flex-center active">
          <div className="modal-content glass-panel scaleIn">
            <h3 className="page-title">
              {isEditing ? (
                <Edit2 size={24} color="var(--secondary)" />
              ) : (
                <Plus size={24} color="var(--primary)" />
              )}
              {isEditing ? "Editar Doctora" : "Nueva Doctora"}
            </h3>

            <form onSubmit={handleSubmit}>
              <Input
                label="Nombre"
                icon={User}
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <Input
                label="Especialidad"
                icon={BriefcaseMedical}
                value={formData.specialty}
                onChange={(e) =>
                  setFormData({ ...formData, specialty: e.target.value })
                }
                placeholder="Ej: Nutrición clínica"
              />
              <Input
                label="Teléfono"
                icon={Phone}
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />

              <div className="modal-form-actions">
                <button
                  type="button"
                  className="btn-primary btn-secondary"
                  onClick={closeModal}
                  disabled={isMutating}
                >
                  <X size={18} /> Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isMutating}
                >
                  <Save size={18} />{" "}
                  {isMutating
                    ? "Guardando..."
                    : isEditing
                      ? "Guardar Cambios"
                      : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div
          className="modal-overlay flex-center active"
          role="button"
          tabIndex={0}
          aria-label="Cerrar agenda semanal"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeScheduleModal();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter") {
              closeScheduleModal();
            }
          }}
        >
          <div className="modal-content glass-panel scaleIn doctor-schedule-modal">
            <h3 className="doctor-schedule-title">
              <CalendarDays size={24} color="var(--primary)" />
              Agenda semanal: {scheduleDoctor?.name}
            </h3>

            <p className="doctor-schedule-subtitle">
              Duracion por cita: 20 minutos
            </p>

            {scheduleLoading ? (
              <Spinner />
            ) : (
              <div className="doctor-schedule-grid">
                <div className="doctor-schedule-head" aria-hidden="true">
                  <span>Dia</span>
                  <span>Activo</span>
                  <span>Inicio</span>
                  <span>Fin</span>
                </div>

                {DAY_OPTIONS.map((day) => {
                  const row =
                    scheduleRows.find(
                      (item) => item.day_of_week === day.value,
                    ) || EMPTY_WEEK_SCHEDULE[day.value];

                  return (
                    <div key={day.value} className="doctor-schedule-row">
                      <strong className="doctor-schedule-day">
                        {day.label}
                      </strong>

                      <label className="doctor-schedule-toggle">
                        <input
                          type="checkbox"
                          checked={row.is_active}
                          onChange={(e) =>
                            updateScheduleRow(day.value, {
                              is_active: e.target.checked,
                            })
                          }
                        />
                        Activo
                      </label>

                      <label className="doctor-schedule-time-group">
                        <span className="doctor-schedule-mobile-label">
                          Inicio
                        </span>
                        <input
                          className="doctor-schedule-time-input"
                          type="time"
                          aria-label={`Hora inicio ${day.label}`}
                          value={row.start_time || "08:00"}
                          disabled={!row.is_active}
                          onChange={(e) =>
                            updateScheduleRow(day.value, {
                              start_time: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label className="doctor-schedule-time-group">
                        <span className="doctor-schedule-mobile-label">
                          Fin
                        </span>
                        <input
                          className="doctor-schedule-time-input"
                          type="time"
                          aria-label={`Hora fin ${day.label}`}
                          value={row.end_time || "17:00"}
                          disabled={!row.is_active}
                          onChange={(e) =>
                            updateScheduleRow(day.value, {
                              end_time: e.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                  );
                })}

                {scheduleError && (
                  <div className="doctor-schedule-error">{scheduleError}</div>
                )}

                <div className="doctor-schedule-actions">
                  <button
                    type="button"
                    className="btn-primary btn-secondary"
                    onClick={closeScheduleModal}
                    disabled={scheduleSaving}
                  >
                    <X size={18} /> Cerrar
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={saveSchedule}
                    disabled={scheduleSaving}
                  >
                    <Save size={18} />{" "}
                    {scheduleSaving ? "Guardando..." : "Guardar agenda"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="¿Eliminar doctora?"
        message="Esta acción quitará la doctora del listado de asignación de citas."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </div>
  );
}
