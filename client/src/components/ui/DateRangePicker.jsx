"use client";

import React, { useState, useMemo } from "react";
import { CalendarIcon, ChevronDown, ArrowRight } from "lucide-react";
import { es } from "date-fns/locale";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import "./DateRangePicker.css";

function formatDateDisplay(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DateRangePicker({
  label,
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  minDate,
  maxDate,
  required,
  disabled,
  error,
  presets = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeField, setActiveField] = useState("start");

  const parsedStart = useMemo(() => (startDate ? new Date(startDate) : null), [startDate]);
  const parsedEnd = useMemo(() => (endDate ? new Date(endDate) : null), [endDate]);

  const handleDateSelect = (day) => {
    if (!day) return;
    const isoDate = day.toISOString().split("T")[0];

    if (activeField === "start") {
      onStartChange?.(isoDate);
      if (parsedEnd && day > parsedEnd) {
        onEndChange?.(isoDate);
      }
      setActiveField("end");
    } else {
      if (parsedStart && day < parsedStart) {
        onStartChange?.(isoDate);
        setActiveField("end");
      } else {
        onEndChange?.(isoDate);
        setIsOpen(false);
        setActiveField("start");
      }
    }
  };

  const handlePreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onStartChange?.(start.toISOString().split("T")[0]);
    onEndChange?.(end.toISOString().split("T")[0]);
    setIsOpen(false);
  };

  const displayStart = formatDateDisplay(parsedStart);
  const displayEnd = formatDateDisplay(parsedEnd);

  return (
    <div className="daterange-group">
      {label && (
        <label className="daterange-label">
          {label}
          {required && <span className="daterange-required">*</span>}
        </label>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`daterange-trigger ${error ? "has-error" : ""} ${disabled ? "is-disabled" : ""}`}
            disabled={disabled}
          >
            <span className="daterange-trigger-content">
              <CalendarIcon size={18} className="daterange-icon" />
              <span className="daterange-dates">
                <span className={displayStart ? "" : "is-placeholder"}>
                  {displayStart || "Fecha inicio"}
                </span>
                <ArrowRight size={14} className="daterange-arrow" />
                <span className={displayEnd ? "" : "is-placeholder"}>
                  {displayEnd || "Fecha fin"}
                </span>
              </span>
            </span>
            <ChevronDown size={16} className={`daterange-chevron ${isOpen ? "is-open" : ""}`} />
          </button>
        </PopoverTrigger>

        <PopoverContent className="daterange-dropdown" align="start" sideOffset={8}>
          {presets && (
            <div className="daterange-presets">
              <button type="button" className="daterange-preset" onClick={() => handlePreset(7)}>
                Ultimos 7 dias
              </button>
              <button type="button" className="daterange-preset" onClick={() => handlePreset(30)}>
                Ultimos 30 dias
              </button>
              <button type="button" className="daterange-preset" onClick={() => handlePreset(90)}>
                Ultimos 90 dias
              </button>
            </div>
          )}

          <div className="daterange-tabs">
            <button
              type="button"
              className={`daterange-tab ${activeField === "start" ? "is-active" : ""}`}
              onClick={() => setActiveField("start")}
            >
              <span className="daterange-tab-label">Desde</span>
              <span className="daterange-tab-value">{displayStart || "---"}</span>
            </button>
            <button
              type="button"
              className={`daterange-tab ${activeField === "end" ? "is-active" : ""}`}
              onClick={() => setActiveField("end")}
            >
              <span className="daterange-tab-label">Hasta</span>
              <span className="daterange-tab-value">{displayEnd || "---"}</span>
            </button>
          </div>

          <div className="daterange-calendar">
            <Calendar
              mode="single"
              selected={activeField === "start" ? parsedStart : parsedEnd}
              onSelect={handleDateSelect}
              disabled={minDate ? { before: new Date(minDate) } : undefined}
              locale={es}
              initialFocus
              modifiers={{
                range_start: parsedStart,
                range_end: parsedEnd,
                in_range: (date) =>
                  parsedStart && parsedEnd && date > parsedStart && date < parsedEnd,
              }}
              modifiersClassNames={{
                range_start: "rdp-day_range_start",
                range_end: "rdp-day_range_end",
                in_range: "rdp-day_in_range",
              }}
            />
          </div>
        </PopoverContent>
      </Popover>

      {error && <span className="daterange-error">{error}</span>}
    </div>
  );
}
