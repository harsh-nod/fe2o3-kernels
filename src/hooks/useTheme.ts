import { useCallback, useState } from "react";

export type Theme = "light" | "dark";
const STORAGE_KEY = "fe2o3-kernels-theme";

function initialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Fall through to the system preference when storage is unavailable.
  }
  return typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const value = initialTheme();
    document.documentElement.dataset.theme = value;
    return value;
  });

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Theme still applies for the current session.
      }
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
