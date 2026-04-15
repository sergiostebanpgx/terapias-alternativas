"use client";

import { useMemo, useState } from "react";
import { CalendarIcon, Clock, ChevronDown } from "lucide-react";
import { es } from "date-fns/locale";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import "./DateTimePicker.css";

function formatTimeForInput(date) {
  if (!date) return "08:00";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "08:00";
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function parseTimeToDate(timeStr, baseDate) {
  if (!timeStr) return null;
  const [hoursStr = "08", minutesStr = "00"] = timeStr.split(":");
  const hours = Number.parseInt(hoursStr, 10);
  const minutes = Number.parseInt(minutesStr, 10);
  const date = baseDate ? new Date(baseDate) : new Date();
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function getDisplayDate(date) {
  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("es-CO", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime12h(hours, minutes) {
  const period = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  const m = String(minutes).padStart(2, "0");
  return `${h}:${m} ${period}`;
}

export default function DateTimePicker({ label, value, onChange, required, disabled, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const selectedDate = useMemo(() => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [value]);

  const timeValue = formatTimeForInput(selectedDate || value);
  const displayTime = selectedDate 
    ? formatTime12h(selectedDate.getHours(), selectedDate.getMinutes())
    : null;

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const handleDateSelect = (day) => {
    if (!day) return;

    const hours = selectedDate ? selectedDate.getHours() : 8;
    const minutes = selectedDate ? selectedDate.getMinutes() : 0;
    const merged = new Date(day);
    merged.setHours(hours, minutes, 0, 0);
    onChange(merged.toISOString().slice(0, 16));
    setShowTimePicker(true);
  };

  const handleTimeChange = (event) => {
    const merged = parseTimeToDate(
      event.target.value,
      value || new Date().toISOString(),
    );
    if (!merged) return;
    onChange(merged.toISOString().slice(0, 16));
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 6; h < 22; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = String(h).padStart(2, "0");
        const minute = String(m).padStart(2, "0");
        slots.push({
          value: `${hour}:${minute}`,
          label: formatTime12h(h, m)
        });
      }
    }
    return slots;
  }, []);

  const handleTimeSelect = (slot) => {
    const merged = parseTimeToDate(slot.value, value || new Date().toISOString());
    if (!merged) return;
    onChange(merged.toISOString().slice(0, 16));
    setIsOpen(false);
    setShowTimePicker(false);
  };

  return (
    <div className="datetime-picker-group">
      {label && (
        <label className="datetime-picker-label">
          {label}
          {required && <span className="datetime-picker-required">*</span>}
        </label>
      )}

      <div className={`datetime-picker-wrapper ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}>
        <Popover open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) setShowTimePicker(false);
        }}>
          <PopoverTrigger asChild>
            <button type="button" className="datetime-picker-trigger" disabled={disabled}>
              <span className="datetime-picker-section">
                <CalendarIcon size={18} className="datetime-picker-icon" />
                <span className={selectedDate ? "datetime-picker-value" : "datetime-picker-placeholder"}>
                  {getDisplayDate(selectedDate) || "Seleccionar fecha"}
                </span>
              </span>
              <span className="datetime-picker-divider" />
              <span className="datetime-picker-section">
                <Clock size={18} className="datetime-picker-icon" />
                <span className={displayTime ? "datetime-picker-value" : "datetime-picker-placeholder"}>
                  {displayTime || "Hora"}
                </span>
              </span>
              <ChevronDown
                size={16}
                className={`datetime-picker-chevron ${isOpen ? 'is-open' : ''}`}
              />
            </button>
          </PopoverTrigger>

          <PopoverContent className="datetime-picker-dropdown" align="start" sideOffset={8}>
            {!showTimePicker ? (
              <>
                <div className="datetime-picker-header">
                  <span className="datetime-picker-header-title">Seleccionar fecha</span>
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={handleDateSelect}
                  disabled={{ before: today }}
                  locale={es}
                  initialFocus
                />
              </>
            ) : (
              <>
                <div className="datetime-picker-header">
                  <button 
                    type="button" 
                    className="datetime-picker-back"
                    onClick={() => setShowTimePicker(false)}
                  >
                    Cambiar fecha
                  </button>
                  <span className="datetime-picker-header-title">Seleccionar hora</span>
                </div>
                <div className="datetime-picker-time-list">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      className={`datetime-picker-time-option ${slot.value === timeValue ? 'is-selected' : ''}`}
                      onClick={() => handleTimeSelect(slot)}
                    >
                      <span className="datetime-picker-time-label">{slot.label}</span>
                      <span className="datetime-picker-time-value">{slot.value}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </PopoverContent>
        </Popover>
      </div>
      
      {error && <span className="datetime-picker-error">{error}</span>}
    </div>
  );
}
