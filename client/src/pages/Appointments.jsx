import { useState } from "react";
import Spinner from "../components/ui/Spinner";
import ConfirmModal from "../components/ui/ConfirmModal";
import Select from "../components/ui/Select";
import DateTimePicker from "../components/ui/DateTimePicker";
import Input from "../components/ui/Input";
import { useData } from "../hooks/useData";
import { toast } from "sonner";
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Info,
} from "lucide-react";
import "./Patients.css";
import "./Payments.css";

export default function Appointments() {
  const { data: appointments = [], isLoading: appointmentsLoading } =
    useData("appointments");
  const { data: patients = [] } = useData("patients");
  const { data: doctors = [] } = useData("doctors");
  const { mutate, isMutating } = useData("appointments");

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    patient_id: "",
    doctor_id: "",
    appointment_date: "",
    status: "scheduled",
    notes: "",
  });

  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    id: null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isMutating) return;

    const method = isEditing ? "PUT" : "POST";
    try {
      await mutate({ method, body: formData });
      closeModal();
    } catch {
      toast.error("Error al guardar");
    }
  };

  const executeDelete = async () => {
    if (isMutating) return;

    const id = confirmDelete.id;
    try {
      await mutate({ method: "DELETE", id });
      setConfirmDelete({ isOpen: false, id: null });
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const openEdit = (a) => {
    let dateStr = a.appointment_date;

    if (dateStr) {
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const localDate = new Date(
            date.getTime() - date.getTimezoneOffset() * 60000,
          );
          dateStr = localDate.toISOString().slice(0, 16);
        }
      } catch (e) {
        console.error("Error parsing date:", e);
        dateStr = "";
      }
    }

    setFormData({
      id: a.id,
      patient_id: a.patient_id,
      doctor_id: a.doctor_id || "",
      appointment_date: dateStr,
      status: a.status,
      notes: a.notes || "",
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setFormData({
      id: "",
      patient_id: "",
      doctor_id: "",
      appointment_date: "",
      status: "scheduled",
      notes: "",
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      scheduled: {
        class: "status-badge--scheduled",
        icon: <Clock size={12} />,
      },
      completed: {
        class: "status-badge--completed",
        icon: <CheckCircle size={12} />,
      },
      cancelled: {
        class: "status-badge--cancelled",
        icon: <AlertTriangle size={12} />,
      },
    };
    const { class: className, icon } = statusMap[status] || statusMap.scheduled;
    return (
      <span className={`status-badge ${className}`}>
        {icon} {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="patients-container page-wrapper">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <Calendar size={28} /> Calendario de Citas
          </h2>
          <p className="page-description">
            Gestión de sesiones y disponibilidad.
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Nueva Cita
          </button>
        </div>
      </div>

      <div className="table-wrapper glass-panel">
        {appointmentsLoading ? (
          <Spinner />
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Paciente</th>
                <th>Doctora</th>
                <th>Estado</th>
                <th>Notas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan="6">No hay citas programadas</td>
                </tr>
              ) : (
                appointments.map((a) => {
                  let dateStr = "Sin fecha";

                  if (a.appointment_date) {
                    try {
                      const dateObj = new Date(a.appointment_date);
                      if (!isNaN(dateObj.getTime())) {
                        dateStr =
                          dateObj.toLocaleDateString("es-CO") +
                          " " +
                          dateObj.toLocaleTimeString("es-CO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                      }
                    } catch (e) {
                      console.error(
                        "Error parsing date:",
                        a.appointment_date,
                        e,
                      );
                    }
                  }

                  return (
                    <tr key={a.id}>
                      <td className="date-cell">
                        <span className="date-value">{dateStr}</span>
                      </td>
                      <td className="table-cell-primary">{a.patient_name}</td>
                      <td>{a.doctor_name || "Sin asignar"}</td>
                      <td>{getStatusBadge(a.status)}</td>
                      <td className="table-cell-secondary">{a.notes || "-"}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="action-btn"
                            onClick={() => openEdit(a)}
                            title="Editar"
                            aria-label="Editar cita"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="action-btn action-delete"
                            onClick={() =>
                              setConfirmDelete({ isOpen: true, id: a.id })
                            }
                            title="Eliminar"
                            aria-label="Eliminar cita"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div
          className={`modal-overlay flex-center active`}
          role="button"
          tabIndex={0}
          aria-label="Cerrar modal de citas"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter") closeModal();
          }}
        >
          <div className="modal-content glass-panel scaleIn">
            <h3 className="page-title">
              {isEditing ? (
                <Edit2 size={24} color="var(--secondary)" />
              ) : (
                <Plus size={24} color="var(--primary)" />
              )}
              {isEditing ? "Editar Cita" : "Programar Nueva Cita"}
            </h3>
            <form onSubmit={handleSubmit}>
              <Select
                label="Paciente"
                icon={User}
                required
                value={formData.patient_id}
                onChange={(e) =>
                  setFormData({ ...formData, patient_id: e.target.value })
                }
                options={[
                  { value: "", label: "Seleccione un paciente..." },
                  ...patients.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />

              <Select
                label="Doctora"
                icon={User}
                value={formData.doctor_id}
                onChange={(e) =>
                  setFormData({ ...formData, doctor_id: e.target.value })
                }
                options={[
                  { value: "", label: "Sin asignar" },
                  ...doctors.map((d) => ({ value: d.id, label: d.name })),
                ]}
              />

              <DateTimePicker
                label="Fecha y Hora"
                required
                value={formData.appointment_date}
                onChange={(val) =>
                  setFormData({ ...formData, appointment_date: val })
                }
              />

              <Select
                label="Estado de la Cita"
                icon={CheckCircle}
                required
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                options={[
                  { value: "scheduled", label: "Programada" },
                  { value: "completed", label: "Completada" },
                  { value: "cancelled", label: "Cancelada" },
                ]}
              />

              <Input
                label="Notas / Motivo"
                icon={Info}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Ej: Traer exámenes"
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
                      ? "Actualizar Cita"
                      : "Agendar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="¿Cancelar cita?"
        message="Esta acción liberará el espacio en el calendario. ¿Deseas borrar el registro definitivamente?"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </div>
  );
}
