import { useState } from "react";
import Spinner from "../components/ui/Spinner";
import ConfirmModal from "../components/ui/ConfirmModal";
import Input from "../components/ui/Input";
import NumberInput from "../components/ui/NumberInput";
import { useData } from "../hooks/useData";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  AlertCircle,
  ShoppingCart,
  Info,
} from "lucide-react";
import "./Patients.css";

export default function Inventory() {
  const { data: products = [], isLoading } = useData("inventory");
  const { mutate, isMutating } = useData("inventory");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
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

  const openEdit = (p) => {
    setFormData({
      id: p.id,
      name: p.name,
      description: p.description || "",
      price: p.price,
      stock_quantity: p.stock_quantity,
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
      description: "",
      price: "",
      stock_quantity: "",
    });
  };

  return (
    <div className="patients-container page-wrapper">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <Package size={28} /> Inventario de Productos
          </h2>
          <p className="page-description">
            Gestión de stock y precios de venta.
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Nuevo Producto
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
                <th>Producto</th>
                <th>Descripción</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="5">No hay productos en inventario</td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="table-cell-primary">{p.name}</div>
                      {parseInt(p.stock_quantity) <= 5 && (
                        <span className="stock-warning">
                          <AlertCircle size={10} /> STOCK BAJO
                        </span>
                      )}
                    </td>
                    <td className="table-cell-secondary">
                      {p.description || "-"}
                    </td>
                    <td className="table-cell-amount">
                      ${parseFloat(p.price).toLocaleString()}
                    </td>
                    <td>{p.stock_quantity} uds</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="action-btn"
                          onClick={() => openEdit(p)}
                          title="Editar"
                          aria-label="Editar producto"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-btn action-delete"
                          onClick={() =>
                            setConfirmDelete({ isOpen: true, id: p.id })
                          }
                          title="Eliminar"
                          aria-label="Eliminar producto"
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
          aria-label="Cerrar modal de inventario"
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
              {isEditing ? "Editar Producto" : "Nuevo Producto"}
            </h3>
            <form onSubmit={handleSubmit}>
              <Input
                label="Nombre del Producto"
                icon={Package}
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <div className="input-group">
                <label htmlFor="product-description">Descripción</label>
                <div className="input-wrapper">
                  <Info className="input-icon" size={18} />
                  <textarea
                    id="product-description"
                    className="custom-input-field"
                    rows="2"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row-2">
                <NumberInput
                  label="Precio ($)"
                  icon={ShoppingCart}
                  required
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
                <NumberInput
                  label="Stock"
                  icon={Plus}
                  required
                  suffix="uds"
                  value={formData.stock_quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock_quantity: e.target.value,
                    })
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
        title="¿Eliminar producto?"
        message="Se eliminará este artículo del inventario. Esta acción no se puede deshacer."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </div>
  );
}
