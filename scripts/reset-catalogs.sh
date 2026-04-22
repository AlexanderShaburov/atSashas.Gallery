#!/usr/bin/env bash
# reset-catalogs.sh
#
# Resets the on-disk catalog data under `vault/json/` to a clean
# "empty catalog" state — the same state the backend would produce on
# a fresh deployment with no prior data.
#
# Scope (from the request):
#   * block catalog     → vault/json/block_collection/block_collection.json
#   * art item catalog  → vault/json/art_catalog.json
#   * media item catalog→ vault/json/media_items/catalog.json
#   * stream catalog    → vault/json/streams/index.json  +  vault/json/streams/{id}.json
#   * event catalog     → vault/json/event_pages/catalog.json
#   * homepage          → vault/json/public/home.json
#
# Deliberately NOT touched (outside the request):
#   * vault/json/users.json        — admin credentials
#   * vault/json/text_visuals/     — text visual catalog
#   * vault/json/techniques.json   — techniques lookup
#   * vault/json/catalog.json      — loose legacy file
#   * vault/arts/**  vault/streams/**  vault/hopper/**  — binary media assets
#   * everything outside vault/json/
#
# The script reconstructs each JSON file with the canonical empty shape
# produced by the corresponding Python repo (see
# apps/admin-backend/app/repos/*.py). It does NOT delete the JSON files
# themselves; it overwrites them with the empty-shape payload. Stream
# per-id files are an exception — with no streams we remove them so the
# streams directory matches an empty state.
#
# Usage:
#   scripts/reset-catalogs.sh             # prompts for confirmation
#   scripts/reset-catalogs.sh --yes       # skip the confirmation prompt
#   scripts/reset-catalogs.sh --dry-run   # show what would change
#   scripts/reset-catalogs.sh --help
#
# Safety guardrails:
#   * Refuses to run unless invoked from (or scoped to) a real atSashas.Gallery
#     checkout — looks for the `vault/json/`, `apps/admin-backend/`, and
#     `knowledge/` sibling directories relative to this script.
#   * Writes only to an explicit allowlist of files under vault/json/.
#   * Never uses `rm -rf` on a path that wasn't verified to be a specific
#     file under the vault.
#   * Idempotent: safe to re-run against an already-empty vault.

set -euo pipefail

# ---------------------------------------------------------------------------
# Flag parsing
# ---------------------------------------------------------------------------

DRY_RUN=0
ASSUME_YES=0

usage() {
    sed -n '2,40p' "$0"
}

for arg in "$@"; do
    case "$arg" in
        --dry-run)   DRY_RUN=1 ;;
        --yes|-y)    ASSUME_YES=1 ;;
        --help|-h)   usage; exit 0 ;;
        *)
            echo "Unknown argument: $arg" >&2
            echo "Use --help for usage." >&2
            exit 2
            ;;
    esac
done

# ---------------------------------------------------------------------------
# Repo-root detection
#
# The script must resolve to the atSashas.Gallery checkout it sits inside.
# We locate the repo root relative to the script file itself, then verify
# that it looks like the expected project layout.
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
VAULT_JSON="$REPO_ROOT/vault/json"

# Sanity check — refuse to run anywhere that does not look like this repo.
for marker in \
    "$REPO_ROOT/apps/admin-backend/app/settings.py" \
    "$REPO_ROOT/apps/frontend/package.json" \
    "$REPO_ROOT/knowledge/index/index--system--project-navigation.md" \
    ; do
    if [ ! -e "$marker" ]; then
        echo "ERROR: missing expected repo marker: $marker" >&2
        echo "       Refusing to run — this does not look like the atSashas.Gallery repo." >&2
        exit 3
    fi
done

if [ ! -d "$VAULT_JSON" ]; then
    echo "ERROR: vault JSON directory not found: $VAULT_JSON" >&2
    echo "       (A clean deploy may not have provisioned vault/json/ yet. The" >&2
    echo "        backend creates it on first start — run the backend once, then" >&2
    echo "        re-run this script if you want to ensure empty-shape JSON files.)" >&2
    exit 4
fi

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# UTC timestamps. Two formats matching the backend models:
#   ISO_DATETIME  — "2026-04-22T10:00:00+00:00"   (most catalogs)
#   ISO_DATE      — "2026-04-22"                   (BlockCollection only — its
#                                                   ISODate field is YYYY-MM-DD)
ISO_DATETIME="$(date -u +%Y-%m-%dT%H:%M:%S+00:00)"
ISO_DATE="$(date -u +%Y-%m-%d)"

log() {
    printf '%s\n' "$*"
}

# write_file <absolute-path> <contents>
#
# Overwrites the target file with the given contents. Never writes outside
# VAULT_JSON. Creates the parent directory if missing. In dry-run mode
# only prints what would happen.
write_file() {
    local target="$1"
    local contents="$2"

    case "$target" in
        "$VAULT_JSON"/*) : ;;
        *)
            echo "REFUSED: target not under $VAULT_JSON : $target" >&2
            exit 5
            ;;
    esac

    local parent
    parent="$(dirname "$target")"

    if [ "$DRY_RUN" -eq 1 ]; then
        log "[dry-run] mkdir -p $parent"
        log "[dry-run] write empty catalog → $target"
        return 0
    fi

    mkdir -p "$parent"
    printf '%s\n' "$contents" > "$target"
    log "reset → $target"
}

# remove_stream_files
#
# Streams are stored one-file-per-stream at vault/json/streams/{id}.json,
# indexed by vault/json/streams/index.json. With an empty index, the
# per-stream files are orphans and should be removed. This helper walks
# the streams directory and removes ONLY *.json files that are NOT the
# index, and ONLY if the path sits under the expected streams dir.
remove_stream_files() {
    local streams_dir="$VAULT_JSON/streams"
    if [ ! -d "$streams_dir" ]; then
        return 0
    fi

    # Use find with -maxdepth 1 so we never descend into an unexpected
    # subdirectory. Match only *.json and explicitly skip index.json.
    local file
    while IFS= read -r -d '' file; do
        case "$file" in
            "$streams_dir"/index.json) continue ;;
            "$streams_dir"/*.json) : ;;
            *) continue ;;  # paranoia
        esac

        if [ "$DRY_RUN" -eq 1 ]; then
            log "[dry-run] remove stream file → $file"
        else
            rm -- "$file"
            log "removed stream file → $file"
        fi
    done < <(find "$streams_dir" -maxdepth 1 -type f -name '*.json' -print0)
}

# ---------------------------------------------------------------------------
# Confirmation prompt
# ---------------------------------------------------------------------------

cat <<EOF

About to reset the following catalogs under:
    $VAULT_JSON

  * block_collection/block_collection.json    (block catalog)
  * art_catalog.json                          (art items)
  * media_items/catalog.json                  (media items)
  * streams/index.json + per-stream files     (streams)
  * event_pages/catalog.json                  (event pages)
  * public/home.json                          (homepage)

Preserved (outside the requested scope):
  * users.json, text_visuals/, techniques.json, catalog.json (loose)
  * vault/arts/**, vault/streams/** (binary assets), vault/hopper/**

EOF

if [ "$DRY_RUN" -eq 1 ]; then
    log "Mode: --dry-run (no files will be written)"
elif [ "$ASSUME_YES" -eq 1 ]; then
    log "Mode: --yes (skipping confirmation)"
else
    printf 'Type "reset" to proceed, anything else to abort: '
    read -r reply
    if [ "$reply" != "reset" ]; then
        echo "Aborted." >&2
        exit 1
    fi
fi

# ---------------------------------------------------------------------------
# Empty-shape payloads
#
# Each payload matches the `_load()` fallback of the corresponding repo —
# i.e. the structure the backend would produce if the file was missing.
# See:
#   apps/admin-backend/app/repos/collection_repo.py   (BlockCollection.create_empty)
#   apps/admin-backend/app/repos/catalog_repo.py      (Catalog empty)
#   apps/admin-backend/app/repos/media_item_repo.py   (MediaItemCatalog empty)
#   apps/admin-backend/app/repos/stream_repo.py       (StreamsIndex empty)
#   apps/admin-backend/app/repos/event_page_repo.py   (EventPageCatalog empty)
#   apps/admin-backend/app/repos/home_doc_repo.py     (HomeDoc empty)
# ---------------------------------------------------------------------------

EMPTY_BLOCK_COLLECTION=$(cat <<JSON
{
  "kind": "BlockCollection",
  "version": 1,
  "generatedAt": "$ISO_DATE",
  "updatedAt": "$ISO_DATE",
  "blocks": {},
  "order": []
}
JSON
)

EMPTY_ART_CATALOG=$(cat <<JSON
{
  "catalogVersion": 1,
  "updatedAt": "$ISO_DATETIME",
  "items": {},
  "order": []
}
JSON
)

EMPTY_MEDIA_CATALOG=$(cat <<JSON
{
  "version": 1,
  "updatedAt": "$ISO_DATETIME",
  "order": [],
  "items": {}
}
JSON
)

EMPTY_STREAMS_INDEX=$(cat <<JSON
{
  "version": 1,
  "updatedAt": "$ISO_DATETIME",
  "streams": []
}
JSON
)

EMPTY_EVENT_PAGES=$(cat <<JSON
{
  "version": 1,
  "updatedAt": "$ISO_DATETIME",
  "pages": {}
}
JSON
)

EMPTY_HOME_DOC=$(cat <<JSON
{
  "items": [],
  "version": 1,
  "createdAt": "$ISO_DATETIME",
  "updatedAt": "$ISO_DATETIME"
}
JSON
)

# ---------------------------------------------------------------------------
# Reset
# ---------------------------------------------------------------------------

log ""
log "Resetting catalogs…"

write_file "$VAULT_JSON/block_collection/block_collection.json" "$EMPTY_BLOCK_COLLECTION"
write_file "$VAULT_JSON/art_catalog.json"                       "$EMPTY_ART_CATALOG"
write_file "$VAULT_JSON/media_items/catalog.json"               "$EMPTY_MEDIA_CATALOG"
write_file "$VAULT_JSON/streams/index.json"                     "$EMPTY_STREAMS_INDEX"
remove_stream_files
write_file "$VAULT_JSON/event_pages/catalog.json"               "$EMPTY_EVENT_PAGES"
write_file "$VAULT_JSON/public/home.json"                       "$EMPTY_HOME_DOC"

log ""
if [ "$DRY_RUN" -eq 1 ]; then
    log "Done (dry run — no files were modified)."
else
    log "Done. Restart the backend to load the empty-shape catalogs."
fi
