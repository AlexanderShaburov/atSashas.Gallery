from datetime import datetime, timezone
import secrets


def generate_block_collection_id() -> str:
    """
    Generate a stable-ish unique ID for a block collection.

    Pattern:
        bc_{ISO8601-UTC-datetime}-{6-digit-random}

    Example:
        bc_2025-11-28T14:32:10Z-083421
    """
    # Текущее время в UTC, без микросекунд
    now = datetime.now(timezone.utc).replace(microsecond=0)

    # ISO-формат, например "2025-11-28T14:32:10Z"
    iso_ts = now.isoformat().replace("+00:00", "Z")

    # Шестизначный цифровой хвост
    rand_part = secrets.randbelow(1_000_000)  # от 0 до 999999
    suffix = f"{rand_part:06d}"

    # Собираем ID (можешь убрать префикс bc_, если не нужен)
    return f"bc_{iso_ts}-{suffix}"
