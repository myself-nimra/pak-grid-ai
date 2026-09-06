import { NextRequest, NextResponse } from "next/server";
import {
  predictDay,
  summarize,
  modelCard,
  seasonalHourlyTemperatures,
  type PredictionContext,
} from "@/lib/ml/predict";

/**
 * GET /api/predict-peak
 *
 * Serves the trained peak-hour model (ml/train.py -> src/lib/ml/peak-model.json).
 * Inference is a dot product, so this runs in-process with no Python runtime
 * and no external inference service.
 *
 * Query params (all optional):
 *   temperature  current ambient Celsius; overrides the seasonal default curve
 *   dayOfYear    1-365, defaults to today
 *   weekend      "1" | "0", defaults to today's weekday
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const defaultDayOfYear = Math.floor(
    (now.getTime() - startOfYear.getTime()) / 86_400_000
  );

  const dayOfYear = clampInt(
    params.get("dayOfYear"),
    defaultDayOfYear,
    1,
    365
  );

  const weekendParam = params.get("weekend");
  const isWeekend =
    weekendParam !== null
      ? weekendParam === "1" || weekendParam === "true"
      : now.getDay() === 0 || now.getDay() === 6;

  // Default to the seasonal diurnal curve the model was trained against. If the
  // caller supplies a live reading, shift the whole curve to match it so the
  // diurnal shape is preserved rather than flattened.
  const seasonal = seasonalHourlyTemperatures(dayOfYear);
  const liveTemp = parseFloatOrNull(params.get("temperature"));

  let hourlyTemperaturesC = seasonal;
  if (liveTemp !== null && liveTemp >= -20 && liveTemp <= 60) {
    const nowIdx = now.getHours();
    const offset = liveTemp - seasonal[nowIdx];
    hourlyTemperaturesC = seasonal.map(
      (t) => Math.round((t + offset) * 100) / 100
    );
  }

  const ctx: PredictionContext = {
    temperatureC: hourlyTemperaturesC[now.getHours()],
    isWeekend,
    dayOfYear,
    hourlyTemperaturesC,
  };

  const curve = predictDay(ctx);
  const summary = summarize(curve);

  return NextResponse.json(
    {
      source: "ml-model",
      model: modelCard(),
      context: {
        dayOfYear,
        isWeekend,
        temperatureSource: liveTemp !== null ? "client-reading" : "seasonal-default",
        currentTemperatureC: ctx.temperatureC,
      },
      summary,
      curve,
    },
    {
      // Predictions only change with the hour, so allow brief caching.
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
    }
  );
}

function clampInt(
  raw: string | null,
  fallback: number,
  min: number,
  max: number
): number {
  if (raw === null) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function parseFloatOrNull(raw: string | null): number | null {
  if (raw === null) return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}
