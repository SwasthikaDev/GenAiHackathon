"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<string>("light");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const initial = saved || (document.documentElement.getAttribute("data-theme") || "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  return (
    <button
      onClick={toggle}
      className="btn btn-ghost h-8 w-8 p-0 grid place-items-center border border-[var(--border)] rounded-md text-[var(--brand-blue)]"
      aria-label="Toggle theme"
      title={theme === "light" ? "Switch to dark" : "Switch to light"}
    >
      {theme === "light" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79 1.8-1.79zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zM1 3h3V1H1v2zm16.24 1.84l1.79-1.79-1.79-1.79-1.79 1.79 1.79 1.79zM20 13h3v-2h-3v2zm-8-6a5 5 0 100 10 5 5 0 000-10zm7 14h2v-3h-2v3zM4 20h2v-3H4v3z"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2a9.77 9.77 0 00-1 .06A10 10 0 1012 2zm0 18a8 8 0 01-6.93-11.89A7 7 0 0018 17a6.98 6.98 0 01-6 3z"/>
        </svg>
      )}
    </button>
  );
}


