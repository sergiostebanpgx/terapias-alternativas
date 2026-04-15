import { formatCOP, cleanCurrency } from "../../utils/formatters";
import Input from "./Input";

export default function CurrencyInput({ value, onChange, label, ...props }) {
  const displayValue = formatCOP(value);

  const handleChange = (e) => {
    const raw = e.target.value;
    const numeric = cleanCurrency(raw);

    // Solo permitir números positivos
    if (isNaN(numeric) && raw !== "") return;

    if (onChange) {
      onChange(numeric);
    }
  };

  return (
    <Input
      label={label}
      value={displayValue}
      onChange={handleChange}
      placeholder="0 COP"
      {...props}
    />
  );
}
