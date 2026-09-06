"""
simulate.py — Synthetic historical load generator for PakGrid AI.

WHY THIS EXISTS
---------------
Training a peak-hour model needs historical hourly load data. The PakGrid
ESP32 + PZEM-004T rig streams live telemetry but has no logged history yet,
so this module generates a physically-grounded stand-in.

This is a *simulator*, not real meter data, and the model card says so. Every
assumption below is an explicit, citable number rather than a magic constant,
and `load_dataframe()` accepts a real CSV so logged PZEM data can replace the
simulator without touching the training code.

ASSUMPTIONS (typical urban Pakistani household, 5-7 kVA sanctioned load)
------------------------------------------------------------------------
Appliance      Rated kW   Duty pattern
fridge         0.15       always on, compressor cycling
lights/fans    0.06/unit  dusk -> bedtime, count varies by room occupancy
TV + standby   0.12       evening entertainment block, phantom draw overnight
water pump     0.75       short bursts, morning fill + evening top-up
AC (1.5 ton)   1.45       thermostat-driven, only above ~29 C ambient
iron/laundry   1.10       intermittent, daytime, weekend-heavy

Tariff peak window follows the NEPRA/DISCO convention used elsewhere in the
app: 18:00-22:00 (6-10 PM). Note the model is NOT told the tariff window --
it has to learn demand peaks from the load signal, which is the whole point.
"""

from __future__ import annotations

import csv
import math
from pathlib import Path

import numpy as np

# Reproducibility: judges rerunning this must get identical numbers.
SEED = 20260905

# Tariff peak window (inclusive start, exclusive end), 24h clock.
PEAK_START, PEAK_END = 18, 22

# How many hours per day are labelled as demand peaks (top-k by load).
PEAK_HOURS_PER_DAY = 3

FRIDGE_KW = 0.15
LIGHT_KW = 0.06
TV_KW = 0.12
TV_STANDBY_KW = 0.012
PUMP_KW = 0.75
AC_KW = 1.45
LAUNDRY_KW = 1.10

# Ambient temperature model: Lahore-like seasonal swing.
TEMP_ANNUAL_MEAN = 24.5
TEMP_ANNUAL_AMP = 11.0   # summer peak ~35.5 C, winter trough ~13.5 C
TEMP_DIURNAL_AMP = 5.5   # day/night swing
AC_THRESHOLD_C = 29.0    # AC engages above this ambient


def _ambient_temp(day_of_year: int, hour: int, rng: np.random.Generator) -> float:
    """Seasonal + diurnal ambient temperature in Celsius."""
    seasonal = TEMP_ANNUAL_MEAN - TEMP_ANNUAL_AMP * math.cos(
        2 * math.pi * (day_of_year - 15) / 365.0
    )
    # Diurnal cycle: maximum ~3 PM, minimum ~3 AM. cos() is +1 at hour 15,
    # so this term must be ADDED, not subtracted -- negating it inverts the
    # day, making nights hotter than afternoons.
    diurnal = TEMP_DIURNAL_AMP * math.cos(2 * math.pi * (hour - 15) / 24.0)
    return seasonal + diurnal + rng.normal(0.0, 1.1)


def _hourly_load(hour: int, is_weekend: bool, temp_c: float,
                 rng: np.random.Generator) -> float:
    """Sum appliance-level draw for one hour. Returns kW."""
    load = FRIDGE_KW * rng.uniform(0.75, 1.15)  # compressor duty cycle

    # Lighting and fans: dusk through bedtime, plus a little before dawn.
    if 18 <= hour <= 23:
        load += LIGHT_KW * rng.integers(4, 9)
    elif hour in (5, 6, 7):
        load += LIGHT_KW * rng.integers(1, 4)
    elif 8 <= hour <= 17:
        load += LIGHT_KW * rng.integers(0, 3)

    # TV: evening block on weekdays, broader on weekends. Phantom draw always.
    tv_window = (17, 23) if not is_weekend else (13, 23)
    if tv_window[0] <= hour <= tv_window[1] and rng.random() < 0.72:
        load += TV_KW
    else:
        load += TV_STANDBY_KW

    # Water pump: morning fill, evening top-up. Short and spiky.
    if hour in (6, 7) and rng.random() < 0.80:
        load += PUMP_KW * rng.uniform(0.5, 1.0)
    elif hour in (19, 20) and rng.random() < 0.45:
        load += PUMP_KW * rng.uniform(0.4, 0.9)

    # AC: thermostat-driven. Duty rises with how far above threshold we are.
    if temp_c > AC_THRESHOLD_C:
        excess = temp_c - AC_THRESHOLD_C
        duty = min(1.0, 0.18 + 0.11 * excess)
        # Sleeping hours: AC often on but at a higher setpoint.
        if 0 <= hour <= 5:
            duty *= 0.72
        # Nobody home midday on weekdays -> lower duty.
        if not is_weekend and 9 <= hour <= 16:
            duty *= 0.55
        load += AC_KW * duty * rng.uniform(0.88, 1.12)

    # Iron / washing machine: daytime, weekend-heavy.
    laundry_p = 0.22 if is_weekend else 0.09
    if 9 <= hour <= 17 and rng.random() < laundry_p:
        load += LAUNDRY_KW * rng.uniform(0.6, 1.0)

    # Measurement noise (PZEM-004T is ~1% accurate, plus unmodelled draw).
    load *= rng.normal(1.0, 0.045)
    return max(0.08, load)


def generate(days: int = 240, start_day_of_year: int = 1) -> list[dict]:
    """Generate `days` of hourly records. Returns a list of row dicts."""
    rng = np.random.default_rng(SEED)
    rows: list[dict] = []

    for d in range(days):
        doy = ((start_day_of_year + d - 1) % 365) + 1
        # Day 0 of the sim is a Monday; 5 and 6 are Sat/Sun.
        weekday = d % 7
        is_weekend = weekday >= 5

        for hour in range(24):
            temp_c = _ambient_temp(doy, hour, rng)
            load_kw = _hourly_load(hour, is_weekend, temp_c, rng)
            rows.append({
                "day": d,
                "day_of_year": doy,
                "weekday": weekday,
                "hour": hour,
                "is_weekend": int(is_weekend),
                "temp_c": round(temp_c, 2),
                "load_kw": round(load_kw, 4),
                "in_tariff_peak": int(PEAK_START <= hour < PEAK_END),
            })

    _label_demand_peaks(rows)
    return rows


def _label_demand_peaks(rows: list[dict]) -> None:
    """
    Add the classification target `is_demand_peak`.

    Defined per-day as the THREE highest-load hours of that day. Two reasons
    for top-k rather than a "within x% of daily max" threshold:

      * it is exactly the question the product asks -- "which hours should I
        shift load away from today?"
      * it gives a constant 3/24 = 12.5% positive rate every single day, so
        the classifier cannot game seasonal class-balance drift.

    Crucially this is a *demand* peak derived from the load signal, NOT the
    tariff clock -- so the model must learn household behaviour instead of
    memorising "hour >= 18".
    """
    by_day: dict[int, list[dict]] = {}
    for r in rows:
        by_day.setdefault(r["day"], []).append(r)

    for day_rows in by_day.values():
        ranked = sorted(day_rows, key=lambda r: r["load_kw"], reverse=True)
        top = {id(r) for r in ranked[:PEAK_HOURS_PER_DAY]}
        for r in day_rows:
            r["is_demand_peak"] = int(id(r) in top)


FIELDS = ["day", "day_of_year", "weekday", "hour", "is_weekend",
          "temp_c", "load_kw", "in_tariff_peak", "is_demand_peak"]


def write_csv(rows: list[dict], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def read_csv(path: Path) -> list[dict]:
    """Read a dataset CSV. Real PZEM-004T logs can be loaded here instead."""
    with path.open(newline="", encoding="utf-8") as fh:
        out = []
        for raw in csv.DictReader(fh):
            out.append({
                k: (float(raw[k]) if k in ("temp_c", "load_kw") else int(raw[k]))
                for k in FIELDS if k in raw
            })
        return out


DEFAULT_CSV = Path(__file__).parent / "data" / "household_load.csv"


if __name__ == "__main__":
    data = generate()
    write_csv(data, DEFAULT_CSV)
    loads = np.array([r["load_kw"] for r in data])
    peaks = sum(r["is_demand_peak"] for r in data)
    print(f"wrote {len(data)} rows ({len(data)//24} days) -> {DEFAULT_CSV}")
    print(f"load kW: mean={loads.mean():.3f} min={loads.min():.3f} "
          f"max={loads.max():.3f} std={loads.std():.3f}")
    print(f"demand-peak hours: {peaks} ({100*peaks/len(data):.1f}% of rows)")
