# PakGrid AI — Peak-Hour Prediction Model

Model card for the ML that drives the dashboard load chart. Everything here is
reproducible from this folder with numpy alone.

```
python simulate.py    # build the dataset  -> ml/data/household_load.csv
python train.py       # train + export     -> src/lib/ml/peak-model.json
python parity.py      # verify TS inference matches Python (exit 0 = agree)
jupyter notebook peak_hour_model.ipynb    # narrated walkthrough
```

## What it does

| Model | Target | Test score |
|---|---|---|
| Ridge regression | household load, kW | **MAE 0.299 kW · RMSE 0.382 · R² 0.657** |
| Logistic regression | is this hour one of the day's 3 highest-load hours | **F1 0.576** (acc 0.865, P 0.473, R 0.736) |

Both share one 13-feature vector. Served at `GET /api/predict-peak`, rendered by
`/dashboard`.

## Honest evaluation

The comparison that matters is not "is the score high" but **does it beat a clock?**
Pakistani DISCO tariffs already declare 6–10 PM peak, so that rule is free.

| Peak selector | Test F1 |
|---|---|
| Logistic regression (shipped) | **0.5761** |
| Fixed "peak = 6–10 PM" rule | 0.5714 |
| Top-3 ranking of predicted load | 0.5417 |

**The model only edges out the clock at peak *identification*.** An earlier build of
this project reported "3.7× better than baseline" — that number was an artifact of an
inverted diurnal temperature curve in the simulator (nights hotter than afternoons),
which pushed simulated peaks into the morning where a 6–10 PM rule naturally fails.
With the physics corrected the baseline is competitive, and the inflated claim was
removed from the code and the UI rather than kept.

That result also has a floor underneath it. Ranking the *noise-free expected* load
curve — which is as much signal as exists — scores only **0.542**, because a smooth
curve nominates the same three hours daily while the true top-3 moves with appliance
randomness. So ~0.57 is close to the achievable ceiling for this label; the residual is
irreducible noise, not an untrained model.

**The claim that does hold up is the regressor.** Predicting load to ±0.30 kW
(R² 0.657) is something a tariff clock cannot do at all — a clock emits a boolean,
never a magnitude — and magnitude is what sizing a load-shift decision needs. That is
what the dashboard leads with.

## Data

**Simulated, not metered.** `simulate.py` generates 5,760 hourly rows (240 days) from an
appliance-level model of a Pakistani household: fridge duty cycle, lighting, TV +
standby, water pump, AC, laundry — driven by a seasonal + diurnal ambient temperature
curve, with per-appliance usage randomness and ~1% measurement noise standing in for
PZEM-004T sensor error. Seed `20260905`, so runs are reproducible.

The AC engages only above `AC_THRESHOLD_C = 29 °C`. That threshold is the nonlinearity
worth learning, and `cooling_demand = max(0, temp − 29)` duly comes out as the largest
weight in the load regressor (+0.30 standardised) and the strongest non-time-of-day
driver in the classifier (+0.82, behind only the seasonal and hour-harmonic terms).

Retraining on real hardware is a data swap, not a rewrite: point `simulate.read_csv()`
at logged telemetry with the same columns (`day, day_of_year, hour, is_weekend, temp_c,
load_kw, in_tariff_peak, is_demand_peak`) and rerun `train.py`.

**Label:** `is_demand_peak` = the 3 highest-load hours of *that day* — a constant 12.5%
positive rate that stays stable across seasons. An earlier "within 85% of the daily max"
definition drifted with the weather and scored F1 0.451.

## Features

13, in the order both implementations must build them:

```
hour_sin,  hour_cos,  hour_sin2, hour_cos2,   # cyclical hour-of-day, harmonics 1-2
hour_sin3, hour_cos3, hour_sin4, hour_cos4,   # harmonics 3-4: the sharp evening ramp
temp_c,                                        # ambient
cooling_demand,                                # max(0, temp_c - 29) -> AC engagement
is_weekend,
season_sin, season_cos                         # cyclical day-of-year
```

Hour is encoded cyclically because hour 23 neighbours hour 0; the raw integer would
teach the model that midnight is maximally distant from 11 PM. Harmonics 3–4 were added
after measuring their effect (**+0.07 test R²**) — the first two alone smooth the
evening ramp away.

## Training

- **numpy only.** scikit-learn has no wheel for Python 3.15, so ridge uses its closed
  form `w = (XᵀX + λI)⁻¹Xᵀ(y − ȳ)` via `np.linalg.solve`, and logistic regression is
  batch gradient descent on weighted cross-entropy.
- **Class weighting is not optional.** Peaks are 12.5% of rows, so unweighted GD
  converges on "never a peak" — 87.5% accuracy, F1 0.0. Each class is weighted by
  inverse frequency, which is also why F1 rather than accuracy is reported.
- **Chronological 80/20 split by day** (train days 0–191, test 192–239). A random split
  would put 6 PM and 7 PM of the same day on opposite sides and inflate every score.
- **Standardisation from train statistics only** — fitting the scaler on all rows leaks
  the test distribution.

Hyperparameters: `RIDGE_LAMBDA=1.0`, `LOGREG_LR=0.35`, `LOGREG_EPOCHS=8000`,
`LOGREG_L2=1e-3`.

## Serving: Python trains, TypeScript infers

`train.py` writes weights, intercept, standardiser and all metrics to
`src/lib/ml/peak-model.json`. Since inference is a dot product plus a sigmoid,
`src/lib/ml/predict.ts` reimplements it directly — **no Python process, no ONNX runtime,
no model server in production.** The app deploys to plain Node.js hosting unchanged.

The cost of that choice is two implementations of one set of equations, i.e. two chances
to disagree over a reordered feature, a dropped standardisation or a flipped sign.
`parity.py` closes it: it compiles `predict.ts` with the project's own tsc, runs the
compiled JS under node on fixture inputs from `train.py`, and asserts agreement to
**1e-6** across 10 probe vectors.

Worth being precise about what that proves. Parity showed the two sides *agree*, not
that either is *right* — the inverted-temperature bug passed it cleanly, because both
files had mirrored the same sign error. Physics assertions (hottest hour mid-afternoon,
predicted peaks in the evening) are what catch that class of bug, and they live in
section 1 of the notebook.

## Limitations

- Training data is simulated; the model has learned `simulate.py`'s physics. Expect
  lower scores on real logged data.
- Linear models only. Gradient boosting would likely improve the regressor but cannot
  ship as a dot product in `predict.ts`.
- Peak classification sits near its noise ceiling and barely beats a fixed clock.
- **Load shedding is not modelled**, though it shapes Pakistan's real demand curve — the
  most significant gap between this dataset and reality.
- The optimised curve applies a **documented policy constant** (30% of a peak hour's draw
  is deferrable, 12% resurfaces off-peak), defined in `predict.ts`. That is an assumption
  about which appliances PakGrid can switch, not a model output.

## Files

| Path | Role |
|---|---|
| `simulate.py` | dataset generator / real-CSV loader |
| `train.py` | trains both models, exports artifact + parity fixture |
| `parity.py` | asserts Python ≡ TypeScript inference |
| `peak_hour_model.ipynb` | narrated walkthrough with the honest comparison |
| `data/household_load.csv` | 5,760-row dataset (committed for reproducibility) |
| `../src/lib/ml/peak-model.json` | exported weights + metrics |
| `../src/lib/ml/predict.ts` | TypeScript inference |
| `../src/app/api/predict-peak/route.ts` | serving endpoint |
