import React from "react";

/** EXIT-INTENT: desktop only (pointer: fine) */
export function useExitIntent() {
  const [fired, setFired] = React.useState(false);
  React.useEffect(() => {
    const fine = window.matchMedia?.("(pointer:fine)").matches;
    if (!fine) return;
    const onMouseOut = (e: MouseEvent) => {
      if (!fired && e.clientY <= 0) setFired(true);
    };
    window.addEventListener("mouseout", onMouseOut);
    return () => window.removeEventListener("mouseout", onMouseOut);
  }, [fired]);
  return fired;
}

/** Accumulates time only while `running` is true; returns `hit` once target reached (one-shot). */
export function useAccumulatedTimer(opts: { running: boolean; targetMs: number; stepMs?: number }) {
  const { running, targetMs, stepMs = 250 } = opts;
  const [hit, setHit] = React.useState(false);
  const elapsed = React.useRef(0);

  React.useEffect(() => {
    if (hit) return;
    const t = window.setInterval(() => {
      if (running) {
        elapsed.current += stepMs;
        if (elapsed.current >= targetMs) setHit(true);
      }
    }, stepMs);
    return () => window.clearInterval(t);
  }, [running, targetMs, stepMs, hit]);

  const reset = React.useCallback(() => { elapsed.current = 0; setHit(false); }, []);
  return { hit, reset, getElapsed: () => elapsed.current };
}

/** LocalStorage time caps */
export function hasSeenWithin(key: string) {
  const until = Number(localStorage.getItem(key) || 0);
  return Date.now() < until;
}
export function markSeenFor(key: string, msFromNow = 24 * 60 * 60 * 1000) {
  localStorage.setItem(key, String(Date.now() + msFromNow));
}

/** Checkout “reading idle”: no scroll/typing/input/change/submit for ms. Mouse move ignored. */
export function useIdleReading(ms = 30000, container?: HTMLElement | null) {
  const [idle, setIdle] = React.useState(false);
  React.useEffect(() => {
    let t: number;
    const reset = () => { setIdle(false); window.clearTimeout(t); t = window.setTimeout(() => setIdle(true), ms); };

    const winEvts: (keyof WindowEventMap)[] = ["scroll", "keydown", "wheel", "touchstart"];
    winEvts.forEach(e => window.addEventListener(e, reset, { passive: true }));
    if (container) {
      container.addEventListener("input", reset, true);
      container.addEventListener("change", reset, true);
      container.addEventListener("submit", reset, true);
    }
    reset();
    return () => {
      winEvts.forEach(e => window.removeEventListener(e, reset));
      if (container) {
        container.removeEventListener("input", reset, true);
        container.removeEventListener("change", reset, true);
        container.removeEventListener("submit", reset, true);
      }
    };
  }, [ms, container]);
  return idle;
}
