import { useState } from "react";
import Spinner from "../components/ui/Spinner";
import ConfirmModal from "../components/ui/ConfirmModal";
import Select from "../components/ui/Select";
import NumberInput from "../components/ui/NumberInput";
import { useData } from "../hooks/useData";
import { toast } from "sonner";
import { Scale, Plus, Edit2, Trash2, X, Save, User } from "lucide-react";
import "./Patients.css";

export default function Weights() {
  const { data: weights = [], isLoading: weightsLoading } = useData("weights");
  const { data: patients = [] } = useData("patients");
  const { mutate, isMutating } = useData("weights");

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    patient_id: "",
    weight_kg: "",
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

  const openEdit = (w) => {
    setFormData({
      id: w.id,
      patient_id: w.patient_id,
      weight_kg: w.weight_kg,
      notes: w.notes || "",
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setFormData({ id: "", patient_id: "", weight_kg: "", notes: "" });
  };

  return (
    <div className="patients-container page-wrapper">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <Scale size={28} /> Control de Peso
          </h2>
          <p className="page-description">
            Seguimiento histórico de pesajes por paciente.
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Registrar Peso
          </button>
        </div>
      </div>

      <div className="table-wrapper glass-panel">
        {weightsLoading ? (
          <Spinner />
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Peso (kg)</th>
                <th>Fecha</th>
                <th>Notas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {weights.length === 0 ? (
                <tr>
                  <td colSpan="5">No hay registros de peso</td>
                </tr>
              ) : (
                weights.map((w) => (
                  <tr key={w.id}>
                    <td className="table-cell-primary">{w.patient_name}</td>
                    <td className="table-cell-amount">{w.weight_kg} kg</td>
                    <td>{new Date(w.date).toLocaleDateString()}</td>
                    <td className="table-cell-secondary">{w.notes || "-"}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="action-btn"
                          onClick={() => openEdit(w)}
                          title="Editar"
                          aria-label="Editar registro"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-btn action-delete"
                          onClick={() =>
                            setConfirmDelete({ isOpen: true, id: w.id })
                          }
                          title="Eliminar"
                          aria-label="Eliminar registro"
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
        <div
          className={`modal-overlay flex-center active`}
          role="button"
          tabIndex={0}
          aria-label="Cerrar modal de pesos"
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
              {isEditing ? "Editar Registro" : "Nuevo Registro de Peso"}
            </h3>
            <form onSubmit={handleSubmit}>
              {!isEditing && (
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
              )}

              <NumberInput
                label="Peso Actual"
                icon={Scale}
                required
                step="0.01"
                suffix="kg"
                value={formData.weight_kg}
                onChange={(e) =>
                  setFormData({ ...formData, weight_kg: e.target.value })
                }
              />

              <div className="input-group">
                <label htmlFor="weight-notes">Notas / Observaciones</label>
                <textarea
                  id="weight-notes"
                  className="input-field"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

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
                      ? "Actualizar"
                      : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="¿Eliminar pesaje?"
        message="Esta acción no se puede deshacer y afectará las estadísticas de evolución del paciente."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </div>
  );
}
