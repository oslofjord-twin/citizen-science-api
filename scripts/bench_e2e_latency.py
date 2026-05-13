#!/usr/bin/env python3
"""End-to-end latency benchmark for the citizen-science Secchi submission flow.

Exercises the same five HTTP calls the mobile client makes, against a locally
running citizen-science API + Hasura/TimescaleDB stack + MinIO. Each iteration
performs one complete submission and times the five stages independently.

By default it cycles through three image classes so every code path gets hit:
  - present     (Secchi disk visible — classifier should accept)
  - absent      (water only, no disk visible — classifier should reject)
  - irrelevant  (not a Secchi attempt at all — relevance gate should reject)

Stages timed:
  P1 predict        POST /secchi/predict          base64 image -> classifier verdict
  P2 upload_request POST /secchi/uploads/request  presigned S3 URL
  P3 s3_put         PUT  <presigned URL>          image bytes -> MinIO
  P4 upload_complete POST /secchi/uploads/complete confirm + headobject
  P5 measurement    POST /measurements/secchi     persist + Hasura mutation
  total                                           sum of the five

Auth assumption: the API was started with DISABLE_AUTH=true (the dev bypass in
src/middleware/auth.ts), so no Authorization header is needed. If you want to
test with real auth, pass --bearer or --cookie.

Output:
  CSV with one row per stage:  stage, n, median_ms, p95_ms, host
  Stdout: human-readable summary + per-class prediction accuracy

Usage (with stack already running and DISABLE_AUTH=true on the API):
    python scripts/bench_e2e_latency.py --iters 30
"""
from __future__ import annotations

import argparse
import base64
import csv
import platform
import statistics
import sys
import time
from pathlib import Path
from typing import Any

import requests


# --- Defaults ----------------------------------------------------------------

# Repository root: api/citizen-science-api/scripts/<this> -> api/
REPO_ROOT = Path(__file__).resolve().parents[2]

DEFAULT_PRESENT_DIR = REPO_ROOT / "sort" / "Images" / "present"
DEFAULT_ABSENT_DIR = REPO_ROOT / "sort" / "Images" / "absent"
# The negatives_categorised tree has sub-folders per category; we recurse.
DEFAULT_IRRELEVANT_DIR = REPO_ROOT / "sort" / "vlm_gate" / "data" / "negatives_categorised"

STAGES = ["predict", "upload_request", "s3_put", "upload_complete", "measurement", "total"]
ALLOWED_EXT = {".jpg", ".jpeg", ".png"}


# --- Helpers -----------------------------------------------------------------

def sample_images(root: Path, n: int) -> list[Path]:
    """Deterministic first-N sample (sorted), recursing if needed.

    Skips any path that traverses a directory beginning with ``_``
    (e.g. ``_discarded``, ``_archive``) — convention for excluded pools.
    """
    if not root.exists():
        raise SystemExit(f"image directory not found: {root}")

    def is_excluded(p: Path) -> bool:
        rel = p.relative_to(root)
        return any(part.startswith("_") for part in rel.parts)

    imgs = sorted(
        p for p in root.rglob("*")
        if p.suffix.lower() in ALLOWED_EXT and p.is_file() and not is_excluded(p)
    )
    if not imgs:
        raise SystemExit(f"no images found under {root}")
    if n > len(imgs):
        print(f"  WARN: requested {n} from {root}, only {len(imgs)} available — using all")
        return imgs
    # Spread the picks across the folder so we don't just grab the first N sequential frames.
    step = max(1, len(imgs) // n)
    return [imgs[i * step] for i in range(n)]


def percentiles(values: list[float]) -> tuple[float, float]:
    if not values:
        return 0.0, 0.0
    s = sorted(values)
    idx_p95 = max(0, int(round(0.95 * (len(s) - 1))))
    return statistics.median(s), s[idx_p95]


def host_string() -> str:
    return f"{platform.node()}/{platform.machine()}"


def _check(resp: requests.Response, stage: str) -> dict[str, Any]:
    if resp.status_code >= 300:
        raise SystemExit(f"[{stage}] HTTP {resp.status_code}: {resp.text[:500]}")
    try:
        return resp.json()
    except ValueError:
        raise SystemExit(f"[{stage}] non-JSON response: {resp.text[:200]}")


# --- One iteration -----------------------------------------------------------

def run_one(
    session: requests.Session,
    base_url: str,
    image_path: Path,
    measurement: dict,
    headers: dict[str, str],
) -> tuple[dict[str, float], str, float]:
    """Run one full submission for ``image_path``.

    Returns:
      times      per-stage ms timings (keys = STAGES)
      pred_label "present" / "absent" / unknown — what the classifier said
      pred_conf  confidence in [0, 1]
    """
    image_bytes = image_path.read_bytes()
    image_b64 = base64.b64encode(image_bytes).decode("ascii")
    times: dict[str, float] = {}

    # P1 — predict
    t0 = time.perf_counter()
    r = session.post(
        f"{base_url}/secchi/predict",
        json={"imageBase64": image_b64},
        headers=headers,
        timeout=60,
    )
    body = _check(r, "predict")
    times["predict"] = (time.perf_counter() - t0) * 1000
    pred = body.get("prediction") or {}
    pred_label = str(pred.get("label", "?"))
    pred_conf = float(pred.get("confidence", 0.0))

    # P2 — request presigned upload URL
    t0 = time.perf_counter()
    r = session.post(
        f"{base_url}/secchi/uploads/request",
        json={"contentType": "image/jpeg", "sizeBytes": len(image_bytes)},
        headers=headers,
        timeout=30,
    )
    body = _check(r, "upload_request")
    times["upload_request"] = (time.perf_counter() - t0) * 1000
    upload = body["upload"]

    # P3 — PUT bytes to MinIO. Replay whichever headers the API attached, plus
    # the content type the URL was signed with.
    s3_headers = {**(upload.get("headers") or {}), "Content-Type": "image/jpeg"}
    t0 = time.perf_counter()
    r = session.put(upload["url"], data=image_bytes, headers=s3_headers, timeout=120)
    if r.status_code >= 300:
        raise SystemExit(f"[s3_put] HTTP {r.status_code}: {r.text[:500]}")
    times["s3_put"] = (time.perf_counter() - t0) * 1000

    # P4 — confirm
    t0 = time.perf_counter()
    r = session.post(
        f"{base_url}/secchi/uploads/complete",
        json={"key": upload["key"]},
        headers=headers,
        timeout=30,
    )
    _check(r, "upload_complete")
    times["upload_complete"] = (time.perf_counter() - t0) * 1000

    # P5 — measurement (citizen DB + Hasura -> TimescaleDB).
    # A 422 here is *expected* for irrelevant images: V10 (the SigLIP-2
    # relevance gate) and V11 (the classifier confidence check) block the
    # submission before it reaches the twin. We record the rejection reason
    # and keep the timing — those reject paths exercise the full pipeline
    # too and their latency is part of what we're measuring.
    t0 = time.perf_counter()
    r = session.post(
        f"{base_url}/measurements/secchi",
        json={**measurement, "image_key": upload["key"]},
        headers=headers,
        timeout=30,
    )
    times["measurement"] = (time.perf_counter() - t0) * 1000
    outcome = "accepted"
    if r.status_code == 422:
        try:
            body = r.json()
        except ValueError:
            body = {}
        reason = body.get("reason") or "unknown"
        outcome = f"rejected:{reason}"
    elif r.status_code >= 300:
        raise SystemExit(f"[measurement] HTTP {r.status_code}: {r.text[:500]}")

    times["total"] = sum(times[s] for s in STAGES if s != "total")
    return times, pred_label, pred_conf, outcome


# --- Main --------------------------------------------------------------------

def main() -> int:
    here = Path(__file__).resolve().parent.parent
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--base-url", default="http://localhost:3001/api",
                    help="Citizen-science API base URL. Default points at the /api prefix "
                         "where server.ts mounts the route modules.")
    ap.add_argument("--present-dir", type=Path, default=DEFAULT_PRESENT_DIR)
    ap.add_argument("--absent-dir", type=Path, default=DEFAULT_ABSENT_DIR)
    ap.add_argument("--irrelevant-dir", type=Path, default=DEFAULT_IRRELEVANT_DIR)
    ap.add_argument("--n-per-class", type=int, default=3,
                    help="How many distinct images to sample from each class (default 3)")
    ap.add_argument("--lat", type=float, default=59.90)
    ap.add_argument("--lon", type=float, default=10.75)
    ap.add_argument("--d-dis", type=float, default=3.7)
    ap.add_argument("--d-reapp", type=float, default=3.5)
    ap.add_argument("--warmup", type=int, default=3)
    ap.add_argument("--iters", type=int, default=30,
                    help="Timed iterations (cycle over all sampled images).")
    ap.add_argument("--bearer", default=None,
                    help="Authorization: Bearer <token>, if not using DISABLE_AUTH=true")
    ap.add_argument("--cookie", default=None,
                    help="Optional Cookie header (better-auth session)")
    ap.add_argument("--out-csv", type=Path, default=here / "results" / "e2e_latency.csv")
    ap.add_argument("--single-image", type=Path, default=None,
                    help="Bypass the class sampler and submit one fixed image every iteration")
    args = ap.parse_args()

    if args.d_reapp > args.d_dis:
        raise SystemExit("--d-reapp must be <= --d-dis (Secchi protocol: lower then raise)")

    # Build the image pool. Each entry: (class_label, Path).
    pool: list[tuple[str, Path]] = []
    if args.single_image is not None:
        if not args.single_image.exists():
            raise SystemExit(f"--single-image not found: {args.single_image}")
        pool.append(("custom", args.single_image))
    else:
        print("Sampling images:")
        for cls, root in [
            ("present", args.present_dir),
            ("absent", args.absent_dir),
            ("irrelevant", args.irrelevant_dir),
        ]:
            picks = sample_images(root, args.n_per_class)
            for p in picks:
                pool.append((cls, p))
                print(f"  {cls:<10} {p.relative_to(REPO_ROOT)}")

    print()
    print(f"Base URL: {args.base_url}")
    print(f"Pool size: {len(pool)}    Warmup: {args.warmup}    Timed iters: {args.iters}")
    print(f"Host: {host_string()}")
    print()

    headers: dict[str, str] = {}
    if args.bearer:
        headers["Authorization"] = f"Bearer {args.bearer}"
    if args.cookie:
        headers["Cookie"] = args.cookie

    # Send all three depth fields so the request works against either handler
    # shape: the older dist/ build expects a single `secchi_depth`; the current
    # src/ build expects `disappearance_depth` + `reappearance_depth` and
    # computes the mean server-side. Each handler picks the fields it knows
    # about and ignores the rest.
    secchi_depth = (args.d_dis + args.d_reapp) / 2
    measurement = {
        "secchi_depth": secchi_depth,
        "disappearance_depth": args.d_dis,
        "reappearance_depth": args.d_reapp,
        "latitude": args.lat,
        "longitude": args.lon,
        "measurement_date": "2026-05-13T12:00:00+00:00",
        "notes": "bench_e2e_latency",
    }

    samples: dict[str, list[float]] = {s: [] for s in STAGES}
    # Per-class prediction breakdown (predict endpoint verdict)
    pred_counts: dict[str, dict[str, int]] = {c: {} for c in ("present", "absent", "irrelevant", "custom")}
    # Per-class outcome breakdown (measurement endpoint result)
    outcome_counts: dict[str, dict[str, int]] = {c: {} for c in ("present", "absent", "irrelevant", "custom")}

    session = requests.Session()
    n_total = args.warmup + args.iters
    for k in range(n_total):
        cls, img = pool[k % len(pool)]
        try:
            t, pred_label, pred_conf, outcome = run_one(
                session, args.base_url, img, measurement, headers
            )
        except Exception as e:
            print(f"  iter {k}: FAILED on {img.name} — {e}", file=sys.stderr)
            return 1
        tag = "warm" if k < args.warmup else "time"
        print(f"  [{tag} {k+1:2d}/{n_total}] {cls:<10} pred={pred_label:<8}({pred_conf:.2f}) "
              f"-> {outcome:<22} "
              + "  ".join(f"{s[:6]}={t[s]:7.1f}ms" for s in STAGES))
        if k >= args.warmup:
            for s in STAGES:
                samples[s].append(t[s])
            pred_counts[cls][pred_label] = pred_counts[cls].get(pred_label, 0) + 1
            outcome_counts[cls][outcome] = outcome_counts[cls].get(outcome, 0) + 1

    # Stage summary
    print()
    print(f"{'stage':<18} {'n':>4} {'median_ms':>12} {'p95_ms':>10}")
    print("-" * 48)
    rows: list[dict[str, Any]] = []
    host = host_string()
    for s in STAGES:
        med, p95 = percentiles(samples[s])
        print(f"{s:<18} {len(samples[s]):>4} {med:>12.1f} {p95:>10.1f}")
        rows.append({
            "stage": s,
            "n": len(samples[s]),
            "median_ms": round(med, 2),
            "p95_ms": round(p95, 2),
            "host": host,
        })

    # Per-class prediction breakdown (what /secchi/predict said)
    print()
    print("Classifier predictions per class (/secchi/predict):")
    for cls in ("present", "absent", "irrelevant", "custom"):
        counts = pred_counts.get(cls) or {}
        if not counts:
            continue
        total = sum(counts.values())
        parts = ", ".join(f"{lbl}={n}" for lbl, n in sorted(counts.items()))
        print(f"  {cls:<10} (n={total}): {parts}")

    # Per-class measurement outcome (what /measurements/secchi did)
    print()
    print("Pipeline outcome per class (/measurements/secchi):")
    for cls in ("present", "absent", "irrelevant", "custom"):
        counts = outcome_counts.get(cls) or {}
        if not counts:
            continue
        total = sum(counts.values())
        parts = ", ".join(f"{lbl}={n}" for lbl, n in sorted(counts.items()))
        print(f"  {cls:<10} (n={total}): {parts}")

    args.out_csv.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out_csv, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["stage", "n", "median_ms", "p95_ms", "host"])
        writer.writeheader()
        writer.writerows(rows)
    print()
    print(f"Wrote {args.out_csv}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
