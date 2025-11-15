# models/art_item.py
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Iterable, Tuple
import re

from settings import settings
from models.images_pipline import ImagesJSON  # твоя текущая модель картинок


@dataclass
class ArtItem:
    """
    Backend representation of ArtItemJSON from frontend.

    Mirrors (примерно) TS interface:

    export interface ArtItemJSON {
        id: string;
        title?: Localized;
        dateCreated: ISODate;
        techniques: string[];
        price?: PriceJSON | undefined;
        availability: Availability;
        series?: string | undefined;
        tags?: string[];
        notes?: string | undefined;
        images: ImagesJSON;
        dimensions: Dimensions;
    }
    """

    id: str
    dateCreated: str
    techniques: List[str]
    availability: str
    dimensions: Dict[str, object]
    images: ImagesJSON

    title: Optional[Dict[str, str]] = None  # Localized
    price: Optional[Dict[str, object]] = None  # {amount, currency}
    series: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None

    # --- Static "schemas" (mirrors TS enums) ---

    # Example: "art-20251115-sz33ww"
    ID_PATTERN = re.compile(r"^art-\d{8}-[a-z0-9]{6}$")

    VALID_AVAILABILITY = {
        "available",
        "reserved",
        "sold",
        "privateCollection",
        "notForSale",
    }

    VALID_UNITS = {"cm", "in"}

    VALID_LANG_CODES = {"en", "ru", "it", "es", "pt"}

    VALID_CURRENCIES = {
        "USD",
        "EUR",
        "ILS",
        "GBP",
        "CHF",
        "JPY",
        "CNY",
        "CAD",
        "AUD",
    }

    def validate(
        self,
        *,
        allowed_techniques: Iterable[str],
        media_root: Optional[Path | str] = None,
    ) -> Tuple[bool, List[str]]:
        """
        Validate the ArtItem instance.

        - checks id / dateCreated format
        - checks techniques against allowed set
        - checks availability enum
        - checks dimensions (& unit)
        - checks price / title / series / tags / notes types
        - checks images structure and presence of image files on disk

        Args:
            allowed_techniques: all valid technique keys from techniques.json
            media_root: filesystem root where media paths are resolved.
                If None, defaults to settings.storage_root (e.g. "/media").

        Returns:
            (is_valid: bool, errors: list[str])
        """
        errors: List[str] = []

        # --- id ---

        if not isinstance(self.id, str) or not self.ID_PATTERN.match(self.id):
            errors.append(
                f"id '{self.id}' does not match pattern {self.ID_PATTERN.pattern}"
            )

        # --- dateCreated (simple ISO date YYYY-MM-DD) ---

        if not isinstance(self.dateCreated, str) or not re.match(
            r"^\d{4}-\d{2}-\d{2}$", self.dateCreated
        ):
            errors.append(
                f"dateCreated '{self.dateCreated}' is not ISO date 'YYYY-MM-DD'"
            )

        # --- techniques ---

        allowed = set(allowed_techniques)
        if not isinstance(self.techniques, list) or not self.techniques:
            errors.append("techniques must be a non-empty list of strings")
        else:
            unknown = [t for t in self.techniques if t not in allowed]
            if unknown:
                errors.append(f"unknown techniques: {unknown}")

        # --- availability ---

        if self.availability not in self.VALID_AVAILABILITY:
            errors.append(
                f"availability '{self.availability}' is invalid; "
                f"expected one of {sorted(self.VALID_AVAILABILITY)}"
            )

        # --- dimensions (Dimensions: {width, height, unit}) ---

        if not isinstance(self.dimensions, dict):
            errors.append("dimensions must be an object {width, height, unit}")
        else:
            w = self.dimensions.get("width")
            h = self.dimensions.get("height")
            unit = self.dimensions.get("unit")

            if not isinstance(w, (int, float)) or w <= 0:
                errors.append(
                    f"dimensions.width '{w}' must be a positive number"
                )
            if not isinstance(h, (int, float)) or h <= 0:
                errors.append(
                    f"dimensions.height '{h}' must be a positive number"
                )
            if unit not in self.VALID_UNITS:
                errors.append(
                    f"dimensions.unit '{unit}' is invalid; expected one of {sorted(self.VALID_UNITS)}"
                )

        # --- title (Localized: Partial<Record<LangCode, string>>) ---

        if self.title is not None:
            if not isinstance(self.title, dict):
                errors.append("title must be an object {langCode: string}")
            else:
                for lang, text in self.title.items():
                    if lang not in self.VALID_LANG_CODES:
                        errors.append(
                            f"title language '{lang}' is not allowed"
                        )
                    elif not isinstance(text, str):
                        errors.append(f"title[{lang}] must be a string")

        # --- price (Money: {amount, currency}) ---

        if self.price is not None:
            if not isinstance(self.price, dict):
                errors.append("price must be an object {amount, currency}")
            else:
                amount = self.price.get("amount")
                currency = self.price.get("currency")

                if not isinstance(amount, (int, float)) or amount < 0:
                    errors.append(
                        f"price.amount '{amount}' must be a non-negative number"
                    )
                if currency not in self.VALID_CURRENCIES:
                    errors.append(
                        f"price.currency '{currency}' is invalid; "
                        f"expected one of {sorted(self.VALID_CURRENCIES)}"
                    )

        # --- series ---

        if self.series is not None and not isinstance(self.series, str):
            errors.append("series must be a string if present")

        # --- tags ---

        if self.tags is not None:
            if not isinstance(self.tags, list) or not all(
                isinstance(t, str) for t in self.tags
            ):
                errors.append("tags must be a list of strings")

        # --- notes ---

        if self.notes is not None and not isinstance(self.notes, str):
            errors.append("notes must be a string if present")

        # --- images ---

        errors.extend(self._validate_images(media_root=media_root))

        return (len(errors) == 0, errors)

    # ------------------------------------------------------------------
    # Images validation helper
    # ------------------------------------------------------------------
    def _validate_images(
        self, *, media_root: Optional[Path | str] = None
    ) -> List[str]:
        """
        Validate ImagesJSON structure and existence of referenced files.

        TS version:

        export interface ImagesJSON {
            alt: Localized;
            preview: PreviewSources;
            full: FullPath; // "arts/fullsize/<name>.<ext>"
        }
        export interface PreviewSources {
            avif?: PreviewPath;
            webp?: PreviewPath;
            jpeg?: PreviewPath;
        }

        Тут мы проверяем:
        - типы полей;
        - alt как Localized;
        - наличие файлов для full и всех превью.
        """
        errs: List[str] = []

        if not isinstance(self.images, ImagesJSON):
            errs.append("images must be an ImagesJSON instance")
            return errs

        # Resolve media root
        if media_root is None:
            # By convention: settings.storage_root is the FS root where "/arts" lives
            # e.g. storage_root="/media" => "/media/arts/..."
            media_root_path = Path(settings.storage_root)
        else:
            media_root_path = Path(media_root)

        # --- alt (Localized) ---
        alt = getattr(self.images, "alt", None)
        if alt is not None:
            if not isinstance(alt, dict):
                errs.append("images.alt must be an object {langCode: string}")
            else:
                for lang, text in alt.items():
                    if lang not in self.VALID_LANG_CODES:
                        errs.append(
                            f"images.alt language '{lang}' is not allowed"
                        )
                    elif not isinstance(text, str):
                        errs.append(f"images.alt[{lang}] must be a string")

        # --- full path ---

        full_path = getattr(self.images, "full", None)
        if not isinstance(full_path, str):
            errs.append("images.full must be a string path")
        else:
            # TS FullPath: "arts/fullsize/<name>.<ext>"
            # or, если ты используешь "/media/arts/fullsize/...", всё равно обрежем ведущий "/"
            rel = full_path.lstrip("/")
            fs_path = media_root_path / rel
            if not fs_path.exists():
                errs.append(f"images.full file does not exist: {fs_path}")

        # --- previews ---

        preview_sources = getattr(self.images, "preview", None)
        preview_paths: List[str] = []

        if isinstance(preview_sources, dict):
            for key in ("avif", "webp", "jpeg"):
                val = preview_sources.get(key)
                if val:
                    if not isinstance(val, str):
                        errs.append(
                            f"images.preview.{key} must be a string path"
                        )
                    else:
                        preview_paths.append(val)

        # Old backend representation (if any) with 'previews: list[str]'
        if hasattr(self.images, "previews") and isinstance(
            getattr(self.images, "previews"), list
        ):
            preview_paths.extend(
                [
                    p
                    for p in getattr(self.images, "previews")
                    if isinstance(p, str)
                ]
            )

        for p in preview_paths:
            rel = p.lstrip("/")
            fs_path = media_root_path / rel
            if not fs_path.exists():
                errs.append(f"preview file does not exist: {fs_path}")

        return errs
