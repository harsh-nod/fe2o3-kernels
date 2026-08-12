import { useCallback, useState } from "react";

const STORAGE_KEY = "fe2o3-kernels-progress-v1";

function loadProgress(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((item): item is string => typeof item === "string"))
      : new Set();
  } catch {
    return new Set();
  }
}

export function useProgress() {
  const [completed, setCompleted] = useState<Set<string>>(loadProgress);

  const toggle = useCallback((lessonId: string) => {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Progress still works for the current session when storage is blocked.
      }
      return next;
    });
  }, []);

  return { completed, toggle };
}
