"use client";

import { motion } from "framer-motion";

const MESSAGE = "ENVÍOS A TODO MÉXICO";
// Repeat enough copies to fill viewport at any width
const COPIES = 12;
const text = `${MESSAGE} · `.repeat(COPIES);

export default function Marquee() {
  return (
    <div
      className="w-full overflow-hidden bg-[var(--color-charcoal)] text-[var(--color-gold)] border-b border-[var(--color-charcoal)] py-1.5"
      aria-hidden="true"
    >
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 22,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        <span className="font-sans text-[9px] tracking-[0.35em] uppercase pr-4">
          {text}
        </span>
        {/* Duplicate for seamless loop */}
        <span className="font-sans text-[9px] tracking-[0.35em] uppercase pr-4" aria-hidden>
          {text}
        </span>
      </motion.div>
    </div>
  );
}
