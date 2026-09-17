"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export interface AccordionEntry {
  id: string;
  label: string;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionEntry[];
  /** `id` abierto inicialmente. `null` = todos cerrados. */
  defaultOpenId?: string | null;
  /** Si es `true`, solo un panel puede estar abierto a la vez. */
  single?: boolean;
  className?: string;
  tone?: "default" | "inverse";
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Acordeón editorial: hairlines, `aria-expanded`, chevron y altura animada.
 * Respeta `prefers-reduced-motion` (apertura instantánea).
 */
export default function Accordion({
  items,
  defaultOpenId = null,
  single = true,
  className = "",
  tone = "default",
}: AccordionProps) {
  const [openIds, setOpenIds] = useState<string[]>(defaultOpenId ? [defaultOpenId] : []);
  const reduceMotion = useReducedMotion();
  const inverse = tone === "inverse";

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return single ? [id] : [...prev, id];
    });
  };

  return (
    <div className={`${inverse ? "hairline-inverse-t" : "hairline-t"} ${className}`}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <div key={item.id} className={inverse ? "hairline-inverse-b" : "hairline-b"}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={`acc-${item.id}`}
              className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 py-4 text-left font-sans text-[10px] font-medium uppercase tracking-[0.22em] transition-opacity duration-200 hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-offset-transparent ${
                inverse
                  ? "text-zoa-surface focus-visible:ring-zoa-surface"
                  : "text-zoa-slate focus-visible:ring-zoa-slate"
              }`}
            >
              {item.label}
              <ChevronDown
                size={13}
                strokeWidth={1.5}
                aria-hidden
                className={`shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key={item.id}
                  id={`acc-${item.id}`}
                  initial={reduceMotion ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduceMotion ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: EASE }}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    className={`pb-5 pr-6 font-sans text-[13px] leading-[1.7] ${
                      inverse ? "text-zoa-slate-inverse-60" : "text-zoa-slate-60"
                    }`}
                  >
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
