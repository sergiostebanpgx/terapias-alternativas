"use client";

import React, { useState, useMemo } from "react";
import { Clock, ChevronDown, ArrowRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import "./TimeRangePicker.css";

function generateTimeSlots(interval = 30, startHour = 0, endHour = 24) {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += interval) {
      const hour = String(h).padStart(2, "0");
      const minute = String(m).padStart(2, "0");
      const value = `${hour}:${minute}`;
      const label = formatTime12h(h, m);
      slots.push({ value, label, hours: h, minutes: m });
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

function parseTimeDisplay(value) {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  return formatTime12h(h, m);
}

export default function TimeRangePicker({
  label,
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  interval = 30,
  startHour = 6,
  endHour = 22,
  required,
  disabled,
  error,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeField, setActiveField] = useState("start");

  const timeSlots = useMemo(
    () => generateTimeSlots(interval, startHour, endHour),
    [interval, startHour, endHour]
  );

  const displayStart = parseTimeDisplay(startTime);
  const displayEnd = parseTimeDisplay(endTime);

  const handleSelect = (slot) => {
    if (activeField === "start") {
      onStartChange?.({ target: { value: slot.value } });
      // Si la hora final es menor, actualizarla
      if (endTime) {
        const [endH, endM] = endTime.split(":").map(Number);
        if (slot.hours > endH || (slot.hours === endH && slot.minutes >= endM)) {
          const nextSlot = timeSlots.find(
            (s) => s.hours > slot.hours || (s.hours === slot.hours && s.minutes > slot.minutes)
          );
          if (nextSlot) onEndChange?.({ target: { value: nextSlot.value } });
        }
      }
      setActiveField("end");
    } else {
      onEndChange?.({ target: { value: slot.value } });
      setIsOpen(false);
      setActiveField("start");
    }
  };

  const filteredSlots = useMemo(() => {
    if (activeField === "end" && startTime) {
      const [startH, startM] = startTime.split(":").map(Number);
      return timeSlots.filter(
        (s) => s.hours > startH || (s.hours === startH && s.minutes > startM)
      );
    }
    return timeSlots;
  }, [activeField, startTime, timeSlots]);

  return (
    <div className="timerange-group">
      {label && (
        <label className="timerange-label">
          {label}
          {required && <span className="timerange-required">*</span>}
        </label>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`timerange-trigger ${error ? "has-error" : ""} ${disabled ? "is-disabled" : ""}`}
            disabled={disabled}
          >
            <span className="timerange-trigger-content">
              <Clock size={18} className="timerange-icon" />
              <span className="timerange-times">
                <span className={displayStart ? "" : "is-placeholder"}>
                  {displayStart || "Inicio"}
                </span>
                <ArrowRight size={14} className="timerange-arrow" />
                <span className={displayEnd ? "" : "is-placeholder"}>
                  {displayEnd || "Fin"}
                </span>
              </span>
            </span>
            <ChevronDown size={16} className={`timerange-chevron ${isOpen ? "is-open" : ""}`} />
          </button>
        </PopoverTrigger>

        <PopoverContent className="timerange-dropdown" align="start" sideOffset={8}>
          <div className="timerange-tabs">
            <button
              type="button"
              className={`timerange-tab ${activeField === "start" ? "is-active" : ""}`}
              onClick={() => setActiveField("start")}
            >
              <span className="timerange-tab-label">Inicio</span>
              <span className="timerange-tab-value">{displayStart || "---"}</span>
            </button>
            <button
              type="button"
              className={`timerange-tab ${activeField === "end" ? "is-active" : ""}`}
              onClick={() => setActiveField("end")}
            >
              <span className="timerange-tab-label">Fin</span>
              <span className="timerange-tab-value">{displayEnd || "---"}</span>
            </button>
          </div>

          <div className="timerange-list">
            {filteredSlots.map((slot) => {
              const isSelected =
                (activeField === "start" && slot.value === startTime) ||
                (activeField === "end" && slot.value === endTime);
              return (
                <button
                  key={slot.value}
                  type="button"
                  className={`timerange-option ${isSelected ? "is-selected" : ""}`}
                  onClick={() => handleSelect(slot)}
                >
                  <span className="timerange-option-label">{slot.label}</span>
                  <span className="timerange-option-value">{slot.value}</span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {error && <span className="timerange-error">{error}</span>}
    </div>
  );
}
