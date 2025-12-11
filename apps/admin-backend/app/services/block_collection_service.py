# app/utils/id_generation.py

from uuid import uuid4
from typing import Optional

# Если у тебя уже есть Block или BlockKind в моделях — импортируй оттуда.
# Здесь я пишу в самом общем виде.
from app.models.block_collection import Block


def _slug_segment(value: str) -> str:
    """
    Нормализуем куски для ID:
    - lower()
    - пробелы и подчёркивания → дефисы
    """
    return value.strip().lower().replace(" ", "-").replace("_", "-")


def generate_block_id(block: Block) -> str:
    """
    Генерация ID блока на основе его содержимого.

    Формат (базовый):
        block-<kind>-<random>

    Например:
        block-gallery-a3f91c2b
        block-text-7d02aa54

    Если захочешь позже добавить layout в ID:
        block-gallery-grid23-a3f91c2b
    — это легко внести внутрь этой функции.
    """
    kind_segment = _slug_segment(block.blockKind)

    # Если захочешь включать layout в ID:
    layout = getattr(block, "layout", None)
    layout_segment: Optional[str] = None
    if isinstance(layout, str) and layout.strip():
        layout_segment = _slug_segment(layout)

    rand = uuid4().hex[:8]

    if layout_segment:
        return f"block-{kind_segment}-{layout_segment}-{rand}"

    return f"block-{kind_segment}-{rand}"
