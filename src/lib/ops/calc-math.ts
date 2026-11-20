import type { CalcOp } from "./types";
import { algebraOps } from "./calc-math-algebra.ts";
import { dateOps } from "./calc-math-dates.ts";
import { healthOps } from "./calc-math-health.ts";
import { numberOps } from "./calc-math-number.ts";
import { statsOps } from "./calc-math-stats.ts";
import { geometryOps } from "./calc-math-geometry.ts";
import { physicsOps } from "./calc-physics.ts";
import { advancedMathOps } from "./calc-math-advanced.ts";

export const ops: Record<string, CalcOp> = { ...statsOps, ...numberOps, ...algebraOps, ...healthOps, ...dateOps, ...geometryOps, ...physicsOps, ...advancedMathOps };
