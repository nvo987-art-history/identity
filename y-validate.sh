#!/usr/bin/env bash
set -e

# ========================
# CONFIG
# ========================

EXPECTED_DOMAIN="identity.nvo987.us"
WATCH_MODE=false

if [[ "$1" == "--watch" ]]; then
  WATCH_MODE=true
fi

RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
NC="\033[0m"

echo -e "${YELLOW}=== NVO987 Identity Validator (${EXPECTED_DOMAIN}) ===${NC}"

# ========================
# DEPENDENCY CHECK (WATCH)
# ========================

if $WATCH_MODE; then
  if ! command -v inotifywait >/dev/null 2>&1; then
    echo -e "${RED}✗ inotify-tools not installed.${NC}"
    echo "Install: sudo apt install inotify-tools"
    exit 1
  fi
fi

# ========================
# VALIDATORS
# ========================

ERRORS=0

validate_json() {
  local file="$1"
  if ! jq empty "$file" 2>/dev/null; then
    echo -e "${RED}✗ JSON error:${NC} $file"
    ERRORS=$((ERRORS+1))
  else
    echo -e "${GREEN}✓ JSON OK:${NC} $file"
  fi
}

validate_ndjson() {
  local file="$1"
  local line=0
  while IFS= read -r row; do
    line=$((line+1))
    if ! echo "$row" | jq empty 2>/dev/null; then
      echo -e "${RED}✗ NDJSON error:${NC} $file (line $line)"
      ERRORS=$((ERRORS+1))
    fi
  done < "$file"
  echo -e "${GREEN}✓ NDJSON OK:${NC} $file"
}

validate_xml() {
  local file="$1"
  if ! xmllint --noout "$file" 2>/dev/null; then
    echo -e "${RED}✗ XML error:${NC} $file"
    ERRORS=$((ERRORS+1))
  else
    echo -e "${GREEN}✓ XML OK:${NC} $file"
  fi
}

validate_html() {
  local file="$1"
  if ! tidy -errors -q "$file" 2>/dev/null; then
    echo -e "${YELLOW}⚠ HTML warnings:${NC} $file"
  else
    echo -e "${GREEN}✓ HTML OK:${NC} $file"
  fi
}

validate_txt() {
  local file="$1"
  if [[ ! -s "$file" ]]; then
    echo -e "${RED}✗ TXT empty:${NC} $file"
    ERRORS=$((ERRORS+1))
  else
    echo -e "${GREEN}✓ TXT OK:${NC} $file"
  fi
}

# ========================
# IDENTITY JSON CHECK
# ========================

validate_identity_json() {
  local file="$1"

  local domain canonical
  domain=$(jq -r '.domain // empty' "$file" 2>/dev/null)
  canonical=$(jq -r '.canonical // empty' "$file" 2>/dev/null)

  if [ -n "$domain" ] && [ "$domain" != "https://${EXPECTED_DOMAIN}" ]; then
    echo -e "${RED}✗ Domain mismatch:${NC} $file ($domain)"
    ERRORS=$((ERRORS+1))
  fi

  if [ -n "$canonical" ] && [[ "$canonical" != https://${EXPECTED_DOMAIN}* ]]; then
    echo -e "${RED}✗ Canonical mismatch:${NC} $file ($canonical)"
    ERRORS=$((ERRORS+1))
  fi
}

# ========================
# .well-known CHECK
# ========================

check_well_known() {
  echo
  echo "Checking .well-known files..."

  local files=(
    ".well-known/security.txt"
    ".well-known/ai.json"
    ".well-known/knowledge.json"
  )

  for f in "${files[@]}"; do
    if [ ! -f "$f" ]; then
      echo -e "${RED}✗ Missing:${NC} $f"
      ERRORS=$((ERRORS+1))
    else
      echo -e "${GREEN}✓ Found:${NC} $f"
    fi
  done
}

# ========================
# API CHECK
# ========================

check_api() {
  if [ -d "api" ]; then
    echo
    echo "API directory detected – validating API files..."

    find api -type f | while read -r api_file; do
      case "$api_file" in
        *.json)   validate_json "$api_file" ;;
        *.ndjson) validate_ndjson "$api_file" ;;
        *.xml)    validate_xml "$api_file" ;;
        *.txt)    validate_txt "$api_file" ;;
      esac
    done
  else
    echo
    echo "No API directory detected (OK)."
  fi
}

# ========================
# MAIN VALIDATION RUN
# ========================

run_validation() {
  ERRORS=0

  echo
  echo -e "${YELLOW}--- Running validation ---${NC}"

  while IFS= read -r file; do
    case "$file" in
      *.json)
        validate_json "$file"
        validate_identity_json "$file"
        ;;
      *.ndjson) validate_ndjson "$file" ;;
      *.xml)    validate_xml "$file" ;;
      *.html)   validate_html "$file" ;;
      *.txt)    validate_txt "$file" ;;
    esac
  done < <(find . -type f ! -path "./.git/*" ! -path "./api/*")

  check_well_known
  check_api

  echo
  if [ "$ERRORS" -gt 0 ]; then
    echo -e "${RED}✗ Validation failed: $ERRORS error(s).${NC}"
  else
    echo -e "${GREEN}✓ identity.nvo987.us fully validated.${NC}"
  fi
}

# ========================
# RUN / WATCH
# ========================

if $WATCH_MODE; then
  echo
  echo -e "${YELLOW}Watching for file changes... (Ctrl+C to stop)${NC}"
  run_validation
  inotifywait -m -r -e modify,create,delete . --exclude '\.git' |
  while read -r _; do
    clear
    run_validation
  done
else
  run_validation
fi
