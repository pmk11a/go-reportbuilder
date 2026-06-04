#!/usr/bin/env bash
# =============================================================================
# check-all.sh — Full Project Error & Warning Collector
# Compatible with bash 3.x (macOS default)
# =============================================================================
# USAGE:
#   ./scripts/check-all.sh                  # All checks
#   ./scripts/check-all.sh --backend-only   # Backend only
#   ./scripts/check-all.sh --frontend-only  # Frontend only
#   ./scripts/check-all.sh --clean          # Hapus semua log lama, lalu jalankan semua
#
# LOG STRATEGY (tidak ada yang hilang/tertimpa):
#   Setiap run → subfolder baru  tmp/runs/<timestamp>/
#   Selain itu selalu ada symlink  tmp/latest/ → run terbaru
#
#   tmp/
#   ├── latest/                       ← symlink ke run terbaru
#   │   ├── backend_build_raw.log
#   │   ├── backend_build_errors.log
#   │   ├── backend_vet_errors.log
#   │   ├── ...
#   │   └── check_report.md
#   └── runs/
#       ├── 20260601_012432/          ← run sebelumnya (tidak tertimpa)
#       └── 20260601_012754/          ← run ini
#
# BACA ERROR SETELAH RUN:
#   cat tmp/latest/*_errors.log
#   cat tmp/latest/*_warnings.log
#   cat tmp/latest/check_report.md
# =============================================================================

set -eo pipefail

# Global array to track child process PIDs spawned by the script
declare -a ACTIVE_PIDS=()

# ── Cleanup Handler (Mencegah Vitest worker / zombie nyangkut) ─────────────────
cleanup() {
  local EXIT_CODE=$?
  
  # Terminate all active child processes tracked by this script
  for pid in "${ACTIVE_PIDS[@]}"; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
      pkill -P "$pid" 2>/dev/null || true
    fi
  done

  # Hentikan semua child vitest forks & esbuild yang masih menggantung secara global
  pkill -f "vitest/dist/workers/forks.js" 2>/dev/null || true
  pkill -f "esbuild" 2>/dev/null || true
  pkill -f "node /Users/codemasx/Storage/my-htdocs/dapen/golang-next/frontend/node_modules/.bin/vitest" 2>/dev/null || true
  
  exit "$EXIT_CODE"
}
trap cleanup EXIT INT TERM

# ── Config ────────────────────────────────────────────────────────────────────
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
TMP_BASE="$PROJECT_ROOT/tmp"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
RUN_DIR="$TMP_BASE/runs/$TIMESTAMP"    # subfolder unik per run

RUN_BACKEND=true
RUN_FRONTEND=true
if [ "${1:-}" = "--backend-only" ];  then RUN_FRONTEND=false; fi
if [ "${1:-}" = "--frontend-only" ]; then RUN_BACKEND=false;  fi
if [ "${1:-}" = "--clean" ]; then
  echo "🗑️  Menghapus semua log lama di $TMP_BASE/runs/ ..."
  rm -rf "$TMP_BASE/runs" "$TMP_BASE/latest"
  echo "✅  Bersih. Melanjutkan jalankan semua checks..."
fi

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

# ── Initialise ────────────────────────────────────────────────────────────────
mkdir -p "$RUN_DIR"

# Update symlink latest/ → run terbaru
LATEST_LINK="$TMP_BASE/latest"
rm -f "$LATEST_LINK"
ln -sfn "$RUN_DIR" "$LATEST_LINK"

SUMMARY_FILE="$RUN_DIR/summary.txt"
TOTAL_ERRORS=0

section()  { echo -e "\n${CYAN}${BOLD}══ $* ══${RESET}"; }
ok()       { echo -e "${GREEN}✅  $*${RESET}"; }
warn_msg() { echo -e "${YELLOW}⚠️   $*${RESET}"; }
fail_msg() { echo -e "${RED}❌  $*${RESET}"; }

echo -e "${BOLD}Run ID : ${TIMESTAMP}${RESET}"
echo -e "Logs   : ${BOLD}${RUN_DIR}/${RESET}"
echo -e "Latest : ${BOLD}${LATEST_LINK}/${RESET}  (symlink ke run ini)"

# =============================================================================
# run_check <label> <cmd...>
# =============================================================================
run_check() {
  local LABEL="$1"; shift
  local SLUG="${LABEL// /_}"
  local RAW="$RUN_DIR/${SLUG}_raw.log"
  local ERR="$RUN_DIR/${SLUG}_errors.log"
  local WARN="$RUN_DIR/${SLUG}_warnings.log"

  section "$LABEL"

  # Jalankan command di background agar bisa kita monitor dan beri timeout
  "$@" > "$RAW" 2>&1 &
  local CMD_PID=$!
  ACTIVE_PIDS+=("$CMD_PID")

  # Tentukan batas timeout (dalam detik). default: 120s
  local TIMEOUT_LIMIT=120
  # Berikan waktu lebih untuk compile frontend dan unit tests
  if [[ "$SLUG" == *"frontend_build"* ]] || [[ "$SLUG" == *"frontend_test"* ]]; then
    TIMEOUT_LIMIT=180
  fi

  local ELAPSED=0
  local TIMED_OUT=false
  local CMD_STATUS=0

  while kill -0 "$CMD_PID" 2>/dev/null; do
    sleep 1
    ELAPSED=$((ELAPSED + 1))
    if [ "$ELAPSED" -ge "$TIMEOUT_LIMIT" ]; then
      TIMED_OUT=true
      warn_msg "$LABEL took too long (>${TIMEOUT_LIMIT}s). Force killing..."
      kill -9 "$CMD_PID" 2>/dev/null || true
      pkill -P "$CMD_PID" 2>/dev/null || true
      pkill -f "vitest/dist/workers/forks.js" 2>/dev/null || true
      break
    fi
  done

  if $TIMED_OUT; then
    CMD_STATUS=124
    echo "❌ TIMEOUT: Command timed out after ${TIMEOUT_LIMIT}s and was force-killed." >> "$RAW"
  else
    wait "$CMD_PID" 2>/dev/null || CMD_STATUS=$?
  fi

  # Grep errors (pola regex diperluas agar menangkap pola kompilasi / test failures secara komprehensif)
  grep -iE \
    '(\berror\b|\bERROR\b|FAIL[: ]|panic:|undefined:|cannot |syntax error|build failed|type error|✗|✖|No tests ran|repeats json tag|declared but not used|imported and not used|has no field or method|too many arguments|not enough arguments|invalid memory address|nil pointer dereference|:[0-9]+:[0-9]+:)' \
    "$RAW" \
    | grep -Ev '^[[:space:]]*$' \
    > "$ERR" 2>/dev/null || true

  # Jika command gagal tapi tidak ada line yang match regex, dump raw seluruhnya
  if [ "$CMD_STATUS" -ne 0 ] && ! [ -s "$ERR" ]; then
    cat "$RAW" > "$ERR"
  fi

  # Grep warnings
  grep -iE \
    '(\bwarning\b|WARN[: ]|deprecated|suggestion:| note:| hint:)' \
    "$RAW" \
    | grep -Ev '^[[:space:]]*$' \
    > "$WARN" 2>/dev/null || true

  local E_COUNT W_COUNT
  E_COUNT="$(wc -l < "$ERR" | tr -d ' ')"
  W_COUNT="$(wc -l < "$WARN" | tr -d ' ')"

  local STATUS="PASS"
  if [ "$CMD_STATUS" -ne 0 ]; then
    STATUS="FAIL"
    TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
  else
    # Jika command berhasil (exit 0), abaikan error palsu/mock logs dari unit tests
    > "$ERR"
    E_COUNT=0
  fi

  if [ "$STATUS" = "PASS" ]; then
    ok "$LABEL  (warnings: $W_COUNT)"
  else
    fail_msg "$LABEL  (errors: $E_COUNT, warnings: $W_COUNT)"
    if [ "$E_COUNT" -gt 0 ]; then
      echo -e "${RED}--- First 20 error lines ---${RESET}"
      head -20 "$ERR"
      [ "$E_COUNT" -gt 20 ] && echo "  ... lihat $ERR"
    else
      echo -e "${RED}--- Command failed (exit $CMD_STATUS), first 20 lines ---${RESET}"
      head -20 "$RAW"
    fi
  fi

  if [ "$W_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}--- First 10 warning lines ---${RESET}"
    head -10 "$WARN"
  fi

  echo "  📄 Raw   : $RAW"
  echo "  🔴 Errors: $ERR  ($E_COUNT)"
  echo "  🟡 Warns : $WARN ($W_COUNT)"

  printf "%-30s | %-4s | errors=%-4s | warnings=%s\n" \
    "$LABEL" "$STATUS" "$E_COUNT" "$W_COUNT" >> "$SUMMARY_FILE"
}

# =============================================================================
# BACKEND
# =============================================================================
if $RUN_BACKEND; then
  section "BACKEND CHECKS"
  cd "$BACKEND_DIR"

  run_check "backend_build"  go build -v ./...
  run_check "backend_vet"    go vet ./...
  run_check "backend_test"   \
    go test -coverprofile="$RUN_DIR/backend_coverage.out" ./... -count=1

  # Coverage — hitung hanya dari package yang punya test
  if [ -f "$RUN_DIR/backend_coverage.out" ]; then
    COV_ALL="$(go tool cover -func="$RUN_DIR/backend_coverage.out" 2>/dev/null \
          | grep "^total" | awk '{print $3}' || echo "0%")"

    COV_TESTED="$(go tool cover -func="$RUN_DIR/backend_coverage.out" 2>/dev/null \
          | grep -v '^total' \
          | grep -v '[[:space:]]0\.0%$' \
          | awk '{gsub(/%/,"",$3); sum+=$3; count++} END{if(count>0) printf "%.1f%%", sum/count; else print "0%"}')"

    echo "  📊 Coverage total   : ${COV_ALL}"
    echo "  📊 Coverage tested  : ${BOLD}${COV_TESTED}${RESET}  ← threshold dihitung dari ini"
    echo "coverage_all=$COV_ALL"    >> "$SUMMARY_FILE"
    echo "coverage_tested=$COV_TESTED" >> "$SUMMARY_FILE"

    COV_NUM="${COV_TESTED/\%/}"
    if awk "BEGIN{exit !(${COV_NUM:-0} < 80)}"; then
      fail_msg "Coverage tested ${COV_TESTED} di bawah threshold 80%!"
      echo "  💡 Per-package breakdown:"
      go tool cover -func="$RUN_DIR/backend_coverage.out" 2>/dev/null \
        | grep -E '/internal/' | awk '{printf "     %-70s %s\n", $1"/"$2, $3}'
      TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
    else
      ok "Coverage tested ${COV_TESTED} memenuhi ≥80% threshold"
    fi
  fi
fi

# =============================================================================
# FRONTEND
# =============================================================================
if $RUN_FRONTEND; then
  section "FRONTEND CHECKS"
  cd "$FRONTEND_DIR"

  run_check "frontend_typecheck"  npm run type-check
  run_check "frontend_build"      npm run build
  run_check "frontend_test"       npm test -- --run

  if npm run 2>/dev/null | grep -q "^\s*lint"; then
    run_check "frontend_lint"     npm run lint
  fi
fi

# =============================================================================
# REPORT MARKDOWN
# =============================================================================
REPORT="$RUN_DIR/check_report.md"
{
  printf -- "# Check Report\n"
  printf -- "- Run ID   : %s\n" "$TIMESTAMP"
  printf -- "- Mode     : %s\n" "${1:-all}"
  printf -- "- DateTime : %s\n\n" "$(date '+%Y-%m-%d %H:%M:%S')"

  printf "## Summary\n\n"
  printf "| Check | Status | Errors | Warnings |\n"
  printf "|-------|--------|--------|----------|\n"
  while IFS='|' read -r lbl status errs warns; do
    e="${errs#errors=}"; e="${e%% *}"; e="$(echo "$e" | tr -d ' ')"
    w="${warns#warnings=}";             w="$(echo "$w" | tr -d ' ')"
    icon="✅"; echo "$status" | grep -q "FAIL" && icon="❌"
    printf "| %s | %s %s | %s | %s |\n" \
      "$(echo "$lbl" | tr -d ' ')" "$icon" "$(echo "$status" | tr -d ' ')" "$e" "$w"
  done < "$SUMMARY_FILE"

  printf "\n## Errors\n"
  for f in "$RUN_DIR"/*_errors.log; do
    [ -s "$f" ] || continue
    printf "\n### %s\n\`\`\`\n" "$(basename "$f" _errors.log)"
    cat "$f"; printf "\`\`\`\n"
  done

  printf "\n## Warnings\n"
  for f in "$RUN_DIR"/*_warnings.log; do
    [ -s "$f" ] || continue
    printf "\n### %s\n\`\`\`\n" "$(basename "$f" _warnings.log)"
    cat "$f"; printf "\`\`\`\n"
  done
} > "$REPORT"

# =============================================================================
# FINAL SUMMARY
# =============================================================================
section "FINAL RESULT"
echo ""
cat "$SUMMARY_FILE"
echo ""
echo -e "  📋 Report  : ${BOLD}$REPORT${RESET}"
echo -e "  📂 Run dir : ${BOLD}$RUN_DIR${RESET}"
echo -e "  🔗 Latest  : ${BOLD}$LATEST_LINK${RESET}  (selalu menunjuk ke run terbaru)"
echo ""
echo -e "${BOLD}Baca semua error sekaligus:${RESET}"
echo "  cat $LATEST_LINK/*_errors.log"
echo "  cat $LATEST_LINK/*_warnings.log"
echo ""
echo -e "${BOLD}Lihat run sebelumnya:${RESET}"
echo "  ls $TMP_BASE/runs/"
echo "  cat $TMP_BASE/runs/<timestamp>/*_errors.log"
echo ""

if [ "$TOTAL_ERRORS" -gt 0 ]; then
  fail_msg "Total checks gagal: ${TOTAL_ERRORS} — fix batch lalu run ulang"
  exit 1
else
  ok "Semua checks passed! 🎉"
  exit 0
fi
