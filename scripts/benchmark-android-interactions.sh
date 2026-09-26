#!/usr/bin/env bash
set -euo pipefail

if (( $# < 3 )); then
  echo "Usage: $0 PACKAGE LABEL X:Y [X:Y ...]" >&2
  echo "Example: $0 com.kompyler.wakaboard insights 150:430 345:430 540:430" >&2
  exit 2
fi

package=$1
label=$2
shift 2
adb_args=()
if [[ -n "${ADB_SERIAL:-}" ]]; then adb_args=(-s "$ADB_SERIAL"); fi

echo 'label,run,x,y,frames,janky,p50_ms,p90_ms,p95_ms'
run=0
for point in "$@"; do
  if [[ ! $point =~ ^[0-9]+:[0-9]+$ ]]; then
    echo "Invalid tap coordinate: $point (expected X:Y)" >&2
    exit 2
  fi
  x=${point%%:*}
  y=${point##*:}
  ((run += 1))
  adb "${adb_args[@]}" shell dumpsys gfxinfo "$package" reset >/dev/null
  adb "${adb_args[@]}" shell input tap "$x" "$y"
  sleep "${BENCH_SETTLE_SECONDS:-1.5}"
  report=$(adb "${adb_args[@]}" shell dumpsys gfxinfo "$package")
  printf '%s\n' "$report" | awk -v label="$label" -v run="$run" -v x="$x" -v y="$y" '
    /^Total frames rendered:/ { frames=$4 }
    /^Janky frames:/ { janky=$3 }
    /^50th percentile:/ { p50=$3 }
    /^90th percentile:/ { p90=$3 }
    /^95th percentile:/ { p95=$3 }
    END {
      gsub(/ms/, "", p50); gsub(/ms/, "", p90); gsub(/ms/, "", p95)
      printf "%s,%d,%d,%d,%d,%d,%s,%s,%s\n", label, run, x, y, frames, janky, p50, p90, p95
    }
  '
done
