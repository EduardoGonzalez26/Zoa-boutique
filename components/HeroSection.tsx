"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ArrowDown } from "lucide-react";
import Button from "@/components/ui/Button";

// ── Clips de portada (Cloudinary · MP4 H.264 progresivo, sin f_auto) ───────
// Cloud name activo: `ppo6ze2s`. Las transformaciones ya entregan ~2.83/3.18 MB
// (1440) y ~1.80/2.05 MB (960): no se modifican.
const HERO_CLIPS = [
  {
    id: "models-posing",
    src1440: "https://res.cloudinary.com/ppo6ze2s/video/upload/q_auto:good,w_1440,c_limit/v1789510134/Models_posing_on_city_street_20260915160901.mp4",
    src960: "https://res.cloudinary.com/ppo6ze2s/video/upload/q_auto:good,w_960,c_limit/v1789510134/Models_posing_on_city_street_20260915160901.mp4",
    poster: "https://res.cloudinary.com/ppo6ze2s/video/upload/so_1,f_jpg,q_auto,w_1600/v1789510134/Models_posing_on_city_street_20260915160901.jpg",
  },
  {
    id: "two-models-walking",
    src1440: "https://res.cloudinary.com/ppo6ze2s/video/upload/q_auto:good,w_1440,c_limit/v1789510134/Two_models_walking_in_city_20260915160740.mp4",
    src960: "https://res.cloudinary.com/ppo6ze2s/video/upload/q_auto:good,w_960,c_limit/v1789510134/Two_models_walking_in_city_20260915160740.mp4",
    poster: "https://res.cloudinary.com/ppo6ze2s/video/upload/so_1,f_jpg,q_auto,w_1600/v1789510134/Two_models_walking_in_city_20260915160740.jpg",
  },
] as const;

// Duración del fundido de opacidad entre clips (el saliente se pausa después).
const CROSSFADE_MS = 450;

const EASE = [0.16, 1, 0.3, 1] as const;

const BRIDGE = ["Envíos a todo México", "Pago seguro", "Cambios hasta 7 días"];

export default function HeroSection() {
  const reduceMotion = useReducedMotion();

  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null]);

  // Único estado de render de la secuencia (idempotente; nada de re-render por frame)
  const [activeIdx, setActiveIdx] = useState(0);
  const [armedIdx, setArmedIdx] = useState<number | null>(null);
  const [failedIdx, setFailedIdx] = useState<ReadonlySet<number>>(() => new Set<number>());

  // Espejos mutables: los listeners leen el estado vivo sin re-suscribirse
  const activeIdxRef = useRef(0);
  const armedRef = useRef<number | null>(null);
  const failedRef = useRef<ReadonlySet<number>>(new Set<number>());
  const switchingRef = useRef(false);
  const incomingRef = useRef<number | null>(null);
  const shouldPlayRef = useRef(true);
  const crossfadeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduceMotion) return;

    const videos = videoRefs.current;
    const section = sectionRef.current;

    const requestPlay = (video: HTMLVideoElement | null) => {
      if (!video) return;
      video.play().catch(() => {});
    };

    // Cierre del relevo: recién aquí se cambia la opacidad. El saliente sigue
    // pintando durante el fundido y luego se pausa y se rebobina.
    const commitCrossfade = (next: number) => {
      activeIdxRef.current = next;
      setActiveIdx(next);
      switchingRef.current = false;
      incomingRef.current = null;
      armedRef.current = null;
      setArmedIdx(null);

      if (crossfadeTimerRef.current !== null) window.clearTimeout(crossfadeTimerRef.current);
      crossfadeTimerRef.current = window.setTimeout(() => {
        crossfadeTimerRef.current = null;
        const outgoing = videoRefs.current[1 - next];
        if (outgoing) {
          outgoing.pause();
          outgoing.currentTime = 0;
        }
      }, CROSSFADE_MS);
    };

    // `ended` del activo: arranca el siguiente sin tocar todavía la opacidad.
    const advance = (idx: number) => {
      if (idx !== activeIdxRef.current || switchingRef.current) return;

      const next = 1 - idx;

      // Si el siguiente ya falló, se repite el clip sano (nunca negro).
      if (failedRef.current.has(next)) {
        const current = videoRefs.current[idx];
        if (current) {
          current.currentTime = 0;
          requestPlay(current);
        }
        return;
      }

      const incoming = videoRefs.current[next];
      if (!incoming) return;
      switchingRef.current = true;
      incomingRef.current = next;
      incoming.currentTime = 0;
      incoming.play().catch(() => {
        // Si el navegador rechaza el arranque, se completa el cruce igual:
        // el poster del entrante cubre cualquier hueco.
        if (switchingRef.current && incomingRef.current === next) commitCrossfade(next);
      });
    };

    // El fundido solo empieza cuando el entrante está realmente emitiendo.
    const handlePlaying = (idx: number) => {
      if (!switchingRef.current || incomingRef.current !== idx) return;
      commitCrossfade(idx);
    };

    // Armado: a mitad del clip activo se habilita el buffer del siguiente.
    const handleTimeUpdate = (idx: number) => {
      if (idx !== activeIdxRef.current || switchingRef.current) return;
      const next = 1 - idx;
      if (armedRef.current === next) return;
      const video = videoRefs.current[idx];
      if (!video) return;
      const { duration, currentTime } = video;
      if (!Number.isFinite(duration) || duration <= 0) return;
      if (currentTime < duration * 0.5) return;
      armedRef.current = next;
      setArmedIdx(next);
    };

    // Fallo de red: el clip caído pasa a su poster y la secuencia sigue con el sano.
    const handleError = (idx: number) => {
      if (failedRef.current.has(idx)) return;
      const nextFailed = new Set(failedRef.current);
      nextFailed.add(idx);
      failedRef.current = nextFailed;
      setFailedIdx(nextFailed);

      if (idx === activeIdxRef.current && !switchingRef.current) {
        // Cayó el activo: se promueve el otro clip si sigue sano.
        const other = 1 - idx;
        if (failedRef.current.has(other)) return;
        const incoming = videoRefs.current[other];
        if (!incoming) return;
        switchingRef.current = true;
        incomingRef.current = other;
        incoming.currentTime = 0;
        incoming.play().catch(() => {
          switchingRef.current = false;
          incomingRef.current = null;
        });
      } else if (switchingRef.current && incomingRef.current === idx) {
        // Cayó el entrante durante el relevo: se reanuda el saliente.
        switchingRef.current = false;
        incomingRef.current = null;
        const outgoing = videoRefs.current[activeIdxRef.current];
        if (outgoing) {
          outgoing.currentTime = 0;
          requestPlay(outgoing);
        }
      }
    };

    // Pausa/reanudación: pestaña visible Y hero al menos al 20% en pantalla.
    const applyPlayback = () => {
      const all = videoRefs.current.filter((v): v is HTMLVideoElement => v !== null);
      if (!shouldPlayRef.current) {
        all.forEach((video) => video.pause());
        return;
      }
      requestPlay(videoRefs.current[activeIdxRef.current]);
      if (switchingRef.current && incomingRef.current !== null) {
        requestPlay(videoRefs.current[incomingRef.current]);
      }
    };

    let inView = true;
    const syncPlayback = () => {
      shouldPlayRef.current = inView && document.visibilityState !== "hidden";
      applyPlayback();
    };

    const handleVisibility = () => syncPlayback();

    const observer = section
      ? new IntersectionObserver(
          (entries) => {
            const entry = entries[entries.length - 1];
            inView = entry.intersectionRatio >= 0.2;
            syncPlayback();
          },
          { threshold: 0.2 }
        )
      : null;
    if (observer && section) observer.observe(section);

    const onTimeUpdate = videos.map((_, idx) => () => handleTimeUpdate(idx));
    const onEnded = videos.map((_, idx) => () => advance(idx));
    const onPlaying = videos.map((_, idx) => () => handlePlaying(idx));
    const onError = videos.map((_, idx) => () => handleError(idx));

    videos.forEach((video, idx) => {
      if (!video) return;
      video.addEventListener("timeupdate", onTimeUpdate[idx]);
      video.addEventListener("ended", onEnded[idx]);
      video.addEventListener("playing", onPlaying[idx]);
      video.addEventListener("error", onError[idx]);
      if (video.error) handleError(idx); // error ocurrido antes de suscribir
    });

    document.addEventListener("visibilitychange", handleVisibility);
    syncPlayback();

    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      videos.forEach((video, idx) => {
        if (!video) return;
        video.removeEventListener("timeupdate", onTimeUpdate[idx]);
        video.removeEventListener("ended", onEnded[idx]);
        video.removeEventListener("playing", onPlaying[idx]);
        video.removeEventListener("error", onError[idx]);
      });
      if (crossfadeTimerRef.current !== null) {
        window.clearTimeout(crossfadeTimerRef.current);
        crossfadeTimerRef.current = null;
      }
      switchingRef.current = false;
      incomingRef.current = null;
    };
  }, [reduceMotion]);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
  };
  const item = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
  };

  return (
    <section
      ref={sectionRef}
      className="relative flex h-[86vh] max-h-[940px] min-h-[600px] w-full flex-col overflow-hidden bg-zoa-slate"
    >

      {/* ── Fondo: dos clips Cloudinary en secuencia + dos capas alfa del MISMO slate ── */}
      <div aria-hidden="true" className="absolute inset-0 z-0">
        {reduceMotion ? (
          <Image
            src={HERO_CLIPS[0].poster}
            alt="Zoa — moda femenina de colección"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        ) : (
          HERO_CLIPS.map((clip, i) => {
            const isActive = i === activeIdx;
            const layerClass = `absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-400 ease-[var(--ease-out-expo)] ${
              isActive ? "z-10 opacity-100" : "z-0 opacity-0"
            }`;

            // Red de seguridad: si el clip falla, su poster queda como capa estática.
            if (failedIdx.has(i)) {
              return (
                <Image
                  key={clip.id}
                  src={clip.poster}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className={layerClass}
                />
              );
            }

            return (
              <video
                key={clip.id}
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                className={layerClass}
                autoPlay={i === 0}
                muted
                loop={false}
                controls={false}
                playsInline
                preload={isActive || i === armedIdx ? "auto" : "metadata"}
                poster={clip.poster}
                disablePictureInPicture
                disableRemotePlayback
              >
                <source src={clip.src960} type="video/mp4" media="(max-width: 767px)" />
                <source src={clip.src1440} type="video/mp4" />
              </video>
            );
          })
        )}

        {/* Capa 1 — velo plano al 30% sobre toda la escena */}
        <div aria-hidden className="absolute inset-0 z-20 bg-[rgba(43,60,66,0.30)]" />

        {/* Capa 2 — refuerzo al 55% en la mitad inferior, difuminado con máscara
            (misma tinta slate; sin degradados de color) */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 z-20 h-[64%] bg-[rgba(43,60,66,0.55)]"
          style={{
            maskImage: "linear-gradient(to top, #000 58%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to top, #000 58%, transparent 100%)",
          }}
        />
      </div>

      {/* ── Raíl vertical izquierdo ── */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
        className="absolute left-1.5 top-1/2 z-10 hidden -translate-y-1/2 items-center gap-3 md:flex xl:left-8"
        aria-hidden="true"
      >
        <span className="h-20 w-px bg-zoa-line-inverse" />
        <span className="vertical-rl font-sans text-[10px] uppercase tracking-[0.32em] text-zoa-slate-inverse-60">
          01 — Colección 2026
        </span>
      </motion.div>

      {/* ── Composición asimétrica: titular XL abajo-izquierda / copy abajo-derecha ── */}
      <div className="relative z-10 flex flex-1 items-end pt-32">
        <div className="container-zoa w-full pb-10 md:pb-16">
          <motion.div
            variants={container}
            initial={reduceMotion ? false : "hidden"}
            animate="show"
            className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-12 md:items-end"
          >
            {/* Titular */}
            <div className="md:col-span-7">
              <motion.div variants={item} aria-hidden className="h-px w-full bg-zoa-line-inverse" />
              <motion.h1
                variants={item}
                className="mt-6 text-balance font-sans text-[clamp(3rem,11vw,9.5rem)] font-light uppercase leading-[0.86] tracking-[-0.035em] text-zoa-surface"
              >
                Destaca
                <br />
                con estilo
              </motion.h1>
            </div>

            {/* Copy + CTAs */}
            <motion.div variants={item} className="md:col-span-5 md:pb-3 md:pl-4">
              <p className="max-w-sm font-sans text-[clamp(1rem,1.35vw,1.3rem)] leading-[1.6] text-zoa-slate-inverse-60">
                Piezas diseñadas para mujeres que marcan tendencia. Editorial, atemporal, hecha para ti.
              </p>
              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Button href="/tienda" variant="primary">
                  Ver productos
                </Button>
                <Button href="#colecciones" variant="ghost-inverse">
                  Nueva colección
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ── Indicador de scroll hairline ── */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.6, ease: EASE }}
        className="absolute bottom-[5.5rem] right-5 z-10 hidden items-center gap-3 md:flex xl:right-8"
        aria-hidden="true"
      >
        <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-zoa-slate-inverse-60">
          Scroll
        </span>
        <ArrowDown size={13} strokeWidth={1.2} className="text-zoa-slate-inverse-60" />
      </motion.div>

      {/* ── Barra puente de 3 columnas hairline (enlaza con el marquee) ── */}
      <div className="relative z-10 hairline-inverse-t flex-none">
        <div className="container-zoa">
          <ul className="m-0 grid list-none grid-cols-1 p-0 sm:grid-cols-3">
            {BRIDGE.map((label, i) => (
              <li
                key={label}
                className={`flex min-h-14 list-none items-center gap-3 border-t border-zoa-line-inverse py-3 first:border-t-0 sm:border-t-0 sm:py-0 ${
                  i > 0 ? "sm:border-l sm:border-zoa-line-inverse sm:pl-6" : ""
                }`}
              >
                <span aria-hidden className="h-3 w-px bg-zoa-line-inverse-35" />
                <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-zoa-slate-inverse-60">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
