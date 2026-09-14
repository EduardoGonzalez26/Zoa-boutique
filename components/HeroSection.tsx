"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

// ── Configuración de video ──────────────────────────────────────────────────
// Video de Cloudinary con zoom para recortar marca de agua de los bordes
const HERO_VIDEO_URL = "https://res.cloudinary.com/dsx1gi6mt/video/upload/v1775747428/que_continu%CC%81en_caminando_202604090909_tsrvo7.mp4";
const HERO_POSTER = "https://res.cloudinary.com/dsx1gi6mt/video/upload/so_1,f_jpg/v1775747428/que_continu%CC%81en_caminando_202604090909_tsrvo7.jpg";

export default function HeroSection() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/tienda?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <section className="relative h-[88vh] max-h-[900px] w-full flex items-center justify-center overflow-hidden">
      {/* ── Background: Video si existe, imagen si no ── */}
      <div className="absolute inset-0 z-0">
        {HERO_VIDEO_URL ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={HERO_POSTER}
            className="w-full h-full object-cover object-center"
          >
            <source src={HERO_VIDEO_URL} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={HERO_POSTER}
            alt="Zoa — moda femenina de colección"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        )}
        {/* Overlay — fondo oscuro para contraste con texto blanco */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl w-full -mt-8">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-sans text-[10px] tracking-[0.5em] uppercase text-amber-300 mb-5"
        >
          Colección 2026
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="font-serif text-5xl sm:text-6xl md:text-8xl text-white leading-[0.88] mb-6"
        >
          Destaca,
          <br />
          <em>con Estilo.</em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="font-sans text-sm text-white/80 tracking-wide leading-relaxed max-w-md mx-auto mb-8"
        >
          Piezas diseñadas para mujeres que marcan tendencia.
        </motion.p>

        {/* Search bar */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85 }}
          onSubmit={handleSearch}
          className="flex items-stretch gap-0 max-w-md mx-auto mb-6 rounded-xl border border-white/25 bg-white/10 backdrop-blur-md overflow-hidden"
        >
          <Search size={16} className="ml-4 text-white/60 shrink-0 self-center" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Blusas, Sacos, Vestidos..."
            className="flex-1 px-3 py-3.5 text-sm font-sans text-white placeholder:text-white/50 bg-transparent focus:outline-none"
          />
          <button
            type="submit"
            className="self-stretch px-5 bg-white/20 hover:bg-[var(--color-gold)] text-white text-[10px] font-sans tracking-[0.2em] uppercase transition-colors duration-300 shrink-0 border-l border-white/15"
          >
            Buscar
          </button>
        </motion.form>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="flex justify-center"
        >
          <Link
            href="/tienda"
            className="cursor-pointer px-10 py-4 rounded-md bg-white text-black font-sans text-xs tracking-[0.3em] uppercase hover:bg-[var(--color-gold)] hover:text-white transition-colors duration-300"
          >
            Ver Productos
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="w-px h-10 bg-white/50"
        />
        <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-white/50">Scroll</p>
      </motion.div>
    </section>
  );
}
