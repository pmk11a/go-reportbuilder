#!/usr/bin/env bash
# .claude/hooks/auto-check.sh
# PostToolUse hook for Edit|Write on backend/**/*.go or frontend/**/*.{ts,tsx,jsx,js}.
#
# Runs a FAST subset of ./scripts/check-all.sh:
#   - backend -> go build ./...        (~5-15s)
#   - frontend -> npx tsc --noEmit     (~5-15s)
#
# The FULL check-all.sh (vet, tests, coverage, lint, build, etc.) is still
# gated to /verify or explicit invocation. This hook is feedback, not gating.
#
# Debounce: per-scope 30-60s. The full sweep is wasteful if the user is
# mid-typing; a fast subset catches the obvious regressions (compile errors,
# type errors) right after each save.

set -u

# ---- Config ----------------------------------------------------------------

PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-/Users/codemasx/Storage/my-htdocs/dapen/golang-next}"
TMP_DIR="$PROJECT_ROOT/tmp"
BACKEND_DEBOUNCE_FILE="$TMP_DIR/.auto_check_backend_ts"
FRONTEND_DEBOUNCE_FILE="$TMP_DIR/.auto_check_frontend_ts"
BACKEND_DEBOUNCE_SECONDS=60
FRONTEND_DEBOUNCE_SECONDS=30
MAX_OUTPUT_LINES=20

# ---- Read tool input from stdin -------------------------------------------

INPUT="$(cat 2>/dev/null || true)"

if [ -z "$INPUT" ]; then
  exit 0
fi

# Extract file_path. Claude Code's PostToolUse passes JSON with tool_input.file_path
# or (for some tools) tool_input.filePath. Be defensive.
FILE_PATH="$(printf '%s' "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    ti = d.get('tool_input', {}) or {}
    print(ti.get('file_path') or ti.get('filePath') or '')
except Exception:
    pass
" 2>/dev/null)"

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# ---- Skip non-relevant paths ----------------------------------------------

case "$FILE_PATH" in
  */.claude/*|*/.gemini/*|*/scripts/*|*/tasks/*|*/.templates/*|*/docs/*|\
  */.git/*|*/tmp/*|*/node_modules/*|*/vendor/*|*/dist/*|*/coverage/*|\
  */.next/*|*/.tanstack/*|*/main|*main)
    exit 0
    ;;
esac

# ---- Pick scope ------------------------------------------------------------

case "$FILE_PATH" in
  */backend/*.go)
    SCOPE="backend"
    CWD="backend"
    CMD=(go build ./...)
    DEBOUNCE_FILE="$BACKEND_DEBOUNCE_FILE"
    DEBOUNCE_SECONDS=$BACKEND_DEBOUNCE_SECONDS
    ;;
  */frontend/*)
    case "$FILE_PATH" in
      *.ts|*.tsx|*.jsx|*.js)
        SCOPE="frontend"
        CWD="frontend"
        CMD=(npx --no-install tsc --noEmit)
        DEBOUNCE_FILE="$FRONTEND_DEBOUNCE_FILE"
        DEBOUNCE_SECONDS=$FRONTEND_DEBOUNCE_SECONDS
        ;;
      *)
        exit 0
        ;;
    esac
    ;;
  *)
    exit 0
    ;;
esac

# ---- Debounce --------------------------------------------------------------

mkdir -p "$TMP_DIR" 2>/dev/null || true

if [ -f "$DEBOUNCE_FILE" ]; then
  LAST="$(cat "$DEBOUNCE_FILE" 2>/dev/null || echo 0)"
  NOW="$(date +%s)"
  if [ -n "$LAST" ] && [ "$LAST" -gt 0 ] 2>/dev/null; then
    DIFF=$((NOW - LAST))
    if [ "$DIFF" -lt "$DEBOUNCE_SECONDS" ] 2>/dev/null; then
      exit 0
    fi
  fi
fi

# ---- Run the check ---------------------------------------------------------

if [ ! -d "$PROJECT_ROOT/$CWD" ]; then
  exit 0
fi

cd "$PROJECT_ROOT/$CWD" || exit 0

START="$(date +%s)"
OUTPUT="$("${CMD[@]}" 2>&1)"
EXIT=$?
END="$(date +%s)"
DUR=$((END - START))

# Update debounce marker
date +%s > "$DEBOUNCE_FILE" 2>/dev/null || true

# ---- Report ----------------------------------------------------------------

if [ "$EXIT" -eq 0 ]; then
  printf '\033[2m✓ auto-check (%s, %ss): %s — PASS\033[0m\n' \
    "$SCOPE" "$DUR" "${CMD[*]}" >&2
  exit 0
else
  printf '\033[31m✗ auto-check (%s, %ss): %s — FAIL (exit %d)\033[0m\n' \
    "$SCOPE" "$DUR" "${CMD[*]}" "$EXIT" >&2
  printf '%s\n' "$OUTPUT" | head -n "$MAX_OUTPUT_LINES" >&2
  if [ "$(printf '%s\n' "$OUTPUT" | wc -l)" -gt "$MAX_OUTPUT_LINES" ]; then
    printf '\033[2m… (truncated; run /verify for the full report)\033[0m\n' >&2
  fi
  # Always exit 0 — never block Claude. The output is enough signal.
  exit 0
fi
