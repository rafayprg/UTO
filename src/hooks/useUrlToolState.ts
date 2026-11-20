"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook to synchronize state with URL query parameters for shareable calculator results.
 * Updates browser history state without full-page reloads, preserving canonical indexing.
 */
export function useUrlToolState<T extends object>(initialValues: T): [T, (updates: Partial<T>) => void, () => Promise<boolean>] {
  const [state, setState] = useState<T>(initialValues);
  const initialRef = useRef(initialValues);

  // Initialize from URL on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const defaults = initialRef.current as Record<string, unknown>;
      const loaded: Record<string, unknown> = { ...defaults };
      let hasCustom = false;

      for (const [key, initialVal] of Object.entries(defaults)) {
        if (params.has(key)) {
          const val = params.get(key);
          if (val !== null) {
            hasCustom = true;
            if (typeof initialVal === "number") {
              const num = Number(val);
              loaded[key] = isNaN(num) ? initialVal : num;
            } else if (typeof initialVal === "boolean") {
              loaded[key] = val === "true" || val === "1";
            } else {
              loaded[key] = val;
            }
          }
        }
      }

      if (hasCustom) {
        setState(loaded as T);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  const updateState = useCallback((updates: Partial<T>) => {
    setState(prev => {
      const next = { ...prev, ...updates };
      if (typeof window !== "undefined") {
        try {
          const params = new URLSearchParams();
          for (const [k, v] of Object.entries(next as Record<string, unknown>)) {
            if (v !== undefined && v !== null && v !== "") {
              params.set(k, String(v));
            }
          }
          const queryString = params.toString();
          const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
          window.history.replaceState(null, "", newUrl);
        } catch {
          // ignore history errors
        }
      }
      return next;
    });
  }, []);

  const copyShareableLink = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !navigator.clipboard) return false;
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  return [state, updateState, copyShareableLink];
}
