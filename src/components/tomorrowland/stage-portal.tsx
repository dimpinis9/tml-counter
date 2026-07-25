"use client";

import { Expand, Eye, Maximize2, MousePointer2, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { DepthPhoto } from "@/components/tomorrowland/depth-photo";
import {
  tomorrowlandBelgium2026,
  type TomorrowlandStage,
} from "@/lib/tomorrowland/stages";
import { cn } from "@/lib/utils";

export function StagePortal({ compact = false }: { compact?: boolean }) {
  const [selectedId, setSelectedId] = useState("mainstage");
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [immersive, setImmersive] = useState(false);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const motionEnabled = motionOverride ?? !prefersReducedMotion;
  const portalRef = useRef<HTMLDivElement>(null);
  const selected =
    tomorrowlandBelgium2026.stages.find((stage) => stage.id === selectedId) ??
    tomorrowlandBelgium2026.stages[0];

  useEffect(() => {
    if (!immersive) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setImmersive(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [immersive]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setImmersive(false);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!motionEnabled || event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const normalizedX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const normalizedY = (event.clientY - bounds.top) / bounds.height - 0.5;
    setRotation({ x: normalizedY * -12, y: normalizedX * 16 });
  }

  async function enterImmersive() {
    setImmersive(true);
    if (portalRef.current?.requestFullscreen) {
      try {
        await portalRef.current.requestFullscreen();
      } catch {
        // iOS Safari does not expose fullscreen for arbitrary elements.
      }
    }
  }

  async function leaveImmersive() {
    setImmersive(false);
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }

  return (
    <section
      className={cn(
        "relative min-w-0 overflow-hidden border border-primary/25 bg-[#061510] text-[#f8efd6] shadow-2xl shadow-black/20",
        compact
          ? "rounded-[1.5rem] p-3 sm:rounded-[2rem] sm:p-7"
          : "rounded-[1.5rem] p-3 sm:rounded-[2.5rem] sm:p-8 lg:p-10",
        immersive && "fixed inset-0 z-[100] h-[100dvh] rounded-none border-0 p-3 sm:p-8",
      )}
      ref={portalRef}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(216,173,91,.16),transparent_28rem),radial-gradient(circle_at_85%_75%,rgba(159,63,108,.22),transparent_30rem)]" />
      <div className="relative z-10 flex flex-col gap-4 sm:gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.25em] text-[#d8ad5b]">
              Official Belgium 2026 stages · Interactive field guide
            </p>
            <h2 className="mt-2 font-display text-[clamp(2.15rem,11vw,5rem)] leading-[.88]">
              Enter <em className="text-[#d8ad5b]">CONSCIENCIA</em>
            </h2>
            {!compact && (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#c7bda4]">
                Move across the portal to explore the verified stages of the
                2026 edition at De Schorre, Boom.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              aria-pressed={motionEnabled}
              className="min-h-11 border-white/15 bg-white/5 text-white hover:bg-white/10"
              onClick={() => setMotionOverride(!motionEnabled)}
              size="sm"
              variant="outline"
            >
              <MousePointer2 className="size-4" />
              Motion {motionEnabled ? "on" : "off"}
            </Button>
            {immersive ? (
              <Button className="min-h-11" onClick={() => void leaveImmersive()} size="sm">
                <X className="size-4" /> Exit
              </Button>
            ) : (
              <Button className="min-h-11" onClick={() => void enterImmersive()} size="sm">
                <Maximize2 className="size-4" /> Immerse
              </Button>
            )}
          </div>
        </header>

        <div
          className={cn(
            "grid min-h-0 min-w-0 gap-4",
            immersive
              ? "flex-1 grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-1"
              : "lg:grid-cols-[minmax(0,1fr)_19rem]",
          )}
        >
          <div
            className={cn(
              "stage-perspective relative aspect-[16/10] min-h-0 min-w-0 touch-pan-y overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/25 sm:aspect-video sm:rounded-[1.75rem]",
              immersive && "h-full min-h-0 aspect-auto",
            )}
            onPointerLeave={() => setRotation({ x: 0, y: 0 })}
            onPointerMove={handlePointerMove}
          >
            <StageWorld
              motionEnabled={motionEnabled}
              rotation={rotation}
              stage={selected}
            />
            <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between bg-gradient-to-t from-black/90 via-black/35 to-transparent p-3 pt-12 sm:p-7 sm:pt-20">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.24em] text-white/55">
                  Stage {tomorrowlandBelgium2026.stages.indexOf(selected) + 1}
                </p>
                <h3 className="mt-1 max-w-[80vw] font-display text-[clamp(1.35rem,6.5vw,3rem)] leading-none text-white">
                  {selected.name}
                </h3>
              </div>
              <Eye className="size-6 text-[#d8ad5b]" />
            </div>
          </div>

          <div className="min-h-0 min-w-0 max-w-full rounded-[1.25rem] border border-white/10 bg-white/[.035] p-2 sm:rounded-[1.5rem]">
            <div className="flex min-w-0 max-w-full snap-x snap-mandatory gap-2 overflow-x-auto overscroll-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:max-h-full lg:snap-none lg:flex-col lg:overflow-y-auto lg:pb-0">
              {tomorrowlandBelgium2026.stages.map((stage, index) => (
                <button
                  className={cn(
                    "flex min-h-16 w-[9.25rem] shrink-0 snap-start items-center gap-2 overflow-hidden rounded-xl px-2 text-left text-sm transition active:scale-[.98] lg:min-h-12 lg:w-full lg:gap-3 lg:px-3",
                    selected.id === stage.id
                      ? "bg-[#d8ad5b] text-[#102018]"
                      : "bg-white/[.035] text-white/70 hover:bg-white/[.08] hover:text-white",
                  )}
                  key={stage.id}
                  onClick={() => setSelectedId(stage.id)}
                  type="button"
                >
                  {stage.image ? (
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-white/10 lg:hidden">
                      <Image
                        alt=""
                        aria-hidden="true"
                        className="object-cover"
                        fill
                        sizes="44px"
                        src={stage.image.src}
                      />
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full lg:hidden"
                      style={{ background: stage.accent }}
                    />
                  )}
                  <span className="font-mono text-[10px] opacity-60">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate font-semibold">
                    {stage.shortName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <footer className="flex flex-col gap-2 text-[11px] text-[#a99f88] sm:flex-row sm:items-center sm:justify-between">
          <span>
            {tomorrowlandBelgium2026.location} ·{" "}
            {tomorrowlandBelgium2026.weekends.join(" · ")}
          </span>
          <a
            className="inline-flex min-h-11 items-center gap-2 text-[#d8ad5b] underline-offset-4 hover:underline"
            href={tomorrowlandBelgium2026.officialLineupUrl}
            rel="noreferrer"
            target="_blank"
          >
            Verify on the official timetable <Expand className="size-3.5" />
          </a>
        </footer>
      </div>
    </section>
  );
}

function subscribeToReducedMotion(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function StageWorld({
  stage,
  rotation,
  motionEnabled,
}: {
  stage: TomorrowlandStage;
  rotation: { x: number; y: number };
  motionEnabled: boolean;
}) {
  return (
    <div
      className={cn(
        "stage-world absolute inset-[8%] transition-transform duration-300 ease-out",
        stage.image && "stage-world-with-photo inset-0 sm:inset-[3%]",
        !motionEnabled && "stage-motion-paused",
      )}
      style={{
        "--stage-accent": stage.accent,
        "--stage-glow": stage.glow,
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
      } as React.CSSProperties}
    >
      {stage.image && (
        <div className="stage-photo">
          <Image
            alt=""
            aria-hidden="true"
            className="stage-photo-backdrop object-cover"
            fill
            priority={stage.id === "mainstage"}
            sizes="(max-width: 1024px) 92vw, 70vw"
            src={stage.image.src}
            style={{ objectPosition: stage.image.position }}
          />
          <Image
            alt={stage.image.alt}
            className="stage-photo-subject object-cover"
            fill
            priority={stage.id === "mainstage"}
            sizes="(max-width: 1024px) 92vw, 70vw"
            src={stage.image.src}
            style={{ objectPosition: stage.image.position }}
          />
          {stage.image.depthSrc && (
            <DepthPhoto
              depthSrc={stage.image.depthSrc}
              imageSrc={stage.image.src}
              label={stage.name}
              motionEnabled={motionEnabled}
              movement={{
                x: rotation.y / 8,
                y: rotation.x / -6,
              }}
            />
          )}
          <div className="stage-photo-grade" />
        </div>
      )}
      {!stage.image && (
        <>
          <div className="stage-orbit stage-orbit-one" />
          <div className="stage-orbit stage-orbit-two" />
          <div className="stage-wing stage-wing-left" />
          <div className="stage-wing stage-wing-right" />
          <div className="stage-tower stage-tower-left" />
          <div className="stage-tower stage-tower-right" />
          <div className="stage-core">
            <div className="festival-emblem grid size-24 place-items-center rounded-full border border-white/25 sm:size-32">
              <Sparkles className="size-10 text-white/85" />
            </div>
          </div>
        </>
      )}
      {Array.from({ length: 12 }, (_, index) => (
        <span
          className="stage-particle"
          key={index}
          style={{
            animationDelay: `${index * -0.37}s`,
            left: `${8 + ((index * 17) % 84)}%`,
            top: `${12 + ((index * 23) % 70)}%`,
          }}
        />
      ))}
    </div>
  );
}
