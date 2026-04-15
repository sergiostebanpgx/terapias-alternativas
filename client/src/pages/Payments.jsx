import { useMemo, useState } from "react";
import Spinner from "../components/ui/Spinner";
import ConfirmModal from "../components/ui/ConfirmModal";
import Select from "../components/ui/Select";
import CurrencyInput from "../components/ui/CurrencyInput";
import Input from "../components/ui/Input";
import NumberInput from "../components/ui/NumberInput";
import { useData } from "../hooks/useData";
import { toast } from "sonner";
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  CheckCircle,
  User,
  Info,
  Boxes,
  CircleDollarSign,
  ReceiptText,
} from "lucide-react";
import "./Patients.css";
import "./Payments.css";

const categoryLabels = {
  control: "Control",
  product: "Producto",
  abono: "Abono",
};

export default function Payments() {
  const { data: payments = [], isLoading: paymentsLoading } =
    useData("payments");
  const { data: patients = [] } = useData("patients");
  const { data: products = [] } = useData("inventory");
  const { data: debts = [] } = useData("debts");
  const { mutate, isMutating } = useData("payments");

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    patient_id: "",
    payment_category: "control",
    amount: "",
    total_amount: "",
    description: "",
    payment_method: "Efectivo",
    product_id: "",
    quantity: "1",
    debt_id: "",
  });

  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    id: null,
  });

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === String(formData.product_id)),
    [products, formData.product_id],
  );

  const category = formData.payment_category;
  const quantity = Math.max(1, Number(formData.quantity || 1));
  const productTotal = selectedProduct
    ? Number(selectedProduct.price || 0) * quantity
    : 0;
  const patientDebts = useMemo(
    () =>
      debts.filter((d) => String(d.patient_id) === String(formData.patient_id)),
    [debts, formData.patient_id],
  );
  const selectedDebt = useMemo(
    () => patientDebts.find((d) => String(d.id) === String(formData.debt_id)),
    [patientDebts, formData.debt_id],
  );

  const buildPayload = () => {
    const basePayload = {
      patient_id: Number(formData.patient_id),
      payment_category: category,
      payment_method: formData.payment_method,
      description: formData.description,
    };

    if (category === "product") {
      const total = Number(productTotal || 0);
      const paid = Number(formData.amount || total);
      return {
        ...basePayload,
        product_id: Number(formData.product_id),
        quantity,
        total_amount: total,
        amount: paid,
      };
    }

    if (category === "abono") {
      return {
        ...basePayload,
        debt_id: Number(formData.debt_id),
        amount: Number(formData.amount || 0),
      };
    }

    return {
      ...basePayload,
      total_amount: Number(formData.total_amount || formData.amount || 0),
      amount: Number(formData.amount || 0),
    };
  };

  const validateForm = () => {
    if (!formData.patient_id) return "Debe seleccionar paciente";
    if (!formData.description.trim())
      return "El motivo/descripción es obligatorio";

    if (category === "product") {
      if (!formData.product_id) return "Debe seleccionar producto";
      if (quantity <= 0) return "Cantidad inválida";
      if (!selectedProduct) return "Producto inválido";
      if (quantity > Number(selectedProduct.stock_quantity || 0)) {
        return "Stock insuficiente para la cantidad solicitada";
      }
      const paid = Number(formData.amount || productTotal);
      if (paid <= 0) return "El monto pagado debe ser mayor a cero";
      if (paid > productTotal)
        return "El monto pagado no puede superar el total";
      return null;
    }

    if (category === "abono") {
      if (!formData.debt_id) return "Debe seleccionar una deuda para abonar";
      const paid = Number(formData.amount || 0);
      if (paid <= 0) return "Monto de abono inválido";
      if (selectedDebt && paid > Number(selectedDebt.pending_amount)) {
        return "El abono no puede ser mayor al saldo pendiente";
      }
      return null;
    }

    const paid = Number(formData.amount || 0);
    const total = Number(formData.total_amount || 0);
    if (paid <= 0) return "Monto pagado inválido";
    if (total <= 0) return "Valor total inválido";
    if (paid > total) return "El pago no puede superar el valor total";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isMutating) return;

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const method = isEditing ? "PUT" : "POST";

    try {
      if (method === "PUT") {
        await mutate({
          method,
          body: {
            id: formData.id,
            patient_id: Number(formData.patient_id),
            amount: Number(formData.amount),
            description: formData.description,
            payment_method: formData.payment_method,
          },
        });
      } else {
        await mutate({ method, body: buildPayload() });
      }
      closeModal();
    } catch (error) {
      toast.error(error?.message || "Error al guardar el pago");
    }
  };

  const executeDelete = async () => {
    if (isMutating) return;

    const id = confirmDelete.id;
    try {
      await mutate({ method: "DELETE", id });
      setConfirmDelete({ isOpen: false, id: null });
    } catch (error) {
      toast.error(error?.message || "Error al eliminar");
    }
  };

  const openEdit = (payment) => {
    setFormData({
      id: payment.id,
      patient_id: String(payment.patient_id),
      payment_category: payment.payment_category || "control",
      amount: String(payment.amount || ""),
      total_amount: String(payment.total_amount || payment.amount || ""),
      description: payment.description || "",
      payment_method: payment.payment_method || "Efectivo",
      product_id: payment.product_id ? String(payment.product_id) : "",
      quantity: String(payment.quantity || 1),
      debt_id: payment.debt_id ? String(payment.debt_id) : "",
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
      payment_category: "control",
      amount: "",
      total_amount: "",
      description: "",
      payment_method: "Efectivo",
      product_id: "",
      quantity: "1",
      debt_id: "",
    });
  };

  const renderCategoryBadge = (payment) => {
    const code = payment.payment_category || "control";
    const label = categoryLabels[code] || "Control";
    return (
      <span className={`category-badge category-badge--${code}`}>
        <CheckCircle size={12} /> {label}
      </span>
    );
  };

  return (
    <div className="patients-container page-wrapper">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <CreditCard size={28} /> Registro de Pagos
          </h2>
          <p className="page-description">
            Control de pagos, deudas y abonos por paciente.
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Registrar Pago
          </button>
        </div>
      </div>

      <div className="table-wrapper glass-panel">
        {paymentsLoading ? (
          <Spinner />
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Paciente</th>
                <th>Tipo</th>
                <th>Total</th>
                <th>Pagado</th>
                <th>Concepto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="7">No hay transacciones recientes</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td>{new Date(p.transaction_date).toLocaleDateString()}</td>
                    <td className="table-cell-primary">{p.patient_name}</td>
                    <td>{renderCategoryBadge(p)}</td>
                    <td className="table-cell-muted">
                      ${Number(p.total_amount || p.amount).toLocaleString()}
                    </td>
                    <td className="table-cell-amount">
                      ${Number(p.amount).toLocaleString()}
                    </td>
                    <td className="table-cell-muted">{p.description}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="action-btn"
                          onClick={() => openEdit(p)}
                          title="Editar"
                          aria-label="Editar pago"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-btn action-delete"
                          onClick={() =>
                            setConfirmDelete({ isOpen: true, id: p.id })
                          }
                          title="Eliminar"
                          aria-label="Eliminar pago"
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
              {isEditing ? "Editar Pago" : "Registrar Pago"}
            </h3>

            <form onSubmit={handleSubmit}>
              <Select
                label="Paciente"
                icon={User}
                required
                value={formData.patient_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    patient_id: e.target.value,
                    debt_id: "",
                  })
                }
                options={[
                  { value: "", label: "Seleccione un paciente..." },
                  ...patients.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />

              {!isEditing && (
                <Select
                  label="Tipo de operación"
                  icon={ReceiptText}
                  required
                  value={formData.payment_category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_category: e.target.value,
                      product_id: "",
                      quantity: "1",
                      debt_id: "",
                      total_amount: "",
                    })
                  }
                  options={[
                    { value: "control", label: "Control / Servicio" },
                    { value: "product", label: "Producto de inventario" },
                    { value: "abono", label: "Abono a deuda" },
                  ]}
                />
              )}

              {category === "product" && !isEditing && (
                <>
                  <Select
                    label="Producto"
                    icon={Boxes}
                    required
                    value={formData.product_id}
                    onChange={(e) =>
                      setFormData({ ...formData, product_id: e.target.value })
                    }
                    options={[
                      { value: "", label: "Seleccione producto..." },
                      ...products.map((p) => ({
                        value: p.id,
                        label: `${p.name} (Stock: ${p.stock_quantity})`,
                      })),
                    ]}
                  />

                  <NumberInput
                    label="Cantidad"
                    required
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                  />
                </>
              )}

              {category === "abono" && !isEditing && (
                <Select
                  label="Deuda a abonar"
                  icon={CircleDollarSign}
                  required
                  value={formData.debt_id}
                  onChange={(e) =>
                    setFormData({ ...formData, debt_id: e.target.value })
                  }
                  options={[
                    { value: "", label: "Seleccione deuda..." },
                    ...patientDebts.map((d) => ({
                      value: d.id,
                      label: `${d.concept} | Saldo: $${Number(d.pending_amount).toLocaleString()}`,
                    })),
                  ]}
                />
              )}

              {category === "control" && !isEditing && (
                <CurrencyInput
                  label="Valor Total"
                  required
                  value={formData.total_amount}
                  onChange={(val) =>
                    setFormData({ ...formData, total_amount: val })
                  }
                />
              )}

              {category === "product" && !isEditing && (
                <div className="info-box">
                  Total venta:{" "}
                  <strong>${Number(productTotal || 0).toLocaleString()}</strong>
                </div>
              )}

              <CurrencyInput
                label={
                  category === "abono" ? "Valor del Abono" : "Monto a Recibir"
                }
                required
                value={formData.amount}
                onChange={(val) => setFormData({ ...formData, amount: val })}
              />

              {category === "abono" && selectedDebt && (
                <div className="info-box info-box--success">
                  Saldo pendiente actual:{" "}
                  <strong>
                    ${Number(selectedDebt.pending_amount).toLocaleString()}
                  </strong>
                </div>
              )}

              <Input
                label="Motivo o Descripción"
                icon={Info}
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Ej: Control nutricional abril / Venta suplemento"
              />

              <Select
                label="Método de Pago"
                icon={CreditCard}
                required
                value={formData.payment_method}
                onChange={(e) =>
                  setFormData({ ...formData, payment_method: e.target.value })
                }
                options={[
                  { value: "Efectivo", label: "Efectivo" },
                  { value: "Nequi", label: "Nequi" },
                  { value: "Daviplata", label: "Daviplata" },
                  { value: "Tarjeta", label: "Tarjeta (Débito/Crédito)" },
                  { value: "Transferencia", label: "Transferencia Bancaria" },
                  { value: "Otro", label: "Otro medio" },
                ]}
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
                      ? "Actualizar"
                      : "Confirmar Pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="¿Anular pago?"
        message="Esta transacción será eliminada y se revertirán stock/deuda asociados si aplica."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </div>
  );
}
