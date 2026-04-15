import React, { useState, useRef, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import "./TextArea.css";

export default function TextArea({
  label,
  icon: Icon = MessageSquare,
  value,
  onChange,
  placeholder = "Escribe un comentario...",
  maxLength,
  rows = 3,
  autoResize = false,
  error,
  required,
  disabled,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  
  const charCount = value?.length || 0;

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, autoResize]);

  const handleChange = (e) => {
    if (maxLength && e.target.value.length > maxLength) return;
    onChange?.(e);
  };

  return (
    <div className="textarea-group">
      {label && (
        <label className="textarea-label">
          {label}
          {required && <span className="textarea-required">*</span>}
        </label>
      )}
      <div className={`textarea-wrapper ${isFocused ? 'is-focused' : ''} ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}>
        {Icon && (
          <div className="textarea-icon-wrapper">
            <Icon className="textarea-icon" size={18} />
          </div>
        )}
        <textarea
          ref={textareaRef}
          className="textarea-field"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          {...props}
        />
      </div>
      <div className="textarea-footer">
        {error && <span className="textarea-error">{error}</span>}
        {maxLength && (
          <span className={`textarea-counter ${charCount >= maxLength * 0.9 ? 'is-warning' : ''}`}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
