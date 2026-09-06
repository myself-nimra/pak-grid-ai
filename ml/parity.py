"""
parity.py — Proves the TypeScript inference matches the Python training math.

The model is trained in Python but served from TypeScript. That is two
implementations of the same equations, which is two chances to disagree: a
reordered feature, a missed standardisation, a sign flip. Any of those would
silently produce plausible-but-wrong predictions.

This script closes that gap end to end:
  1. reads parity_fixture.json (inputs + expected values, written by train.py)
  2. compiles src/lib/ml/predict.ts with the project's own tsc
  3. runs the compiled JS under node on the same inputs
  4. asserts every output agrees to within TOLERANCE

Run:  python parity.py     (exit 0 = implementations agree)
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

TOLERANCE = 1e-6

ML_DIR = Path(__file__).parent
PROJECT_ROOT = ML_DIR.parent
PREDICT_TS = PROJECT_ROOT / "src" / "lib" / "ml" / "predict.ts"
FIXTURE = ML_DIR / "parity_fixture.json"


def run(cmd: list[str], cwd: Path) -> subprocess.CompletedProcess:
    return subprocess.run(
        cmd, cwd=cwd, capture_output=True, text=True, shell=True,
    )


def main() -> int:
    if not FIXTURE.exists():
        print(f"FAIL: {FIXTURE.name} missing -- run `python train.py` first")
        return 1

    probes = json.loads(FIXTURE.read_text(encoding="utf-8"))
    print(f"fixture: {len(probes)} probe vectors")

    tmp = Path(tempfile.mkdtemp(prefix="pakgrid-parity-"))
    try:
        # 1. Compile predict.ts (plus its JSON import) to CommonJS.
        print("compiling predict.ts with project tsc ...")
        compile_cmd = [
            "npx", "tsc", str(PREDICT_TS),
            "--outDir", str(tmp),
            "--module", "commonjs",
            "--target", "es2020",
            "--moduleResolution", "node",
            "--resolveJsonModule",
            "--esModuleInterop",
            "--skipLibCheck",
        ]
        proc = run(compile_cmd, PROJECT_ROOT)
        if proc.returncode != 0:
            print("FAIL: tsc could not compile predict.ts")
            print(proc.stdout[-3000:])
            print(proc.stderr[-2000:])
            return 1

        # tsc preserves the src/lib/ml/... structure under outDir.
        compiled = next(tmp.rglob("predict.js"), None)
        if compiled is None:
            print(f"FAIL: no predict.js produced under {tmp}")
            return 1

        # 2. Drive the compiled module with the fixture inputs.
        harness = tmp / "harness.js"
        harness.write_text(
            f"""
const {{ predictDay }} = require({json.dumps(str(compiled))});
const probes = {json.dumps(probes)};
const out = probes.map((p) => {{
  const day = predictDay({{
    temperatureC: p.temperature_c,
    isWeekend: Boolean(p.is_weekend),
    dayOfYear: p.day_of_year,
  }});
  const row = day.find((r) => r.hour === p.hour);
  return {{ load_kw: row.predictedKw, peak_probability: row.peakProbability }};
}});
process.stdout.write(JSON.stringify(out));
""",
            encoding="utf-8",
        )

        proc = run(["node", str(harness)], PROJECT_ROOT)
        if proc.returncode != 0:
            print("FAIL: node harness errored")
            print(proc.stdout[-2000:])
            print(proc.stderr[-2000:])
            return 1

        ts_results = json.loads(proc.stdout)

        # 3. Compare. predict.ts rounds its outputs to 3 dp for the UI, so
        #    compare against the Python values rounded the same way.
        print(f"\n{'hour':>5} {'temp':>6} {'py load':>10} {'ts load':>10} "
              f"{'py p_pk':>9} {'ts p_pk':>9}  ok")
        failures = 0
        for probe, ts in zip(probes, ts_results):
            py_load = round(probe["expected_load_kw"], 3)
            py_prob = round(probe["expected_peak_probability"], 3)
            d_load = abs(py_load - ts["load_kw"])
            d_prob = abs(py_prob - ts["peak_probability"])
            ok = d_load <= TOLERANCE and d_prob <= TOLERANCE
            if not ok:
                failures += 1
            print(f"{probe['hour']:>5} {probe['temperature_c']:>6} "
                  f"{py_load:>10.3f} {ts['load_kw']:>10.3f} "
                  f"{py_prob:>9.3f} {ts['peak_probability']:>9.3f}  "
                  f"{'yes' if ok else 'NO'}")

        print()
        if failures:
            print(f"FAIL: {failures}/{len(probes)} probes disagree beyond {TOLERANCE}")
            return 1
        print(f"PASS: all {len(probes)} probes agree within {TOLERANCE} "
              f"-- Python and TypeScript inference are equivalent")
        return 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
