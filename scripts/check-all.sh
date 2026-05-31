#!/usr/bin/env bash
# =============================================================================
# check-all.sh — Full Project Error & Warning Collector
# =============================================================================
# Usage: ./scripts/check-all.sh [--backend-only | --frontend-only]
#
# Runs ALL build/type/test checks for the project and consolidates every
# error and warning into tmp/ so they can be read and fixed IN BATCH.
# Never run individual checks one-by-one — always use this script first.
# =============================================================================

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
TMP_DIR="$PROJECT_ROOT/tmp"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

RUN_BACKEND=true
RUN_FRONTEND=true
if [[ "${1:-}" == "--backend-only" ]]; then RUN_FRONTEND=false; fi
if [[ "${1:-}" == "--frontend-only" ]]; then RUN_BACKEND=false; fi

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

# ── Helpers ───────────────────────────────────────────────────────────────────
mkdir -p "$TMP_DIR"

section()  { echo -e "\n${CYAN}${BOLD}══ $* ══${RESET}"; }
ok()       { echo -e "${GREEN}✅ $*${RESET}"; }
warn_msg() { echo -e "${YELLOW}⚠️  $*${RESET}"; }
fail_msg() { echo -e "${RED}❌ $*${RESET}"; }

# Accumulate exit codes – we always run all checks, never exit early
ERRORS=0
declare -A STEP_STATUS   # STEP_STATUS[name]="pass|fail|warn"
declare -A STEP_COUNTS   # STEP_COUNTS[name]="E:0 W:0"

# Run a command, capture stdout+stderr, grep for errors & warnings
# Usage: run_check <label> <error_file> <warn_file> <cmd...>
run_check() {
  local label="$1" err_file="$2" warn_file="$3"
  shift 3

  local raw_file="$TMP_DIR/${label// /_}_raw.log"
  section "$label"

  # Run command, tee to raw log, always succeed
  if "$@" > "$raw_file" 2>&1; then
    STEP_STATUS[$label]="pass"
  else
    STEP_STATUS[$label]="fail"
    ERRORS=$((ERRORS + 1))
  fi

  # ── Grep errors (lines with error keywords) ────────────────────────────────
  grep -iE \
    '(\berror\b|FAIL|panic:|undefined:|cannot|syntax error|build failed|type error|✗|✖)' \
    "$raw_file" \
    | grep -vE '^(#|\/\/)' \
    > "$err_file" 2>/dev/null || true

  # ── Grep warnings ──────────────────────────────────────────────────────────
  grep -iE \
    '(\bwarning\b|WARN|deprecated|suggestion:|note:)' \
    "$raw_file" \
    | grep -vE '^(#|\/\/)' \
    > "$warn_file" 2>/dev/null || true

  local e_count w_count
  e_count=$(wc -l < "$err_file" | tr -d ' ')
  w_count=$(wc -l < "$warn_file" | tr -d ' ')
  STEP_COUNTS[$label]="E:${e_count} W:${w_count}"

  if [[ "${STEP_STATUS[$label]}" == "pass" && "$e_count" -eq 0 ]]; then
    ok "$label — passed (warnings: $w_count)"
  else
    fail_msg "$label — FAILED (errors: $e_count, warnings: $w_count)"
    echo -e "${RED}--- First 20 error lines ---${RESET}"
    head -20 "$err_file" || true
    [[ "$e_count" -gt 20 ]] && echo "  ... (see $err_file for all)"
  fi

  # Preview warnings briefly
  if [[ "$w_count" -gt 0 ]]; then
    echo -e "${YELLOW}--- First 10 warning lines ---${RESET}"
    head -10 "$warn_file" || true
  fi

  echo "  📄 Raw log  : $raw_file"
  echo "  🔴 Errors   : $err_file ($e_count lines)"
  echo "  🟡 Warnings : $warn_file ($w_count lines)"
}

# =============================================================================
# BACKEND CHECKS
# =============================================================================
if $RUN_BACKEND; then
  section "BACKEND"
  cd "$BACKEND_DIR"

  # 1. Go build
  run_check "backend_build" \
    "$TMP_DIR/backend_build_errors.log" \
    "$TMP_DIR/backend_build_warnings.log" \
    go build -v ./...

  # 2. Go vet (static analysis / warnings)
  run_check "backend_vet" \
    "$TMP_DIR/backend_vet_errors.log" \
    "$TMP_DIR/backend_vet_warnings.log" \
    go vet ./...

  # 3. Go test + coverage
  run_check "backend_test" \
    "$TMP_DIR/backend_test_errors.log" \
    "$TMP_DIR/backend_test_warnings.log" \
    go test -coverprofile="$TMP_DIR/backend_coverage.out" ./... -count=1

  # Extract coverage total
  if [[ -f "$TMP_DIR/backend_coverage.out" ]]; then
    COV=$(go tool cover -func="$TMP_DIR/backend_coverage.out" 2>/dev/null \
          | grep "^total" | awk '{print $3}' || echo "N/A")
    echo -e "  📊 Coverage : ${BOLD}${COV}${RESET}"
    echo "total_coverage=$COV" >> "$TMP_DIR/backend_summary.txt"

    # Coverage threshold check (80%)
    COV_NUM="${COV/\%/}"
    if awk "BEGIN{exit !($COV_NUM < 80)}"; then
      fail_msg "Coverage ${COV} is below 80% threshold!"
      ERRORS=$((ERRORS + 1))
    else
      ok "Coverage ${COV} meets ≥80% threshold"
    fi
  fi
fi

# =============================================================================
# FRONTEND CHECKS
# =============================================================================
if $RUN_FRONTEND; then
  section "FRONTEND"
  cd "$FRONTEND_DIR"

  # 4. TypeScript type-check
  run_check "frontend_typecheck" \
    "$TMP_DIR/frontend_typecheck_errors.log" \
    "$TMP_DIR/frontend_typecheck_warnings.log" \
    npm run type-check

  # 5. Frontend build
  run_check "frontend_build" \
    "$TMP_DIR/frontend_build_errors.log" \
    "$TMP_DIR/frontend_build_warnings.log" \
    npm run build

  # 6. Frontend unit tests (vitest)
  run_check "frontend_test" \
    "$TMP_DIR/frontend_test_errors.log" \
    "$TMP_DIR/frontend_test_warnings.log" \
    npm test -- --run

  # 7. ESLint (optional – skip if not configured)
  if npm run --silent 2>/dev/null | grep -q "lint"; then
    run_check "frontend_lint" \
      "$TMP_DIR/frontend_lint_errors.log" \
      "$TMP_DIR/frontend_lint_warnings.log" \
      npm run lint
  fi
fi

# =============================================================================
# CONSOLIDATED REPORT
# =============================================================================
REPORT="$TMP_DIR/check_report_${TIMESTAMP}.md"

{
  echo "# Check Report — $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
  echo "## Summary"
  echo ""
  echo "| Check | Status | Errors | Warnings |"
  echo "|-------|--------|--------|----------|"
  for label in "${!STEP_STATUS[@]}"; do
    status="${STEP_STATUS[$label]}"
    counts="${STEP_COUNTS[$label]}"
    e="${counts#E:}"; e="${e% W:*}"
    w="${counts#*W:}"
    icon="✅"
    [[ "$status" == "fail" ]] && icon="❌"
    echo "| $label | $icon $status | $e | $w |"
  done

  echo ""
  echo "## Error Details"
  for f in "$TMP_DIR"/*_errors.log; do
    [[ -s "$f" ]] || continue
    name="$(basename "$f" _errors.log)"
    echo ""
    echo "### $name"
    echo '```'
    cat "$f"
    echo '```'
  done

  echo ""
  echo "## Warning Details"
  for f in "$TMP_DIR"/*_warnings.log; do
    [[ -s "$f" ]] || continue
    name="$(basename "$f" _warnings.log)"
    echo ""
    echo "### $name"
    echo '```'
    cat "$f"
    echo '```'
  done
} > "$REPORT"

# =============================================================================
# FINAL SUMMARY
# =============================================================================
section "FINAL RESULT"
echo ""
for label in "${!STEP_STATUS[@]}"; do
  status="${STEP_STATUS[$label]}"
  counts="${STEP_COUNTS[$label]}"
  if [[ "$status" == "pass" ]]; then
    ok "$label (${counts})"
  else
    fail_msg "$label (${counts})"
  fi
done

echo ""
echo -e "  📋 Full report : ${BOLD}$REPORT${RESET}"
echo -e "  📁 All logs    : ${BOLD}$TMP_DIR/${RESET}"
echo ""

if [[ "$ERRORS" -gt 0 ]]; then
  fail_msg "Total failed checks: ${ERRORS}"
  echo ""
  echo -e "${BOLD}Quick commands to view all errors at once:${RESET}"
  echo "  cat $TMP_DIR/*_errors.log"
  echo "  grep -h '' $TMP_DIR/*_errors.log | sort | uniq"
  echo ""
  exit 1
else
  ok "All checks passed! 🎉"
  exit 0
fi
