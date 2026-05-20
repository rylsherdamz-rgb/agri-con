"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { ArrowRight, Leaf, Satellite, Shield, Sprout } from "lucide-react";

gsap.registerPlugin(useGSAP);

const COUNTER_TARGETS = {
  parcels: 1247,
  usdc: 856000,
  attestations: 389,
};

function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function useCountUp(end: number, duration: number, started: boolean) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (!started) return;
    startTime.current = performance.now();
    const initial = 0;

    function tick(now: number) {
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      setValue(Math.round(initial + (end - initial) * easeOutExpo(progress)));
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      }
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [end, duration, started]);

  return value;
}

function StatCounter({
  end,
  label,
  prefix,
  suffix,
  started,
}: {
  end: number;
  label: string;
  prefix?: string;
  suffix?: string;
  started: boolean;
}) {
  const value = useCountUp(end, 2.5, started);
  const formatted = prefix
    ? `${prefix}${value.toLocaleString()}`
    : suffix
      ? `${value.toLocaleString()}${suffix}`
      : value.toLocaleString();

  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-bold tabular-nums text-emerald-900 sm:text-3xl lg:text-4xl">
        {formatted}
      </span>
      <span className="mt-1 text-xs font-medium uppercase tracking-widest text-stone-500">
        {label}
      </span>
    </div>
  );
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = 0;
    let h = 0;

    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];
    const COUNT = 50;

    function resize() {
      w = canvas!.width = canvas!.offsetWidth;
      h = canvas!.height = canvas!.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.6) * 0.5 - 0.1,
        r: Math.random() * 3 + 1,
        a: Math.random() * 0.3 + 0.05,
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) {
          p.y = -10;
          p.x = Math.random() * w;
        }
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(22,163,74,${p.a})`;
        ctx!.fill();
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />;
}

export default function HeroComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const countersRef = useRef<HTMLDivElement>(null);
  const [countersStarted, setCountersStarted] = useState(false);

  const startCounters = useCallback(() => {
    setCountersStarted(true);
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: "(min-width: 1024px)",
          isTablet: "(min-width: 640px) and (max-width: 1023px)",
          isMobile: "(max-width: 639px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const { reduceMotion } = ctx.conditions!;
          const dur = reduceMotion ? 0.1 : 0.8;

          gsap.fromTo(
            ".hero-badge",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: dur, ease: "power3.out" },
          );

          gsap.fromTo(
            ".hero-headline-word",
            { opacity: 0, y: 40, rotationX: -20 },
            {
              opacity: 1,
              y: 0,
              rotationX: 0,
              duration: dur * 1.2,
              stagger: reduceMotion ? 0 : 0.12,
              ease: "power3.out",
              delay: 0.2,
            },
          );

          gsap.fromTo(
            ".hero-subtitle",
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: dur, ease: "power2.out", delay: 0.7 },
          );

          gsap.fromTo(
            ".hero-cta",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: dur, stagger: 0.1, ease: "back.out(1.4)", delay: 0.9 },
          );

          gsap.fromTo(
            ".hero-feature-card",
            { opacity: 0, y: 30, scale: 0.95 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: dur,
              stagger: reduceMotion ? 0 : 0.15,
              ease: "power2.out",
              delay: 1.1,
            },
          );

          const trigger = gsap.fromTo(
            ".hero-stats",
            { opacity: 0.5, scale: 0.8 },
            {
              opacity: 1,
              scale: 1,
              duration: reduceMotion ? 0 : 1,
              ease: "power3.out",
              paused: true,
              onStart: startCounters,
            },
          );

          gsap.to(trigger, {
            scrollTrigger: {
              trigger: countersRef.current,
              start: "top 85%",
              onEnter: () => trigger.play(),
            },
          });

          return () => {
            trigger.kill();
          };
        },
        containerRef,
      );
    },
    { scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden bg-gradient-to-b from-lime-50/60 via-emerald-50/30 to-stone-50 pb-16 pt-10 sm:pb-20 sm:pt-16 lg:pb-28 lg:pt-20"
    >
      <ParticleCanvas />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <div className="hero-badge mb-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-800 backdrop-blur-sm">
            <Satellite size={14} />
            Powered by Copernicus Sentinel-2
          </span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-center font-display text-3xl font-bold leading-tight tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
          <span className="hero-headline-word block sm:inline">Agricultural </span>
          <span className="hero-headline-word block sm:inline">Forward </span>
          <span className="hero-headline-word block sm:inline">Contracts, </span>
          <span className="hero-headline-word block sm:inline text-emerald-800">
            Verified by
          </span>{" "}
          <span className="hero-headline-word block sm:inline text-emerald-800">Satellite</span>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle mx-auto mt-5 max-w-2xl text-center text-sm leading-relaxed text-stone-500 sm:text-base">
          Buy and sell crop yields before harvest on Stellar. Every parcel is verified by
          Copernicus NDVI analysis — real satellite data, not paperwork.
        </p>

        {/* CTAs */}
        <div className="hero-cta mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-800 hover:shadow-emerald-900/30 active:scale-[0.98]"
          >
            Explore Marketplace
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-800 active:scale-[0.98]"
          >
            Verify a Parcel
            <Satellite size={16} />
          </Link>
        </div>

        {/* Feature cards */}
        <div className="hero-feature-card mt-14 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Sprout,
              title: "Tokenized Crops",
              desc: "Every crop lot is a verifiable NFT on Stellar Soroban with full provenance.",
            },
            {
              icon: Satellite,
              title: "Satellite Verification",
              desc: "Copernicus Sentinel-2 NDVI analysis gates buyability with real vegetation data.",
            },
            {
              icon: Shield,
              title: "Smart Escrow",
              desc: "USDC payments held in escrow. 70% on delivery, 20% upfront, 10% to farmer aid pool.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-stone-200/70 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition hover:border-emerald-200 hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <Icon size={20} />
              </div>
              <h3 className="text-sm font-bold text-stone-900">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">{desc}</p>
            </div>
          ))}
        </div>

        {/* Stats counter section */}
        <div ref={countersRef} className="hero-stats mt-16 sm:mt-20">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-12 gap-y-6 rounded-3xl border border-stone-200/60 bg-white/60 px-6 py-8 backdrop-blur-sm sm:gap-x-20 sm:py-10">
            <StatCounter
              end={COUNTER_TARGETS.parcels}
              label="Parcels Verified"
              suffix="+"
              started={countersStarted}
            />
            <StatCounter
              end={COUNTER_TARGETS.usdc}
              label="USDC in Escrow"
              prefix="$"
              started={countersStarted}
            />
            <StatCounter
              end={COUNTER_TARGETS.attestations}
              label="Satellite Attestations"
              suffix="+"
              started={countersStarted}
            />
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Leaf size={16} className="text-emerald-600" />
              <span>On-Chain, Auditable, Transparent</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}