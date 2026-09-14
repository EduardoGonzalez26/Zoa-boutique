"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CTABanner() {
  return (
    <section
      style={{ background: "linear-gradient(135deg, #EFEBE4 0%, #E8E0D5 50%, #DDD5C8 100%)" }}
      className="relative overflow-hidden"
    >
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative lines */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[var(--color-gold)]/20 to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[var(--color-gold)]/20 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-20 md:py-28 text-center">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="font-sans text-[10px] tracking-[0.4em] uppercase text-[var(--color-stone-600)] mb-5"
        >
          Nueva colección disponible
        </motion.p>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          viewport={{ once: true }}
          className="font-serif text-4xl md:text-5xl lg:text-6xl text-[var(--color-charcoal)] leading-tight mb-5"
          style={{ fontFamily: "var(--font-marcellus), Georgia, serif", fontWeight: 400 }}
        >
          Piezas que te definen,<br className="hidden md:block" />
          <span className="italic text-[var(--color-stone-600)]"> estilo que perdura</span>
        </motion.h2>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          viewport={{ once: true }}
          className="w-12 h-px bg-[var(--color-gold)] mx-auto mb-6"
        />

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="font-sans text-sm text-[var(--color-stone-600)] max-w-md mx-auto mb-10 leading-relaxed tracking-wide"
        >
          Descubre nuestra colección completa: blusas, vestidos, sweaters y más. Envíos a todo México.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <Link
            href="/tienda"
            className="group inline-flex items-center gap-2.5 bg-[var(--color-charcoal)] text-[var(--color-cream)] px-8 py-3.5 rounded-lg font-sans text-[11px] tracking-[0.25em] uppercase hover:bg-[var(--color-stone-700)] transition-colors duration-300"
          >
            Explorar colección
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
