import React, { useState, useRef } from "react";
import { DollarSign } from "lucide-react";
import "./CurrencyInput.css";

function formatCOPDisplay(value) {
  if (value === "" || value === null || value === undefined) return "";
  const num = typeof value === "string" ? parseFloat(value.replace(/[^\d.-]/g, "")) : value;
  if (isNaN(num)) return "";
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function parseCurrency(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[^\d]/g, "");
  return parseInt(cleaned, 10) || 0;
}

export default function CurrencyInput({ 
  value, 
  onChange, 
  label, 
  placeholder = "0",
  error,
  required,
  disabled,
  ...props 
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  
  const displayValue = formatCOPDisplay(value);

  const handleChange = (e) => {
    const raw = e.target.value;
    const numeric = parseCurrency(raw);
    if (onChange) {
      onChange(numeric);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className="currency-input-group">
      {label && (
        <label className="currency-label">
          {label}
          {required && <span className="currency-required">*</span>}
        </label>
      )}
      <div className={`currency-wrapper ${isFocused ? 'is-focused' : ''} ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}>
        <div className="currency-prefix">
          <DollarSign size={18} />
        </div>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          className="currency-field"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          {...props}
        />
        <div className="currency-suffix">
          <span>COP</span>
        </div>
      </div>
      {error && <span className="currency-error">{error}</span>}
    </div>
  );
}
