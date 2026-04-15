import React, { useState, useMemo } from "react";
import { Clock, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import "./TimePicker.css";

function generateTimeSlots(interval = 30, startHour = 0, endHour = 24) {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += interval) {
      const hour = String(h).padStart(2, "0");
      const minute = String(m).padStart(2, "0");
      const value = `${hour}:${minute}`;
      const label = formatTime12h(h, m);
      slots.push({ value, label });
    }
  }
  return slots;
}

function formatTime12h(hours, minutes) {
  const period = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  const m = String(minutes).padStart(2, "0");
  return `${h}:${m} ${period}`;
}

function parseTimeValue(value) {
  if (!value) return { display: "Seleccionar hora", value: "" };
  const [h, m] = value.split(":").map(Number);
  return { display: formatTime12h(h, m), value };
}

export default function TimePicker({
  label,
  value,
  onChange,
  interval = 30,
  startHour = 6,
  endHour = 22,
  placeholder = "Seleccionar hora",
  required,
  disabled,
  error,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const timeSlots = useMemo(
    () => generateTimeSlots(interval, startHour, endHour),
    [interval, startHour, endHour]
  );
  
  const parsed = parseTimeValue(value);

  const handleSelect = (slot) => {
    onChange?.({ target: { value: slot.value } });
    setIsOpen(false);
  };

  return (
    <div className="timepicker-group">
      {label && (
        <label className="timepicker-label">
          {label}
          {required && <span className="timepicker-required">*</span>}
        </label>
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button 
            type="button" 
            className={`timepicker-trigger ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}
            disabled={disabled}
            {...props}
          >
            <span className="timepicker-trigger-content">
              <Clock size={18} className="timepicker-icon" />
              <span className={parsed.value ? '' : 'is-placeholder'}>
                {parsed.value ? parsed.display : placeholder}
              </span>
            </span>
            <ChevronDown size={16} className={`timepicker-chevron ${isOpen ? 'is-open' : ''}`} />
          </button>
        </PopoverTrigger>
        
        <PopoverContent className="timepicker-dropdown" align="start" sideOffset={8}>
          <div className="timepicker-list">
            {timeSlots.map((slot) => (
              <button
                key={slot.value}
                type="button"
                className={`timepicker-option ${slot.value === value ? 'is-selected' : ''}`}
                onClick={() => handleSelect(slot)}
              >
                <span className="timepicker-option-label">{slot.label}</span>
                <span className="timepicker-option-value">{slot.value}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      
      {error && <span className="timepicker-error">{error}</span>}
    </div>
  );
}
