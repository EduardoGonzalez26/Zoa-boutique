"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface AddressSuggestion {
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
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
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  className = "",
  placeholder = "Calle, número y colonia",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = async (query: string) => {
    if (query.length < 4) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + " México")}&format=json&addressdetails=1&limit=5&countrycodes=mx`;
      const res = await fetch(url, { headers: { "Accept-Language": "es" } });
      const data: AddressSuggestion[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (v: string) => {
    onChange(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(v), 400);
  };

  const handleSelect = (s: AddressSuggestion) => {
    const a = s.address;
    const street = [a.road, a.house_number].filter(Boolean).join(" ");
    const colonia = a.suburb ?? a.neighbourhood ?? "";
    const city = a.city ?? a.town ?? a.village ?? "";
    const state = a.state ?? "";
    const zip = a.postcode ?? "";

    onChange(street || s.display_name.split(",")[0]);
    onSelect({ street: street || s.display_name.split(",")[0], colonia, city, state, zip });
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-stone-400)] pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={`${className} pl-8 pr-8`}
        />
        {loading && (
          <Loader2
            size={13}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-stone-400)] animate-spin"
          />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[var(--color-stone-200)] rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto">
          {suggestions.map((s, i) => {
            const a = s.address;
            const mainLine = [a.road, a.house_number].filter(Boolean).join(" ") || s.display_name.split(",")[0];
            const subLine = [a.suburb ?? a.neighbourhood, a.city ?? a.town, a.state]
              .filter(Boolean)
              .join(", ");
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="w-full text-left px-4 py-3 hover:bg-[var(--color-stone-100)] transition-colors border-b border-[var(--color-stone-100)] last:border-0"
                >
                  <p className="font-sans text-[13px] text-[var(--color-charcoal)] leading-snug">
                    {mainLine}
                  </p>
                  {subLine && (
                    <p className="font-sans text-[11px] text-[var(--color-stone-400)] mt-0.5">
                      {subLine}
                    </p>
                  )}
                </button>
              </li>
            );
          })}
          <li>
            <p className="px-4 py-2 text-[10px] text-[var(--color-stone-400)] font-sans text-center border-t border-[var(--color-stone-100)]">
              Datos de OpenStreetMap
            </p>
          </li>
        </ul>
      )}
    </div>
  );
}
