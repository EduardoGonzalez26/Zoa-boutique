"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

const PHONE = "525521068191";

/**
 * "Únete al círculo Zoa" — captura de correo + apertura de WhatsApp
 * con mensaje predefinido (sin backend, sin promesas de suscripción).
 */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");

  const message = email.trim()
    ? `Hola Zoa, quiero unirme al círculo: mi correo es ${email.trim()}`
    : "Hola Zoa, quiero unirme al círculo Zoa y recibir novedades.";

  const href = `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        window.open(href, "_blank", "noopener,noreferrer");
      }}
      className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch"
    >
      <label className="sr-only" htmlFor="zoa-circle-email">
        Correo electrónico
      </label>
      <input
        id="zoa-circle-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@correo.com"
        className="min-h-12 flex-1 border border-zoa-line-strong bg-transparent px-4 font-sans text-[13px] text-zoa-slate placeholder:text-zoa-slate-60 transition-colors duration-200 focus:border-zoa-forest focus:outline-none focus:ring-2 focus:ring-zoa-forest/15"
      />
      <button
        type="submit"
        className="group inline-flex min-h-12 shrink-0 cursor-pointer items-center justify-center gap-2 border border-zoa-forest-35 bg-transparent px-6 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-zoa-forest transition-colors duration-200 hover:border-zoa-forest hover:bg-zoa-forest hover:text-zoa-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-forest focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-px"
      >
        Unirme
        <ArrowRight size={12} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1" />
      </button>
    </form>
  );
}
