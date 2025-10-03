import React from "react";
import { createPortal } from "react-dom";

export function Portal({ children }: { children: React.ReactNode }) {
  const el = React.useMemo(() => {
    const d = document.createElement("div");
    d.setAttribute("data-portal-root", "true");
    return d;
  }, []);
  React.useEffect(() => {
    document.body.appendChild(el);
    return () => { document.body.removeChild(el); };
  }, [el]);
  return createPortal(children, el);
}
