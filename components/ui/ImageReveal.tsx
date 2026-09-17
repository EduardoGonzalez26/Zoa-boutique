"use client";

import Image from "next/image";
import { useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import useMounted from "@/components/ui/useMounted";

interface ImageRevealProps {
  src: string;
  alt: string;
  /** Obligatorio: evita sobre-descarga de imágenes en el srcset de Next. */
  sizes: string;
  priority?: boolean;
  /** Clases del contenedor (aspect ratio, alto, posición, bg, overlays encima). */
  className?: string;
  /** Clases de la imagen (object-position, filtros). */
  imgClassName?: string;
  delay?: number;
  /** Índice para stagger automático (70ms por paso, máx. 8). */
  offset?: number;
  /** Imagen puramente decorativa (alt vacío + aria-hidden). */
  decorative?: boolean;
}

/**
 * Imagen con reveal editorial (CSS puro, disparado por IntersectionObserver):
 * máscara `clip-path: inset(10% 0 0 0) → inset(0)` + zoom `1.06 → 1`
 * a 950ms con `--ease-out-expo`. Ver `.img-reveal` en globals.css.
 * Con `prefers-reduced-motion` se muestra estática.
 */
export default function ImageReveal({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
  imgClassName = "object-cover object-center",
  delay = 0,
  offset,
  decorative = false,
}: ImageRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const mounted = useMounted();
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const stagger = offset !== undefined ? Math.min(offset, 8) * 0.07 : 0;
  // `mounted` mantiene el primer render idéntico al SSR (clase `is-revealed`
  // solo aparece tras montar con RM).
  const rm = mounted && reduceMotion;
  const revealed = rm || inView;
  const transitionDelay = `${delay + stagger}s`;

  return (
    <div
      ref={ref}
      className={`img-reveal relative overflow-hidden bg-zoa-surface ${revealed ? "is-revealed" : ""} ${className}`}
      style={{ transitionDelay }}
    >
      <div className="img-reveal-media absolute inset-0" style={{ transitionDelay }}>
        <Image
          src={src}
          alt={decorative ? "" : alt}
          aria-hidden={decorative || undefined}
          fill
          sizes={sizes}
          priority={priority}
          className={imgClassName}
        />
      </div>
    </div>
  );
}
