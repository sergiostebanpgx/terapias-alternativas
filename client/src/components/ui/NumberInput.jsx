import { Hash } from "lucide-react";
import Input from "./Input";
import "./NumberInput.css";

export default function NumberInput({
  label,
  icon: Icon = Hash,
  suffix,
  ...props
}) {
  return (
    <div className="number-input-wrapper">
      <Input label={label} icon={Icon} type="number" {...props} />
      {suffix && <span className="number-input-suffix">{suffix}</span>}
    </div>
  );
}
