import React from 'react';
import './Input.css';

const Input = React.forwardRef(({ label, icon: Icon, error, ...props }, ref) => {
  return (
    <div className="custom-input-group">
      {label && <label className="input-label">{label}</label>}
      <div className={`input-wrapper ${error ? 'has-error' : ''}`}>
        {Icon && <Icon className="input-icon" size={18} />}
        <input ref={ref} className="custom-input-field" {...props} />
      </div>
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
