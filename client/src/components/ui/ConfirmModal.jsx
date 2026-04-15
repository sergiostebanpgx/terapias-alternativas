import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import "./ConfirmModal.css";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
}) {
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent className="confirm-modal">
        <AlertDialogHeader>
          <div className="confirm-icon-wrapper">
            <AlertTriangle size={32} />
          </div>
          <AlertDialogTitle className="confirm-title">{title}</AlertDialogTitle>
          <AlertDialogDescription className="confirm-description">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="confirm-footer">
          <AlertDialogCancel className="confirm-cancel">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="confirm-action">
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
