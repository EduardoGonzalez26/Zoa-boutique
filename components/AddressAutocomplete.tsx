"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, Loader2, MapPin } from "lucide-react";

interface GeocodeResult {
  label: string;
  street: string;
  colonia: string;
  city: string;
  state: string;
  zip: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (parts: {
    street: string;
    colonia: string;
    city: string;
    state: string;
    zip: string;
  }) => void;
  className?: string;
  placeholder?: string;
  /** id del input, para asociarlo con un `<label htmlFor>`. */
  id?: string;
  /** Permite mantener el `autoComplete` del formulario (p. ej. "street-address"). */
  autoComplete?: string;
  /** Marca visual (palomita verde) cuando ya se eligió una sugerencia. */
  selected?: boolean;
}

const MIN_QUERY = 4;

/**
 * Búsqueda explícita de direcciones (sin autocomplete por tecleo):
 * el usuario dispara la consulta con el botón "Buscar dirección" o Enter.
 * Consume `GET /api/geocode?q=` (proxy interno; ya no llama a Nominatim).
 * Si el servicio falla o no hay resultados, se muestra un aviso y se puede
 * seguir escribiendo la dirección a mano — el checkout nunca se bloquea.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  className = "",
  placeholder = "Calle, número y colonia",
  id,
  autoComplete = "off",
  selected = false,
}: AddressAutocompleteProps) {
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [announcement, setAnnouncement] = useState("");
  const [status, setStatus] = useState<{ kind: "info" | "error"; text: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const optionId = (i: number) => `${listboxId}-option-${i}`;

  // Cierre al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = async () => {
    const query = value.trim();
    if (query.length < MIN_QUERY) {
      setResults([]);
      setOpen(false);
      setActiveIndex(-1);
      setStatus({ kind: "info", text: `Escribe al menos ${MIN_QUERY} caracteres para buscar.` });
      setAnnouncement(`Escribe al menos ${MIN_QUERY} caracteres para buscar direcciones.`);
      return;
    }
    setLoading(true);
    setStatus(null);
    setAnnouncement("Buscando direcciones…");
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("geocode");
      const data = (await res.json()) as { results?: GeocodeResult[] };
      const found = Array.isArray(data.results) ? data.results : [];
      setResults(found);
      setActiveIndex(found.length > 0 ? 0 : -1);
      setOpen(found.length > 0);
      if (found.length === 0) {
        setStatus({ kind: "info", text: "Sin resultados. Escribe la dirección a mano." });
        setAnnouncement("Sin resultados de direcciones. Puedes escribir la dirección a mano.");
      } else {
        setStatus(null);
        setAnnouncement(
          `${found.length} ${found.length === 1 ? "dirección encontrada" : "direcciones encontradas"}. Usa las flechas para elegir.`
        );
      }
    } catch {
      setResults([]);
      setOpen(false);
      setActiveIndex(-1);
      setStatus({ kind: "error", text: "No pudimos buscar direcciones. Escribe la dirección a mano." });
      setAnnouncement("Error al buscar direcciones. Puedes escribir la dirección a mano.");
    } finally {
      setLoading(false);
      // Devuelve el foco al input para que las flechas/Enter operen la lista.
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  const handleChange = (v: string) => {
    onChange(v);
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
    setStatus(null);
    setAnnouncement("");
  };

  const handleSelect = (r: GeocodeResult) => {
    const street = (r.street || r.label || "").trim();
    onChange(street);
    onSelect({
      street,
      colonia: r.colonia ?? "",
      city: r.city ?? "",
      state: r.state ?? "",
      zip: r.zip ?? "",
    });
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
    setStatus(null);
    setAnnouncement("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeIndex >= 0 && results[activeIndex]) {
        handleSelect(results[activeIndex]);
      } else {
        void search();
      }
      return;
    }
    if (e.key === "Escape") {
      if (open) setOpen(false);
      return;
    }
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(results.length - 1);
    }
  };

  const listOpen = open && results.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin
          size={13}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zoa-slate-60"
        />
        <input
          id={id}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={listOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={listOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-label={placeholder}
          className={`${className} pl-8 pr-10`}
        />
        {loading ? (
          <Loader2
            size={13}
            aria-hidden
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-zoa-slate-60"
          />
        ) : selected ? (
          <CheckCircle2
            size={15}
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zoa-success"
          />
        ) : null}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => void search()}
          disabled={loading}
          className="min-h-9 cursor-pointer border border-zoa-line-strong px-3 font-sans text-[9px] uppercase tracking-[0.14em] text-zoa-slate transition-colors duration-200 hover:border-zoa-slate hover:bg-zoa-slate/5 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
        >
          Buscar dirección
        </button>
        {selected && (
          <span className="inline-flex items-center gap-1.5 font-sans text-[10px] text-zoa-success">
            <CheckCircle2 size={12} aria-hidden /> Dirección seleccionada
          </span>
        )}
      </div>

      {/* Anuncio para lectores de pantalla */}
      <p className="sr-only" aria-live="polite">{announcement}</p>

      {status && (
        <p
          className={`mt-1.5 font-sans text-[10px] leading-snug ${status.kind === "error" ? "text-zoa-wine" : "text-zoa-slate-60"}`}
        >
          {status.text}
        </p>
      )}

      <div
        hidden={!listOpen}
        className="absolute left-0 right-0 top-full z-50 mt-1 border border-zoa-line bg-zoa-surface"
      >
        <ul id={listboxId} role="listbox" aria-label="Direcciones sugeridas" className="m-0 max-h-64 list-none overflow-y-auto p-0">
          {results.map((s, i) => (
            <li
              key={`${optionId(i)}-${s.label}`}
              id={optionId(i)}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => handleSelect(s)}
              className={`min-h-11 cursor-pointer border-b border-zoa-line px-4 py-3 transition-colors duration-200 last:border-0 ${
                i === activeIndex ? "bg-zoa-slate/5" : "hover:bg-zoa-slate/5"
              }`}
            >
              <p className="font-sans text-[13px] leading-snug text-zoa-slate">
                {s.street || s.label}
              </p>
              <p className="mt-0.5 font-sans text-[11px] text-zoa-slate-60">
                {[s.colonia, s.city, s.state, s.zip].filter(Boolean).join(", ")}
              </p>
            </li>
          ))}
        </ul>
        <p className="border-t border-zoa-line px-4 py-2 text-center font-sans text-[10px] text-zoa-slate-60">
          Datos de{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-zoa-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
          >
            © OpenStreetMap contributors
          </a>
        </p>
      </div>
    </div>
  );
}
