import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const EMPTY_OPTIONS = [];

const Select = ({
  label,
  icon: Icon,
  options = EMPTY_OPTIONS,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = options.find((o) => String(o.value) === String(value));
  const shouldShowSearch = options.length > 5;

  const filtered = useMemo(() => {
    if (!shouldShowSearch) return options;
    const term = search.trim().toLowerCase();
    if (!term) return options;
    return options.filter((o) => String(o.label).toLowerCase().includes(term));
  }, [options, search, shouldShowSearch]);

  const handleSelect = (opt) => {
    onChange({ target: { value: opt.value } });
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="mb-5 w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
      )}

      <Popover
        open={isOpen}
        onOpenChange={(nextOpen) => {
          setIsOpen(nextOpen);
          if (!nextOpen) setSearch("");
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            disabled={disabled}
            className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 py-2 text-left text-sm shadow-sm transition-colors hover:border-ring/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            {...props}
          >
            <span className="flex min-w-0 items-center gap-2">
              {Icon && (
                <Icon size={16} className="shrink-0 text-muted-foreground" />
              )}
              <span
                className={`truncate ${selectedOption ? "text-foreground" : "text-muted-foreground"}`}
              >
                {selectedOption
                  ? selectedOption.label
                  : placeholder || "Seleccione..."}
              </span>
            </span>
            <ChevronDown
              size={16}
              className={`shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-(--radix-popover-trigger-width) min-w-55 p-0"
          align="start"
        >
          {shouldShowSearch && (
            <div className="border-b border-border p-2">
              <div className="flex items-center gap-2 rounded-md border border-input bg-background px-2">
                <Search size={14} className="text-muted-foreground" />
                <input
                  className="h-8 w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          )}

          <ul
            role="listbox"
            className="max-h-64 overflow-y-auto p-1"
            aria-label={label || "Opciones"}
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                Sin resultados
              </li>
            ) : (
              filtered.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-accent/60"
                      }`}
                      onClick={() => handleSelect(opt)}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check size={14} className="shrink-0" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default Select;
