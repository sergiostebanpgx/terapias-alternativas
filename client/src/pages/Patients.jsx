import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../AuthContext";
import Spinner from "../components/ui/Spinner";
import ConfirmModal from "../components/ui/ConfirmModal";
import Input from "../components/ui/Input";
import { useData } from "../hooks/useData";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  Download,
  Plus,
  FileSpreadsheet,
  Edit2,
  Trash2,
  X,
  Save,
  Users,
  User,
  Mail,
  Phone,
  BadgeCheck,
} from "lucide-react";
import "./Patients.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export default function Patients() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { data: patients = [], isLoading } = useData("patients");
  const { mutate, isMutating } = useData("patients");
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    document_number: "",
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
      toast.error(
        "No se pudo guardar el paciente. Verifica que el documento no esté duplicado.",
      );
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

  const openEdit = (patient) => {
    setFormData({
      id: patient.id,
      name: patient.name,
      email: patient.email || "",
      phone: patient.phone || "",
      document_number: patient.document_number || "",
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setFormData({
      id: "",
      name: "",
      email: "",
      phone: "",
      document_number: "",
    });
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        Nombre: "Juan Perez",
        Documento: "1032456789",
        Telefono: "3001234567",
        Email: "juan@ejemplo.com",
      },
      {
        Nombre: "Maria Lopez",
        Documento: "52245781",
        Telefono: "3109876543",
        Email: "",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "Plantilla_Pacientes.xlsx");
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const formatted = data
        .map((item) => ({
          name: item.Nombre || item.name || item.Name,
          document_number: String(
            item.Documento || item.document_number || item.Document || "",
          ),
          phone: String(item.Telefono || item.phone || item.Phone || ""),
          email: item.Email || item.email || item.Correo || "",
        }))
        .filter((p) => p.name && p.phone && p.document_number);

      try {
        const res = await fetch(`${API_BASE}/import_patients.php`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ patients: formatted }),
        });
        const result = await res.json();
        toast.success(
          `Importación: ${result.details.inserted} creados, ${result.details.updated} actualizados.`,
        );
        setShowImportModal(false);
        queryClient.invalidateQueries({ queryKey: ["patients"] });
      } catch (err) {
        console.error(err);
        toast.error("No se pudo importar el archivo");
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="patients-container page-wrapper">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <Users size={28} /> Gestión de Pacientes
          </h2>
          <p className="page-description">
            Administra de forma segura tu base de datos de pacientes.
          </p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn-primary btn-secondary"
            onClick={() => setShowImportModal(true)}
          >
            <FileSpreadsheet size={18} /> Importar
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Nuevo Paciente
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
                <th>Documento</th>
                <th>Contacto</th>
                <th>Fecha Ingreso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan="5">No hay pacientes registrados</td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="table-cell-primary">{p.name}</div>
                      <div className="table-cell-secondary">
                        {p.email || "Sin correo"}
                      </div>
                    </td>
                    <td>{p.document_number || "-"}</td>
                    <td>{p.phone || "-"}</td>
                    <td>{new Date(p.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="action-btn"
                          onClick={() => openEdit(p)}
                          title="Editar"
                          aria-label="Editar paciente"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-btn action-delete"
                          onClick={() =>
                            setConfirmDelete({ isOpen: true, id: p.id })
                          }
                          title="Eliminar"
                          aria-label="Eliminar paciente"
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

      {/* Modal Creación/Edición */}
      {showModal && (
        <div className="modal-overlay flex-center active">
          <div className="modal-content glass-panel scaleIn">
            <h3 className="page-title">
              {isEditing ? (
                <Edit2 size={24} color="var(--secondary)" />
              ) : (
                <Plus size={24} color="var(--primary)" />
              )}
              {isEditing ? "Editar Paciente" : "Registrar Paciente"}
            </h3>
            <form onSubmit={handleSubmit}>
              <Input
                label="Nombre Completo"
                icon={User}
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <Input
                label="Documento"
                icon={BadgeCheck}
                required
                value={formData.document_number}
                onChange={(e) =>
                  setFormData({ ...formData, document_number: e.target.value })
                }
                placeholder="Ej: 1032456789"
              />
              <Input
                label="Email (Opcional)"
                icon={Mail}
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <Input
                label="Teléfono (WhatsApp)"
                icon={Phone}
                required
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

      {/* Modal Importar */}
      {showImportModal && (
        <div className="modal-overlay flex-center active">
          <div className="modal-content glass-panel scaleIn">
            <h3 className="page-title">
              <FileSpreadsheet size={24} color="var(--primary)" /> Importar
              (.xlsx)
            </h3>
            <p className="page-description">
              Sube tu archivo con columnas: <b>Nombre</b>, <b>Documento</b> y{" "}
              <b>Telefono</b>.
            </p>

            <div className="modal-form-actions modal-form-actions--center modal-form-actions--full">
              <button
                className="btn-primary btn-template-download"
                onClick={downloadTemplate}
              >
                <Download size={18} /> Descargar Plantilla Oficial
              </button>
            </div>

            <div className="upload-zone">
              <input type="file" accept=".xlsx, .xls" onChange={handleImport} />
              <div className="upload-zone-content">
                <Plus size={32} color="var(--primary)" />
                <p>Haz clic o arrastra tu archivo aquí</p>
              </div>
            </div>

            <div className="modal-form-actions modal-form-actions--full">
              <button
                className="btn-primary btn-secondary"
                onClick={() => setShowImportModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="¿Eliminar paciente?"
        message="Esta acción borrará permanentemente al paciente y todo su historial de pesajes y citas."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </div>
  );
}
