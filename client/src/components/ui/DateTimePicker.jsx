"use client";

import { useMemo, useState } from "react";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { es } from "date-fns/locale";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

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
    return "Seleccionar fecha";
  }

  return date.toLocaleDateString("es-CO", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DateTimePicker({ label, value, onChange, required }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedDate = useMemo(() => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [value]);

  const timeValue = formatTimeForInput(selectedDate || value);

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
    setIsOpen(false);
  };

  const handleTimeChange = (event) => {
    const merged = parseTimeToDate(
      event.target.value,
      value || new Date().toISOString(),
    );
    if (!merged) return;
    onChange(merged.toISOString().slice(0, 16));
  };

  return (
    <div className="datetime-group">
      {label && (
        <label className="datetime-label">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
      )}

      <div className="datetime-wrapper">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button type="button" className="datetime-trigger">
              <span className="flex min-w-0 items-center gap-2">
                <CalendarIcon
                  size={16}
                  className="shrink-0 text-muted-foreground"
                />
                <span
                  className={
                    selectedDate ? "truncate" : "truncate text-muted-foreground"
                  }
                >
                  {getDisplayDate(selectedDate)}
                </span>
              </span>
              <ChevronDownIcon
                size={16}
                className="shrink-0 text-muted-foreground"
              />
            </button>
          </PopoverTrigger>

          <PopoverContent className="w-auto p-3" align="start" sideOffset={8}>
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={handleDateSelect}
              disabled={{ before: today }}
              locale={es}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="datetime-divider" />

        <input
          type="time"
          className="datetime-time-input"
          value={timeValue}
          onChange={handleTimeChange}
          step="1800"
        />
      </div>
    </div>
  );
}
