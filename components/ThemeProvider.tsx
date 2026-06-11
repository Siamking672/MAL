"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const useDark = stored ? stored === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", useDark);
    setReady(true);
  }, []);

  return <>{ready ? children : <div className="min-h-screen bg-slate-50 dark:bg-slate-950" />}</>;
}
