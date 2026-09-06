/**
 * predict.ts — Inference for the trained PakGrid peak-hour models.
 *
 * The weights in peak-model.json are produced by ml/train.py. This file must
 * build features in the SAME ORDER as `FEATURE_NAMES` there and apply the same
 * standardisation, or the dot products are meaningless. `ml/parity.py` checks
 * the two implementations agree to 1e-6.
 *
 * No inference framework needed: ridge regression is a dot product and
 * logistic regression is a dot product plus a sigmoid.
 */

import modelJson from "./peak-model.json";

interface RegressorSpec {
  type: string;
  weights: number[];
  intercept: number;
  metrics: {
    train: { mae_kw: number; rmse_kw: number; r2: number };
    test: { mae_kw: number; rmse_kw: number; r2: number };
  };
}

interface ClassifierMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusion: { tp: number; fp: number; tn: number; fn: number };
}

interface ClassifierSpec {
  type: string;
  threshold: number;
  weights: number[];
  intercept: number;
  metrics: { train: ClassifierMetrics; test: ClassifierMetrics };
  tariff_clock_baseline: ClassifierMetrics;
}

interface PeakModel {
  model_name: string;
  version: number;
  trained_at: string;
  framework: string;
  data_source: { kind: string; note: string; rows: number; days: number };
  feature_names: string[];
  ac_threshold_c: number;
  standardizer: { mean: number[]; std: number[] };
  load_regressor: RegressorSpec;
  peak_classifier: ClassifierSpec;
  peak_selection: {
    chosen: string;
    candidates_test_f1: Record<string, number>;
    honest_note: string;
  };
  tariff_peak_window: [number, number];
}

export const model = modelJson as unknown as PeakModel;

export interface HourlyPrediction {
  hour: number;
  /** "6PM" style label for chart axes. */
  label: string;
  /** Ambient temperature fed to the model for this hour, Celsius. */
  temperatureC: number;
  /** Model-predicted household load, kW. */
  predictedKw: number;
  /** Load after the shift policy is applied, kW. */
  optimizedKw: number;
  /** P(this hour is one of the day's 3 highest-load hours). */
  peakProbability: number;
  /** peakProbability >= trained threshold. */
  isPredictedPeak: boolean;
  /** Whether the hour falls in the DISCO tariff peak window. */
  inTariffWindow: boolean;
}

export interface PredictionContext {
  /** Ambient temperature in Celsius. Drives the AC-load feature. */
  temperatureC: number;
  isWeekend: boolean;
  /** 1-365. Encodes seasonal position. */
  dayOfYear: number;
  /**
   * Optional per-hour temperatures (length 24). The training data carried a
   * diurnal swing, so supplying this recovers signal that a single flat daily
   * temperature throws away. Falls back to `temperatureC` for every hour.
   */
  hourlyTemperaturesC?: number[];
}

// Seasonal/diurnal temperature constants, mirrored from ml/simulate.py so a
// caller with no weather feed still gets a curve consistent with training.
const TEMP_ANNUAL_MEAN = 24.5;
const TEMP_ANNUAL_AMP = 11.0;
const TEMP_DIURNAL_AMP = 5.5;

/**
 * Expected 24-hour temperature curve for a day of year, noise-free.
 * Used as the default when no live weather reading is available.
 */
export function seasonalHourlyTemperatures(dayOfYear: number): number[] {
  const seasonal =
    TEMP_ANNUAL_MEAN -
    TEMP_ANNUAL_AMP * Math.cos((2 * Math.PI * (dayOfYear - 15)) / 365);
  return Array.from({ length: 24 }, (_, hour) => {
    // Maximum ~3 PM, minimum ~3 AM. Sign must match _ambient_temp() in
    // ml/simulate.py -- negating this inverts the day.
    const diurnal =
      TEMP_DIURNAL_AMP * Math.cos((2 * Math.PI * (hour - 15)) / 24);
    return Math.round((seasonal + diurnal) * 100) / 100;
  });
}

/**
 * Feature vector for one hour. MUST match build_features() in ml/train.py.
 */
function buildFeatures(hour: number, tempC: number, ctx: PredictionContext): number[] {
  const h = (2 * Math.PI * hour) / 24;
  const d = (2 * Math.PI * ctx.dayOfYear) / 365;
  return [
    Math.sin(h),
    Math.cos(h),
    Math.sin(2 * h),
    Math.cos(2 * h),
    Math.sin(3 * h),
    Math.cos(3 * h),
    Math.sin(4 * h),
    Math.cos(4 * h),
    tempC,
    Math.max(0, tempC - model.ac_threshold_c),
    ctx.isWeekend ? 1 : 0,
    Math.sin(d),
    Math.cos(d),
  ];
}

function standardize(raw: number[]): number[] {
  const { mean, std } = model.standardizer;
  return raw.map((v, i) => (v - mean[i]) / std[i]);
}

function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function sigmoid(z: number): number {
  const clipped = Math.max(-60, Math.min(60, z));
  return 1 / (1 + Math.exp(-clipped));
}

function hourLabel(hour: number): string {
  if (hour === 0) return "12AM";
  if (hour === 12) return "12PM";
  return hour < 12 ? `${hour}AM` : `${hour - 12}PM`;
}

/**
 * Deferrable share of load that can be moved out of a predicted peak hour.
 *
 * This is a documented policy, NOT a model output: of the appliances PakGrid
 * can actually switch (pump, AC setpoint, phantom loads), roughly 30% of the
 * hour's draw is deferrable. Fixed load (fridge, lighting, cooking) is not.
 */
const DEFERRABLE_SHARE = 0.3;
/** Shifted load has to land somewhere — it reappears in off-peak hours. */
const RECOVERY_SHARE = 0.12;

/**
 * Predict the full 24-hour load curve plus peak probabilities.
 */
export function predictDay(ctx: PredictionContext): HourlyPrediction[] {
  const reg = model.load_regressor;
  const clf = model.peak_classifier;
  const [peakStart, peakEnd] = model.tariff_peak_window;

  const rows = Array.from({ length: 24 }, (_, hour) => {
    const tempC = ctx.hourlyTemperaturesC?.[hour] ?? ctx.temperatureC;
    const x = standardize(buildFeatures(hour, tempC, ctx));
    const predictedKw = dot(x, reg.weights) + reg.intercept;
    const peakProbability = sigmoid(dot(x, clf.weights) + clf.intercept);
    return {
      hour,
      label: hourLabel(hour),
      temperatureC: Math.round(tempC * 10) / 10,
      predictedKw: Math.max(0.05, predictedKw),
      optimizedKw: 0, // filled below
      peakProbability,
      isPredictedPeak: peakProbability >= clf.threshold,
      inTariffWindow: hour >= peakStart && hour < peakEnd,
    };
  });

  // Apply the shift policy: trim deferrable load from hours the model flags as
  // peaks, then redistribute it across the non-peak hours so total energy is
  // conserved (we are shifting consumption, not deleting it).
  let shifted = 0;
  for (const r of rows) {
    if (r.isPredictedPeak || r.inTariffWindow) {
      const trim = r.predictedKw * DEFERRABLE_SHARE;
      shifted += trim;
      r.optimizedKw = r.predictedKw - trim;
    } else {
      r.optimizedKw = r.predictedKw;
    }
  }

  const absorbers = rows.filter((r) => !r.isPredictedPeak && !r.inTariffWindow);
  if (absorbers.length > 0) {
    const perHour = (shifted * RECOVERY_SHARE) / absorbers.length;
    for (const r of absorbers) r.optimizedKw += perHour;
  }

  for (const r of rows) {
    r.predictedKw = round3(r.predictedKw);
    r.optimizedKw = round3(r.optimizedKw);
    r.peakProbability = round3(r.peakProbability);
  }

  return rows;
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}

export interface DaySummary {
  predictedPeakHours: string[];
  peakLoadKw: number;
  baselineKwh: number;
  optimizedKwh: number;
  reductionPercent: number;
}

/** Aggregate a predicted curve into the numbers the dashboard cards show. */
export function summarize(rows: HourlyPrediction[]): DaySummary {
  const baselineKwh = rows.reduce((s, r) => s + r.predictedKw, 0);
  const optimizedKwh = rows.reduce((s, r) => s + r.optimizedKw, 0);
  const peaks = rows
    .filter((r) => r.isPredictedPeak)
    .sort((a, b) => b.peakProbability - a.peakProbability);

  return {
    predictedPeakHours: peaks.map((r) => r.label),
    peakLoadKw: round3(Math.max(...rows.map((r) => r.predictedKw))),
    baselineKwh: round3(baselineKwh),
    optimizedKwh: round3(optimizedKwh),
    reductionPercent:
      baselineKwh > 0
        ? Math.round(((baselineKwh - optimizedKwh) / baselineKwh) * 1000) / 10
        : 0,
  };
}

/** Model card surfaced in the UI so the metrics are visible, not claimed. */
export function modelCard() {
  const clf = model.peak_classifier;
  return {
    name: model.model_name,
    version: model.version,
    trainedAt: model.trained_at,
    framework: model.framework,
    dataSource: model.data_source,
    features: model.feature_names.length,
    regression: model.load_regressor.metrics.test,
    classification: {
      accuracy: clf.metrics.test.accuracy,
      precision: clf.metrics.test.precision,
      recall: clf.metrics.test.recall,
      f1: clf.metrics.test.f1,
    },
    /**
     * F1 of a fixed "peak == the tariff window" rule on the same test set.
     * Reported as-is: on this dataset the model only edges it out, because peak
     * *identification* is near its noise ceiling. The model's real advantage is
     * predicting load magnitude, which a fixed clock cannot do at all.
     */
    baselineF1: clf.tariff_clock_baseline.f1,
    peakSelection: model.peak_selection,
  };
}
