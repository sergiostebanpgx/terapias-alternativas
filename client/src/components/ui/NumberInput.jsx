import React, { useState } from "react";
import { Hash, Minus, Plus } from "lucide-react";
import "./NumberInput.css";

export default function NumberInput({
  label,
  icon: Icon = Hash,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix,
  error,
  required,
  disabled,
  showControls = true,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  
  const numericValue = typeof value === 'number' ? value : (parseInt(value, 10) || 0);

  const handleIncrement = () => {
    if (disabled) return;
    const newValue = numericValue + step;
    if (max !== undefined && newValue > max) return;
    onChange?.({ target: { value: newValue } });
  };

  const handleDecrement = () => {
    if (disabled) return;
    const newValue = numericValue - step;
    if (newValue < min) return;
    onChange?.({ target: { value: newValue } });
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (val === '' || val === '-') {
      onChange?.({ target: { value: val } });
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      if (min !== undefined && num < min) return;
      if (max !== undefined && num > max) return;
      onChange?.({ target: { value: num } });
    }
  };

  return (
    <div className="number-input-group">
      {label && (
        <label className="number-label">
          {label}
          {required && <span className="number-required">*</span>}
        </label>
      )}
      <div className={`number-wrapper ${isFocused ? 'is-focused' : ''} ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}>
        {showControls && (
          <button 
            type="button" 
            className="number-control number-control--decrement"
            onClick={handleDecrement}
            disabled={disabled || numericValue <= min}
            tabIndex={-1}
            aria-label="Disminuir"
          >
            <Minus size={16} />
          </button>
        )}
        
        <div className="number-field-wrapper">
          {Icon && <Icon className="number-icon" size={18} />}
          <input
            type="text"
            inputMode="numeric"
            className="number-field"
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            {...props}
          />
          {suffix && <span className="number-suffix">{suffix}</span>}
        </div>
        
        {showControls && (
          <button 
            type="button" 
            className="number-control number-control--increment"
            onClick={handleIncrement}
            disabled={disabled || (max !== undefined && numericValue >= max)}
            tabIndex={-1}
            aria-label="Incrementar"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      {error && <span className="number-error">{error}</span>}
    </div>
  );
}
