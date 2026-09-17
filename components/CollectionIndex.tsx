"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export interface CollectionRow {
  label: string;
  slug: string;
  href: string;
  image: string;
  count?: number;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Índice de colecciones editorial: lista numerada sobre hairlines con
 * preview de imagen al hover (solo pointer fino) en un panel sticky de 5 columnas.
 * El número de la fila activa pasa a itálica.
 */
export default function CollectionIndex({ items }: { items: CollectionRow[] }) {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();

  if (!items.length) return null;

  return (
    <div className="grid grid-cols-1 gap-x-10 lg:grid-cols-12">
      {/* Lista numerada */}
      <ul className="m-0 list-none border-t border-zoa-line p-0 lg:col-span-7">
        {items.map((item, i) => {
          const isActive = i === active;
          return (
            <li key={item.slug} className="list-none border-b border-zoa-line">
              <Link
                href={item.href}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className="group flex cursor-pointer items-center gap-5 px-1 py-6 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zoa-slate md:py-8"
              >
                <span
                  className={`w-9 shrink-0 font-sans text-[11px] tracking-[0.2em] text-zoa-slate-60 tabular transition-all duration-200 ${
                    isActive ? "font-display text-[15px] not-italic tracking-normal text-zoa-slate" : ""
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[clamp(1.5rem,3vw,2.4rem)] leading-[1.05] tracking-[-0.02em] text-zoa-slate">
                    {item.label}
                  </span>
                  {typeof item.count === "number" && (
                    <span className="mt-1 block font-sans text-[10px] uppercase tracking-[0.22em] text-zoa-slate-60 tabular">
                      {item.count} {item.count === 1 ? "pieza" : "piezas"}
                    </span>
                  )}
                </span>

                <ArrowRight
                  size={16}
                  strokeWidth={1.3}
                  aria-hidden
                  className="shrink-0 text-zoa-slate transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                />
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Preview — solo pointer fino */}
      <div className="pointer-fine-only lg:col-span-5">
        <div className="sticky top-32 h-[520px] w-full">
          <div className="hairline relative h-full w-full overflow-hidden bg-zoa-surface">
            {items.map((item, i) => (
              <motion.div
                key={item.slug}
                className="absolute inset-0"
                initial={false}
                animate={{ opacity: i === active ? 1 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.7, ease: EASE }}
                aria-hidden={i !== active}
              >
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="(max-width: 1280px) 40vw, 520px"
                  className="object-cover object-center"
                />
              </motion.div>
            ))}

            {/* Etiqueta de la colección activa */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 bg-zoa-sand/95 px-4 py-3">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={items[active]?.slug}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="font-sans text-[10px] uppercase tracking-[0.22em] text-zoa-slate"
                >
                  {items[active]?.label}
                </motion.span>
              </AnimatePresence>
              <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-zoa-slate-60 tabular">
                {String(active + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
