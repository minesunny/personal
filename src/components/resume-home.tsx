"use client";

import * as React from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "motion/react";

import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number";
import { getLocaleLabel, locales, type Locale } from "@/i18n/config";
import type { ResumeData } from "@/types/resume";

interface ResumeHomeProps {
  data: ResumeData;
  locale: Locale;
}

interface PanelTheme {
  background: string;
  orbA: string;
  orbB: string;
  orbC: string;
}

type Direction = 1 | -1;

interface SwitchMeta {
  direction: Direction;
  duration: number;
  distance: number;
  blur: number;
}

const WHEEL_THRESHOLD = 48;
const SWITCH_LOCK_MIN_MS = 520;

const DEFAULT_SWITCH_META: SwitchMeta = {
  direction: 1,
  duration: 0.8,
  distance: 140,
  blur: 12,
};

const stagedEase = [0.22, 1, 0.36, 1] as const;

const stagedContainer: Variants = {
  hidden: {
    opacity: 1,
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

const stagedItem: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    filter: "blur(8px)",
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.56,
      ease: stagedEase,
    },
  },
};

function buildSwitchMeta(direction: Direction, intensity: number): SwitchMeta {
  const normalized = Math.min(Math.max(intensity, WHEEL_THRESHOLD) / 360, 1);

  return {
    direction,
    duration: 0.94 - normalized * 0.3,
    distance: 120 + normalized * 92,
    blur: 10 + normalized * 8,
  };
}

const PANEL_THEMES: PanelTheme[] = [
  {
    background:
      "radial-gradient(130% 120% at 12% 14%, #dbeafe 0%, #e0f2fe 30%, #eff6ff 60%, #f8fafc 100%)",
    orbA: "rgba(56, 189, 248, 0.48)",
    orbB: "rgba(59, 130, 246, 0.34)",
    orbC: "rgba(14, 116, 144, 0.3)",
  },
  {
    background:
      "radial-gradient(120% 130% at 18% 10%, #ffedd5 0%, #fee2e2 32%, #fef3c7 62%, #fff7ed 100%)",
    orbA: "rgba(251, 146, 60, 0.5)",
    orbB: "rgba(244, 114, 182, 0.34)",
    orbC: "rgba(234, 88, 12, 0.28)",
  },
  {
    background:
      "radial-gradient(125% 120% at 10% 10%, #dcfce7 0%, #d1fae5 28%, #dbeafe 62%, #eff6ff 100%)",
    orbA: "rgba(16, 185, 129, 0.5)",
    orbB: "rgba(6, 182, 212, 0.34)",
    orbC: "rgba(79, 70, 229, 0.3)",
  },
];

const panelVariants = {
  enter: (meta: SwitchMeta) => ({
    opacity: 0,
    y: meta.direction > 0 ? meta.distance : -meta.distance,
    scale: 0.86,
    rotateX: meta.direction > 0 ? 8 : -8,
    rotateY: meta.direction > 0 ? -5 : 5,
    filter: `blur(${meta.blur}px)`,
  }),
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    rotateY: 0,
    filter: "blur(0px)",
  },
  exit: (meta: SwitchMeta) => ({
    opacity: 0,
    y: meta.direction > 0 ? -meta.distance * 0.95 : meta.distance * 0.95,
    scale: 0.86,
    rotateX: meta.direction > 0 ? -7 : 7,
    rotateY: meta.direction > 0 ? 5 : -5,
    filter: `blur(${meta.blur}px)`,
  }),
};

export function ResumeHome({ data, locale }: ResumeHomeProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [switchMeta, setSwitchMeta] = React.useState<SwitchMeta>(
    DEFAULT_SWITCH_META
  );
  const deltaRef = React.useRef(0);
  const lockRef = React.useRef(false);
  const unlockTimerRef = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);
  const sectionLabels = data.ui.sectionLabels;
  const maxIndex = sectionLabels.length - 1;

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothPointerX = useSpring(pointerX, { stiffness: 120, damping: 22, mass: 0.45 });
  const smoothPointerY = useSpring(pointerY, { stiffness: 120, damping: 22, mass: 0.45 });
  const tiltX = useTransform(smoothPointerY, [-1, 1], [4.5, -4.5]);
  const tiltY = useTransform(smoothPointerX, [-1, 1], [-6, 6]);
  const rollZ = useTransform(smoothPointerX, [-1, 1], [-1.8, 1.8]);
  const depthScale = useTransform(smoothPointerY, [-1, 1], [1.012, 0.992]);
  const panelX = useTransform(smoothPointerX, [-1, 1], [-14, 14]);
  const panelY = useTransform(smoothPointerY, [-1, 1], [-10, 10]);

  const lockSwitch = React.useCallback((duration: number) => {
    if (unlockTimerRef.current) {
      window.clearTimeout(unlockTimerRef.current);
    }
    lockRef.current = true;
    unlockTimerRef.current = window.setTimeout(() => {
      lockRef.current = false;
    }, Math.max(SWITCH_LOCK_MIN_MS, Math.round(duration * 880)));
  }, []);

  const changePanel = React.useCallback(
    (offset: Direction, intensity = 120) => {
      if (lockRef.current) return;

      setActiveIndex((prev) => {
        const next = Math.max(0, Math.min(maxIndex, prev + offset));
        if (next === prev) return prev;
        const nextMeta = buildSwitchMeta(offset, intensity);
        setSwitchMeta(nextMeta);
        lockSwitch(nextMeta.duration);
        return next;
      });
    },
    [lockSwitch, maxIndex]
  );

  const jumpTo = React.useCallback(
    (next: number) => {
      setActiveIndex((prev) => {
        if (next === prev || next < 0 || next > maxIndex) {
          return prev;
        }
        const nextDirection: Direction = next > prev ? 1 : -1;
        const nextMeta = buildSwitchMeta(nextDirection, 140);
        setSwitchMeta(nextMeta);
        lockSwitch(nextMeta.duration);
        return next;
      });
    },
    [lockSwitch, maxIndex]
  );

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, []);

  React.useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (lockRef.current) return;

      deltaRef.current += event.deltaY;
      if (Math.abs(deltaRef.current) < WHEEL_THRESHOLD) return;

      const wheelDirection: Direction = deltaRef.current > 0 ? 1 : -1;
      const intensity = Math.abs(deltaRef.current);
      deltaRef.current = 0;
      changePanel(wheelDirection, intensity);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        changePanel(1, 180);
      }

      if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        changePanel(-1, 180);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [changePanel]);

  React.useEffect(() => {
    return () => {
      if (unlockTimerRef.current) {
        window.clearTimeout(unlockTimerRef.current);
      }
    };
  }, []);

  const panels = React.useMemo(
    () => [
      <PersonalHomePanel key="home" data={data} title={sectionLabels[0]} />,
      <SocialLinksPanel
        key="social"
        data={data}
        title={sectionLabels[1]}
        description={data.ui.socialPanelDescription}
      />,
      <PersonalWebsitesPanel
        key="website"
        data={data}
        title={sectionLabels[2]}
        description={data.ui.websitesPanelDescription}
      />,
    ],
    [data, sectionLabels]
  );

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startY = touchStartY.current;
    const endY = event.changedTouches[0]?.clientY;

    if (startY === null || endY === undefined) return;

    const delta = startY - endY;
    if (Math.abs(delta) < 60) return;

    changePanel(delta > 0 ? 1 : -1, Math.abs(delta) * 1.8);
    touchStartY.current = null;
  };

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const normalizedX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const normalizedY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    pointerX.set(normalizedX);
    pointerY.set(normalizedY);
  };

  const onMouseLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const activeTheme = PANEL_THEMES[activeIndex] ?? PANEL_THEMES[0];

  return (
    <div
      className="relative h-screen overflow-hidden text-slate-900"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <BackdropScene
        activeIndex={activeIndex}
        direction={switchMeta.direction}
        theme={activeTheme}
        pointerX={smoothPointerX}
        pointerY={smoothPointerY}
        duration={switchMeta.duration}
      />
      <SpotlightSweep
        activeIndex={activeIndex}
        direction={switchMeta.direction}
        duration={switchMeta.duration}
      />
      <DepthStack
        activeIndex={activeIndex}
        pointerX={smoothPointerX}
        pointerY={smoothPointerY}
        duration={switchMeta.duration}
      />

      <header className="absolute left-0 right-0 top-4 z-30 mx-auto flex w-[95vw] max-w-5xl items-center justify-between rounded-full border border-white/70 bg-white/68 px-3 py-2 backdrop-blur-xl md:top-6 md:px-4">
        <nav className="flex items-center gap-1 md:gap-2">
          {sectionLabels.map((label, index) => (
            <button
              key={label}
              onClick={() => jumpTo(index)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition md:text-sm ${
                activeIndex === index
                  ? "bg-slate-900 text-white shadow-[0_10px_24px_-16px_rgba(15,23,42,0.8)]"
                  : "text-slate-600 hover:bg-white/70"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-1 rounded-full bg-slate-100/85 p-1 backdrop-blur">
          {locales.map((value) => (
            <Link
              key={value}
              href={`/${value}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                value === locale
                  ? "bg-slate-900 text-white shadow-[0_10px_20px_-14px_rgba(15,23,42,0.9)]"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              {getLocaleLabel(value)}
            </Link>
          ))}
        </div>
      </header>

      <SideRail
        labels={sectionLabels}
        activeIndex={activeIndex}
        onSelect={jumpTo}
      />

      <main className="relative z-10 flex h-full items-center justify-center px-4 pb-10 pt-[4.5rem] sm:px-8 md:pt-24">
        <motion.div
          className="w-full max-w-5xl [perspective:2200px]"
          style={{ x: panelX, y: panelY }}
        >
          <AnimatePresence initial={false} custom={switchMeta} mode="wait">
            <motion.section
              key={activeIndex}
              custom={switchMeta}
              variants={panelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: switchMeta.duration,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                rotateX: tiltX,
                rotateY: tiltY,
                rotateZ: rollZ,
                scale: depthScale,
                transformStyle: "preserve-3d",
              }}
              className="w-full"
            >
              {panels[activeIndex]}
            </motion.section>
          </AnimatePresence>
        </motion.div>
      </main>

      <footer className="pointer-events-none absolute bottom-10 left-0 right-0 z-20 mx-auto flex w-fit items-center gap-3 rounded-full border border-white/20 bg-slate-900/88 px-4 py-1.5 text-xs font-medium text-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.9)] md:bottom-12">
        <span>{data.ui.scrollHint}</span>
        <span className="text-slate-300">•</span>
        <span>
          {activeIndex + 1} / {sectionLabels.length}
        </span>
      </footer>

      <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center px-4 md:bottom-4">
        {data.site.filing.url ? (
          <a
            href={data.site.filing.url}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-full border border-white/45 bg-white/65 px-3 py-1 text-center text-[11px] font-medium text-slate-600 backdrop-blur hover:bg-white/82 hover:text-slate-900"
          >
            {data.site.filing.text}
          </a>
        ) : (
          <span className="rounded-full border border-white/45 bg-white/65 px-3 py-1 text-center text-[11px] font-medium text-slate-600 backdrop-blur">
            {data.site.filing.text}
          </span>
        )}
      </div>
    </div>
  );
}

function BackdropScene({
  activeIndex,
  direction,
  theme,
  pointerX,
  pointerY,
  duration,
}: {
  activeIndex: number;
  direction: Direction;
  theme: PanelTheme;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  duration: number;
}) {
  const orbFrontX = useTransform(pointerX, (value) => value * 34);
  const orbFrontY = useTransform(pointerY, (value) => value * 24);
  const orbMidX = useTransform(pointerX, (value) => value * -22);
  const orbMidY = useTransform(pointerY, (value) => value * -16);
  const orbBackX = useTransform(pointerX, (value) => value * 14);
  const orbBackY = useTransform(pointerY, (value) => value * -10);
  const sheenX = useTransform(pointerX, (value) => value * -28);
  const sheenY = useTransform(pointerY, (value) => value * -10);
  const bandX = useTransform(pointerX, (value) => value * 18);
  const bandY = useTransform(pointerY, (value) => value * 8);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={`bg-${activeIndex}`}
          custom={direction}
          className="absolute inset-0"
          style={{ background: theme.background }}
          initial={{ opacity: 0, scale: 1.09, x: direction > 0 ? 80 : -80 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.95, x: direction > 0 ? -60 : 60 }}
          transition={{ duration: duration + 0.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </AnimatePresence>

      <motion.div
        className="absolute left-[-6%] top-[34%] h-[28%] w-[112%] blur-3xl"
        style={{
          x: bandX,
          y: bandY,
          background:
            "linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.56) 52%, rgba(255,255,255,0) 100%)",
        }}
        animate={{ opacity: [0.08, 0.24, 0.08], scale: [1, 1.03, 1] }}
        transition={{
          duration: 7.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -top-24 left-[6%] h-[28rem] w-[28rem] rounded-full blur-[108px]"
        style={{ background: theme.orbA, x: orbFrontX, y: orbFrontY }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-[7.5rem] right-[10%] h-[26rem] w-[26rem] rounded-full blur-[120px]"
        style={{ background: theme.orbB, x: orbMidX, y: orbMidY }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.78, 0.98, 0.78] }}
        transition={{ duration: 9.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[28%] right-[32%] h-72 w-72 rounded-full blur-[100px]"
        style={{ background: theme.orbC, x: orbBackX, y: orbBackY }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.74, 0.95, 0.74] }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-0 opacity-70"
        style={{
          x: sheenX,
          y: sheenY,
          background:
            "linear-gradient(110deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0) 44%, rgba(255,255,255,0.42) 100%)",
        }}
      />
      <div className="absolute inset-0 opacity-[0.09] [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.34)_1px,transparent_0)] [background-size:24px_24px]" />
    </div>
  );
}

function SpotlightSweep({
  activeIndex,
  direction,
  duration,
}: {
  activeIndex: number;
  direction: Direction;
  duration: number;
}) {
  return (
    <AnimatePresence initial={false} custom={direction} mode="wait">
      <motion.div
        key={`spotlight-${activeIndex}`}
        className="pointer-events-none absolute inset-0 z-[7] overflow-hidden"
        custom={direction}
      >
        <motion.div
          className="absolute -left-[40%] top-[-24%] h-[160%] w-[40%] rotate-[14deg] blur-2xl"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.58) 50%, rgba(255,255,255,0) 100%)",
          }}
          initial={{ x: "-12%", opacity: 0 }}
          animate={{ x: "260%", opacity: [0, 0.5, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration + 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.div>
    </AnimatePresence>
  );
}

function DepthStack({
  activeIndex,
  pointerX,
  pointerY,
  duration,
}: {
  activeIndex: number;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  duration: number;
}) {
  const farX = useTransform(pointerX, (value) => value * -9);
  const farY = useTransform(pointerY, (value) => value * -7);
  const midX = useTransform(pointerX, (value) => value * -6);
  const midY = useTransform(pointerY, (value) => value * -4);

  return (
    <div className="pointer-events-none absolute inset-0 z-[8] flex items-center justify-center px-4 pb-10 pt-[4.5rem] sm:px-8 md:pt-24">
      <motion.div
        className="absolute h-[68vh] w-full max-w-5xl rounded-[2rem] border border-white/32 bg-white/24 backdrop-blur-[2px]"
        style={{ x: farX, y: farY }}
        animate={{
          scale: 0.9,
          opacity: 0.24,
          rotateZ: activeIndex === 1 ? -0.8 : 0.8,
        }}
        transition={{ duration: duration + 0.08, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute h-[72vh] w-full max-w-5xl rounded-[2.1rem] border border-white/42 bg-white/30 backdrop-blur-[3px]"
        style={{ x: midX, y: midY }}
        animate={{
          scale: 0.94,
          opacity: 0.3,
          rotateZ: activeIndex === 2 ? 0.6 : -0.6,
        }}
        transition={{ duration: duration + 0.08, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

function SideRail({
  labels,
  activeIndex,
  onSelect,
}: {
  labels: [string, string, string];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <aside className="absolute right-4 top-1/2 z-30 hidden -translate-y-1/2 md:block">
      <div className="relative flex flex-col gap-2 rounded-full border border-white/55 bg-white/62 p-2 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.85)] backdrop-blur-xl">
        <motion.div
          className="absolute left-2 right-2 h-5 rounded-full bg-slate-900/90"
          animate={{ y: activeIndex * 28 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        />
        {labels.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(index)}
            title={label}
            className="relative z-10 h-5 w-5 rounded-full"
          >
            <span
              className={`mx-auto block h-1.5 w-1.5 rounded-full transition ${
                activeIndex === index ? "bg-white" : "bg-slate-500"
              }`}
            />
          </button>
        ))}
      </div>
    </aside>
  );
}

function PanelShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="relative overflow-hidden rounded-[2.2rem] border border-white/75 bg-white/70 p-6 shadow-[0_40px_90px_-46px_rgba(15,23,42,0.78)] backdrop-blur-xl md:p-10">
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.45, 0.62, 0.45], scale: [1, 1.02, 1] }}
        transition={{ duration: 9, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(120% 80% at 15% 12%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 55%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-[2.2rem] border border-white/55" />

      <div className="relative">
        <motion.div
          key={`${title}-${description}`}
          variants={stagedContainer}
          initial="hidden"
          animate="show"
        >
          <motion.header variants={stagedItem}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              {title}
            </p>
            <h2 className="mt-4 text-2xl font-bold text-slate-900 md:text-4xl">
              {description}
            </h2>
          </motion.header>
          <motion.div className="mt-6" variants={stagedItem}>
            {children}
          </motion.div>
        </motion.div>
      </div>
    </article>
  );
}

function PersonalHomePanel({
  data,
  title,
}: {
  data: ResumeData;
  title: string;
}) {
  return (
    <PanelShell title={title} description={data.profile.name}>
      <motion.div
        variants={stagedContainer}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        <motion.p variants={stagedItem} className="text-sm leading-7 text-slate-600 md:text-base">
          {data.profile.role} · {data.profile.location}
        </motion.p>
        <motion.p
          variants={stagedItem}
          className="max-w-3xl text-sm leading-7 text-slate-600 md:text-base"
        >
          {data.profile.summary}
        </motion.p>
        <motion.ul
          variants={stagedItem}
          className="grid gap-2 text-sm text-slate-600 md:grid-cols-2"
        >
          {data.profile.highlights.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
              <span>{item}</span>
            </li>
          ))}
        </motion.ul>
        <motion.div
          variants={stagedContainer}
          className="grid gap-3 sm:grid-cols-3"
        >
          {data.profile.stats.map((stat) => (
            <motion.article
              key={stat.label}
              variants={stagedItem}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.24 }}
              className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.8)]"
            >
              <p className="flex items-end text-3xl font-bold text-slate-900">
                <CountingNumber
                  number={stat.value}
                  fromNumber={0}
                  inView
                  inViewOnce
                  className="leading-none"
                />
                <span className="ml-1 text-lg text-sky-700">{stat.suffix}</span>
              </p>
              <p className="mt-2 text-xs text-slate-500 md:text-sm">{stat.label}</p>
            </motion.article>
          ))}
        </motion.div>
        <motion.a
          variants={stagedItem}
          href={`mailto:${data.profile.email}`}
          className="inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_26px_-20px_rgba(15,23,42,0.95)] transition hover:-translate-y-0.5 hover:bg-slate-700"
        >
          {data.profile.email}
        </motion.a>
      </motion.div>
    </PanelShell>
  );
}

function SocialLinksPanel({
  data,
  title,
  description,
}: {
  data: ResumeData;
  title: string;
  description: string;
}) {
  return (
    <PanelShell title={title} description={description}>
      <motion.div
        variants={stagedContainer}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {data.socials.map((social) => (
          <motion.a
            key={social.url}
            variants={stagedItem}
            href={social.url}
            target="_blank"
            rel="noreferrer noopener"
            whileHover={{ y: -6, scale: 1.015 }}
            transition={{ duration: 0.22 }}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_34px_-26px_rgba(15,23,42,0.85)]"
          >
            <p className="text-lg font-semibold text-slate-900">{social.name}</p>
            <p className="mt-1 text-xs font-medium text-sky-700">{social.handle}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{social.description}</p>
          </motion.a>
        ))}
      </motion.div>
    </PanelShell>
  );
}

function PersonalWebsitesPanel({
  data,
  title,
  description,
}: {
  data: ResumeData;
  title: string;
  description: string;
}) {
  return (
    <PanelShell title={title} description={description}>
      <motion.div
        variants={stagedContainer}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {data.websites.map((website) => (
          <motion.article
            key={website.url}
            variants={stagedItem}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ duration: 0.22 }}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_34px_-26px_rgba(15,23,42,0.85)]"
          >
            <a
              href={website.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-lg font-semibold text-slate-900 underline-offset-4 hover:underline"
            >
              {website.name}
            </a>
            <p className="mt-3 text-sm leading-6 text-slate-600">{website.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {website.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.article>
        ))}
      </motion.div>
    </PanelShell>
  );
}
