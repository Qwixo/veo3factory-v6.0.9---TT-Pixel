import React from "react";
import { Portal } from "./Portal";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function Modal({ open, onClose, title, children }: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  // Esc to close
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus trap + restore
  React.useEffect(() => {
    if (!open) return;
    const root = ref.current!;
    const prev = document.activeElement as HTMLElement | null;
    const q = () => Array.from(root.querySelectorAll<HTMLElement>(
      'a[href],button,textarea,input,select,[tabindex]:not([tabindex="-1"])'
    )).filter(n => !n.hasAttribute("disabled") && n.tabIndex !== -1);
    const nodes = q(); nodes[0]?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const list = q(); if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      const a = document.activeElement as HTMLElement | null;
      if (e.shiftKey) { if (a === first || !root.contains(a)) { last.focus(); e.preventDefault(); } }
      else { if (a === last) { first.focus(); e.preventDefault(); } }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); prev?.focus(); };
  }, [open]);

  if (!open) return null;

  return (
    <Portal>
      <div aria-hidden onClick={onClose}
        style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:9998, animation:"fade .18s ease forwards" }}
      />
      <div style={{ position:"fixed", inset:0, display:"grid", placeItems:"center", zIndex:9999, fontFamily:"inherit" }}>
        <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={title ? "modal-title" : undefined}
          style={{
            width:"min(620px, calc(100vw - 32px))", background:"#111", color:"#fff",
            border:"1px solid rgba(255,215,0,.35)", borderRadius:16, boxShadow:"0 20px 60px rgba(0,0,0,.55)",
            padding:"22px 22px 18px", animation:"pop .18s ease forwards", position:"relative"
          }}>
          {title && <h3 id="modal-title" style={{ margin:"0 0 8px", fontSize:22, fontWeight:800, color:"#FFD700" }}>{title}</h3>}
          <div style={{ fontSize:15, lineHeight:1.7 }}>{children}</div>

          <button onClick={onClose} aria-label="Close"
            style={{ position:"absolute", top:12, right:14, background:"transparent", color:"rgba(255,255,255,.65)",
                     border:"none", cursor:"pointer", fontSize:20, lineHeight:1 }}>×</button>
        </div>
      </div>
      <style>{`
        @keyframes pop { from { opacity:0; transform:translateY(8px) scale(.985) } to { opacity:1; transform:none } }
        @keyframes fade { from { opacity:0 } to { opacity:1 } }
        @media (prefers-reduced-motion: reduce){ [data-portal-root] * { animation: none !important; transition: none !important; } }
      `}</style>
    </Portal>
  );
}
