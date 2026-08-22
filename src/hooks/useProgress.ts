import { useCallback, useState } from "react";

const STORAGE_KEY = "fe2o3-kernels-progress-v2";
const LEGACY_STORAGE_KEY = "fe2o3-kernels-progress-v1";

interface StoredProgress {
  version: 2;
  completed: string[];
}

function parseCompleted(raw: string | null): string[] {
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    return parsed.filter((item): item is string => typeof item === "string");
  }
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "version" in parsed &&
    parsed.version === 2 &&
    "completed" in parsed &&
    Array.isArray(parsed.completed)
  ) {
    return parsed.completed.filter(
      (item): item is string => typeof item === "string",
    );
  }
  return [];
}

function persist(completed: ReadonlySet<string>): void {
  try {
    const value: StoredProgress = { version: 2, completed: [...completed] };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Session state remains usable when browser storage is unavailable.
  }
}

function loadProgress(): Set<string> {
  try {
    const current = window.localStorage.getItem(STORAGE_KEY);
    const legacy = current
      ? null
      : window.localStorage.getItem(LEGACY_STORAGE_KEY);
    const completed = new Set(parseCompleted(current ?? legacy));
    if (legacy) persist(completed);
    return completed;
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
      persist(next);
      return next;
    });
  }, []);

  const prune = useCallback((validLessonIds: ReadonlySet<string>) => {
    setCompleted((current) => {
      const next = new Set(
        [...current].filter((lessonId) => validLessonIds.has(lessonId)),
      );
      if (next.size === current.size) return current;
      persist(next);
      return next;
    });
  }, []);

  return { completed, toggle, prune };
}
