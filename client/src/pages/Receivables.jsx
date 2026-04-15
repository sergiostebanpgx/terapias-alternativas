import { useMemo, useState } from "react";
import { useAuth } from "../AuthContext";
import { useData } from "../hooks/useData";
import Spinner from "../components/ui/Spinner";
import ConfirmModal from "../components/ui/ConfirmModal";
import Select from "../components/ui/Select";
import CurrencyInput from "../components/ui/CurrencyInput";
import Input from "../components/ui/Input";
import { toast } from "sonner";
import {
  HandCoins,
  Plus,
  Search,
  CircleDollarSign,
  Trash2,
  Save,
  X,
  FileText,
  User,
  Filter,
  Wallet,
} from "lucide-react";
import "./Patients.css";
import "./Receivables.css";

const statusOptions = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "partial", label: "Parcial" },
  { value: "paid", label: "Pagado" },
];

const debtTypeOptions = [
  { value: "control", label: "Control" },
  { value: "product", label: "Producto" },
];

const statusLabels = {
  pending: "Pendiente",
  partial: "Parcial",
  paid: "Pagado",
};

const isAdminRole = (role) => String(role || "").toLowerCase() === "admin";

export default function Receivables() {
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);

  const { data: debts = [], isLoading } = useData("debts");
  const { data: patients = [] } = useData("patients");
  const { mutate: mutateDebt, isMutating: mutatingDebt } = useData("debts");
  const { mutate: mutatePayment, isMutating: mutatingPayment } =
    useData("payments");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [patientFilter, setPatientFilter] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    id: null,
  });

  const [createData, setCreateData] = useState({
    patient_id: "",
    debt_type: "control",
    concept: "",
    total_amount: "",
  });

  const [abonoData, setAbonoData] = useState({
    amount: "",
    payment_method: "Efectivo",
    description: "",
  });

  const isMutating = mutatingDebt || mutatingPayment;

  const filteredDebts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return debts.filter((debt) => {
      const matchesStatus = statusFilter ? debt.status === statusFilter : true;
      const matchesPatient = patientFilter
        ? String(debt.patient_id) === String(patientFilter)
        : true;
      const matchesTerm =
        !term ||
        String(debt.patient_name || "")
          .toLowerCase()
          .includes(term) ||
        String(debt.concept || "")
          .toLowerCase()
          .includes(term);

      return matchesStatus && matchesPatient && matchesTerm;
    });
  }, [debts, patientFilter, search, statusFilter]);

  const totals = useMemo(() => {
    return filteredDebts.reduce(
      (acc, debt) => {
        const pending = Number(debt.pending_amount || 0);
        const total = Number(debt.total_amount || 0);
        acc.pending += pending;
        acc.total += total;
        if (debt.status === "pending") acc.pendingCount += 1;
        if (debt.status === "partial") acc.partialCount += 1;
        return acc;
      },
      { pending: 0, total: 0, pendingCount: 0, partialCount: 0 },
    );
  }, [filteredDebts]);

  const openAbono = (debt) => {
    setSelectedDebt(debt);
    setAbonoData({
      amount: "",
      payment_method: "Efectivo",
      description: `Abono deuda #${debt.id}: ${debt.concept}`,
    });
    setShowAbonoModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateData({
      patient_id: "",
      debt_type: "control",
      concept: "",
      total_amount: "",
    });
  };

  const closeAbonoModal = () => {
    setShowAbonoModal(false);
    setSelectedDebt(null);
    setAbonoData({ amount: "", payment_method: "Efectivo", description: "" });
  };

  const handleCreateDebt = async (e) => {
    e.preventDefault();
    if (isMutating) return;

    const total = Number(createData.total_amount || 0);
    if (!createData.patient_id) {
      toast.error("Selecciona un paciente");
      return;
    }
    if (!createData.concept.trim()) {
      toast.error("Ingresa un concepto");
      return;
    }
    if (total <= 0) {
      toast.error("El valor de la deuda debe ser mayor a cero");
      return;
    }

    try {
      await mutateDebt({
        method: "POST",
        body: {
          patient_id: Number(createData.patient_id),
          debt_type: createData.debt_type,
          concept: createData.concept.trim(),
          total_amount: total,
        },
      });
      closeCreateModal();
    } catch (error) {
      toast.error(error?.message || "No fue posible crear la deuda");
    }
  };

  const handleRegisterAbono = async (e) => {
    e.preventDefault();
    if (isMutating || !selectedDebt) return;

    const amount = Number(abonoData.amount || 0);
    const pending = Number(selectedDebt.pending_amount || 0);

    if (amount <= 0) {
      toast.error("El valor del abono debe ser mayor a cero");
      return;
    }
    if (amount > pending) {
      toast.error("El abono no puede superar el saldo");
      return;
    }

    try {
      await mutatePayment({
        method: "POST",
        body: {
          patient_id: Number(selectedDebt.patient_id),
          payment_category: "abono",
          debt_id: Number(selectedDebt.id),
          amount,
          description:
            abonoData.description?.trim() ||
            `Abono a deuda #${selectedDebt.id}`,
          payment_method: abonoData.payment_method,
        },
      });
      closeAbonoModal();
    } catch (error) {
      toast.error(error?.message || "No fue posible registrar el abono");
    }
  };

  const handleMarkAsPaid = async (debt) => {
    if (isMutating) return;
    try {
      await mutateDebt({
        method: "PUT",
        body: {
          id: debt.id,
          pending_amount: 0,
        },
      });
    } catch (error) {
      toast.error(error?.message || "No fue posible actualizar la deuda");
    }
  };

  const handleDelete = async () => {
    if (isMutating || !confirmDelete.id) return;
    try {
      await mutateDebt({ method: "DELETE", id: confirmDelete.id });
      setConfirmDelete({ isOpen: false, id: null });
    } catch (error) {
      toast.error(error?.message || "No fue posible eliminar la deuda");
    }
  };

  if (!isAdmin) {
    return (
      <div className="patients-container page-wrapper">
        <div className="glass-panel receivables-locked">
          <HandCoins size={26} color="var(--primary)" />
          <h2>Acceso restringido</h2>
          <p>
            El modulo de Cuentas por Cobrar solo esta disponible para usuarios
            con rol Administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="patients-container page-wrapper">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <HandCoins size={28} /> Cuentas por Cobrar
          </h2>
          <p className="page-description">
            Seguimiento de saldos pendientes y registro de abonos por paciente.
          </p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} /> Nueva Deuda
          </button>
        </div>
      </div>

      <section className="receivables-summary-grid">
        <article className="glass-panel receivables-summary-card">
          <span>Saldo pendiente total</span>
          <strong>${totals.pending.toLocaleString()}</strong>
        </article>
        <article className="glass-panel receivables-summary-card">
          <span>Valor total originado</span>
          <strong>${totals.total.toLocaleString()}</strong>
        </article>
        <article className="glass-panel receivables-summary-card">
          <span>Deudas pendientes</span>
          <strong>{totals.pendingCount}</strong>
        </article>
        <article className="glass-panel receivables-summary-card">
          <span>Deudas parciales</span>
          <strong>{totals.partialCount}</strong>
        </article>
      </section>

      <div className="glass-panel receivables-filters">
        <div className="receivables-filter-field">
          <Input
            label="Buscar"
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Paciente o concepto"
          />
        </div>

        <div className="receivables-filter-field">
          <Select
            label="Paciente"
            icon={User}
            value={patientFilter}
            onChange={(e) => setPatientFilter(e.target.value)}
            options={[
              { value: "", label: "Todos" },
              ...patients.map((patient) => ({
                value: patient.id,
                label: patient.name,
              })),
            ]}
          />
        </div>

        <div className="receivables-filter-field">
          <Select
            label="Estado"
            icon={Filter}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
          />
        </div>
      </div>

      <div className="table-wrapper glass-panel">
        {isLoading ? (
          <Spinner />
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Concepto</th>
                <th>Tipo</th>
                <th>Total</th>
                <th>Saldo</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    No hay deudas para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt) => (
                  <tr key={debt.id}>
                    <td className="table-cell-primary">{debt.patient_name}</td>
                    <td>{debt.concept}</td>
                    <td>
                      {debt.debt_type === "product" ? "Producto" : "Control"}
                    </td>
                    <td>${Number(debt.total_amount).toLocaleString()}</td>
                    <td className="table-cell-danger">
                      ${Number(debt.pending_amount).toLocaleString()}
                    </td>
                    <td>
                      <span className={`receivables-status ${debt.status}`}>
                        {statusLabels[debt.status] || debt.status}
                      </span>
                    </td>
                    <td>{new Date(debt.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        {debt.status !== "paid" && (
                          <button
                            className="action-btn"
                            title="Registrar abono"
                            onClick={() => openAbono(debt)}
                            aria-label="Registrar abono"
                          >
                            <CircleDollarSign size={16} />
                          </button>
                        )}

                        {debt.status !== "paid" && (
                          <button
                            className="action-btn"
                            title="Marcar pagada"
                            onClick={() => handleMarkAsPaid(debt)}
                            aria-label="Marcar como pagada"
                          >
                            <Wallet size={16} />
                          </button>
                        )}

                        <button
                          className="action-btn action-delete"
                          title="Eliminar deuda"
                          onClick={() =>
                            setConfirmDelete({ isOpen: true, id: debt.id })
                          }
                          aria-label="Eliminar deuda"
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

      {showCreateModal && (
        <div
          className="modal-overlay flex-center active"
          role="button"
          tabIndex={0}
          aria-label="Cerrar modal de nueva deuda"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeCreateModal();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" || event.key === "Enter")
              closeCreateModal();
          }}
        >
          <div className="modal-content glass-panel scaleIn">
            <h3 className="page-title">
              <Plus size={24} color="var(--primary)" /> Crear Deuda Manual
            </h3>
            <form onSubmit={handleCreateDebt}>
              <Select
                label="Paciente"
                icon={User}
                required
                value={createData.patient_id}
                onChange={(e) =>
                  setCreateData({ ...createData, patient_id: e.target.value })
                }
                options={[
                  { value: "", label: "Seleccione paciente..." },
                  ...patients.map((patient) => ({
                    value: patient.id,
                    label: patient.name,
                  })),
                ]}
              />

              <Select
                label="Tipo"
                icon={FileText}
                required
                value={createData.debt_type}
                onChange={(e) =>
                  setCreateData({ ...createData, debt_type: e.target.value })
                }
                options={debtTypeOptions}
              />

              <Input
                label="Concepto"
                icon={FileText}
                required
                value={createData.concept}
                onChange={(e) =>
                  setCreateData({ ...createData, concept: e.target.value })
                }
                placeholder="Ej: Ajuste de tratamiento abril"
              />

              <CurrencyInput
                label="Valor total"
                required
                value={createData.total_amount}
                onChange={(value) =>
                  setCreateData({ ...createData, total_amount: value })
                }
              />

              <div className="modal-form-actions">
                <button
                  type="button"
                  className="btn-primary btn-secondary"
                  onClick={closeCreateModal}
                  disabled={isMutating}
                >
                  <X size={18} /> Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isMutating}
                >
                  <Save size={18} /> {isMutating ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAbonoModal && selectedDebt && (
        <div
          className="modal-overlay flex-center active"
          role="button"
          tabIndex={0}
          aria-label="Cerrar modal de abono"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeAbonoModal();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" || event.key === "Enter")
              closeAbonoModal();
          }}
        >
          <div className="modal-content glass-panel scaleIn">
            <h3 className="page-title">
              <CircleDollarSign size={24} color="var(--secondary)" /> Registrar
              Abono
            </h3>

            <div className="receivables-abono-info">
              <p>
                <strong>Paciente:</strong> {selectedDebt.patient_name}
              </p>
              <p>
                <strong>Concepto:</strong> {selectedDebt.concept}
              </p>
              <p>
                <strong>Saldo actual:</strong> $
                {Number(selectedDebt.pending_amount).toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleRegisterAbono}>
              <CurrencyInput
                label="Valor del abono"
                required
                value={abonoData.amount}
                onChange={(value) =>
                  setAbonoData({ ...abonoData, amount: value })
                }
              />

              <Select
                label="Metodo"
                icon={Wallet}
                required
                value={abonoData.payment_method}
                onChange={(e) =>
                  setAbonoData({ ...abonoData, payment_method: e.target.value })
                }
                options={[
                  { value: "Efectivo", label: "Efectivo" },
                  { value: "Nequi", label: "Nequi" },
                  { value: "Daviplata", label: "Daviplata" },
                  { value: "Tarjeta", label: "Tarjeta" },
                  { value: "Transferencia", label: "Transferencia" },
                ]}
              />

              <Input
                label="Descripcion"
                icon={FileText}
                value={abonoData.description}
                onChange={(e) =>
                  setAbonoData({ ...abonoData, description: e.target.value })
                }
              />

              <div className="modal-form-actions">
                <button
                  type="button"
                  className="btn-primary btn-secondary"
                  onClick={closeAbonoModal}
                  disabled={isMutating}
                >
                  <X size={18} /> Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isMutating}
                >
                  <Save size={18} /> {isMutating ? "Guardando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Eliminar deuda"
        message="Esta accion elimina el registro de deuda. Si tiene abonos asociados, se recomienda reversarlos primero."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </div>
  );
}
