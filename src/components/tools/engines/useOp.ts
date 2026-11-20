"use client";
import { useEffect, useState } from "react";

type Loader<M> = () => Promise<M>;

/** Loads one operation from a lazily imported ops module. */
export function useOp<Op, M extends { ops: Record<string, Op> }>(loaders: Record<string, Loader<M>>, moduleKey: unknown, opKey: unknown) {
  const [state, setState] = useState<{ op?: Op; error?: string }>({});
  useEffect(() => {
    let active = true;
    const loader = typeof moduleKey === "string" ? loaders[moduleKey] : undefined;
    if (!loader || typeof opKey !== "string") { setState({ error: "This tool is not configured correctly." }); return; }
    loader()
      .then(mod => { if (active) setState(mod.ops[opKey] ? { op: mod.ops[opKey] } : { error: "This tool's operation is missing." }); })
      .catch(() => { if (active) setState({ error: "The tool could not load. Check your connection and reload the page." }); });
    return () => { active = false; };
  }, [loaders, moduleKey, opKey]);
  return state;
}

export function errorText(error: unknown, fallback = "Check your input and try again."): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
