import React from 'react';
import './Button.css';

const Button = React.forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  ...props 
}, ref) => {
  const classes = [
    'ui-button',
    `ui-button--${variant}`,
    `ui-button--${size}`,
    fullWidth && 'ui-button--full',
    loading && 'ui-button--loading',
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="ui-button__spinner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          </svg>
        </span>
      )}
      {Icon && iconPosition === 'left' && !loading && (
        <Icon className="ui-button__icon" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      )}
      <span className="ui-button__text">{children}</span>
      {Icon && iconPosition === 'right' && !loading && (
        <Icon className="ui-button__icon" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
