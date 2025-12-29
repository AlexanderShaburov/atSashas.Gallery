# images_pipeline.py
# comments: English
import os
import shutil
from typing import Optional

from pydantic import BaseModel
from PIL import Image

from app.settings import settings
from app.models.common import Localized, PreviewSources


class ImagesJSON(BaseModel):
    full: str
    preview: PreviewSources
    alt: Optional[Localized] = None

    @classmethod
    def from_hopper(
        cls,
        hopper_src: str,
        art_id: str,
        *,
        base_name: Optional[str] = None,
        copy_instead_of_move: bool = False,
        max_preview_px: int = 500,
        max_preview_bytes: int = 500 * 1024,
    ) -> "ImagesJSON":
        """
        Build ImagesJSON from a single source file in the hopper, using paths
        and prefixes defined in settings.

        - Moves (or copies) the hopper file into <storage_root>/<media_dir>/<full_size>
        - Generates previews into <storage_root>/<media_dir>/<previews>
        - Returns JSON paths starting with "/media/..." (public URLs)

        Args:
            hopper_src: path or filename of the original file in hopper.
                If it's not absolute, it is resolved relative to
                <storage_root>/<upload_media_dir>.
            art_id: id of the art item; used as basename for output files.
            base_name: optional basename (without extension) for outputs;
                if not provided, art_id is used.
            copy_instead_of_move: if True, copy full instead of move.
            max_preview_px: max longest edge for previews.
            max_preview_bytes: soft size cap per preview file.
        """

        # ---------- Resolve base directories from settings ----------
        # Filesystem root for storage (mounted volume)
        storage_root = settings.storage_root  # e.g. "/media"

        # Hopper directory (incoming uploads)
        hopper_dir = os.path.join(
            storage_root,
            settings.upload_media_dir.lstrip("/"),
        )  # e.g. "/media/hopper"

        # Root for art media
        media_root = os.path.join(
            storage_root,
            settings.media_dir.lstrip("/"),
        )  # e.g. "/media/arts"

        # Fullsize and previews directories on filesystem
        full_dir = os.path.join(
            media_root,
            settings.full_size.lstrip("/"),
        )  # e.g. "/media/arts/fullsize"

        preview_dir = os.path.join(
            media_root,
            settings.previews.lstrip("/"),
        )  # e.g. "/media/arts/previews"

        os.makedirs(full_dir, exist_ok=True)
        os.makedirs(preview_dir, exist_ok=True)

        # ---------- Resolve hopper source path ----------
        # If hopper_src is relative, assume it's inside hopper_dir
        if not os.path.isabs(hopper_src):
            hopper_src_path = os.path.join(hopper_dir, hopper_src)
        else:
            hopper_src_path = hopper_src

        src_basename = os.path.basename(hopper_src_path)
        name, _ext = os.path.splitext(src_basename)

        # Prefer explicit base_name, otherwise use art_id
        name = base_name or art_id

        # ---------- Move/copy original into fullsize directory ----------
        full_ext = _ext.lower() if _ext else ".jpg"
        full_dst_path = os.path.join(full_dir, f"{name}{full_ext}")

        if copy_instead_of_move:
            shutil.copy2(hopper_src_path, full_dst_path)
        else:
            shutil.move(hopper_src_path, full_dst_path)

        # ---------- Open full image and build previews ----------
        with Image.open(full_dst_path) as im:
            im = im.convert("RGB")  # normalize for consistent encoders

            # Compute preview size keeping aspect ratio
            w, h = im.size
            scale = (
                max(w, h) / float(max_preview_px)
                if max(w, h) > max_preview_px
                else 1.0
            )
            if scale > 1.0:
                new_w, new_h = int(round(w / scale)), int(round(h / scale))
                preview_img = im.resize(
                    (new_w, new_h), Image.Resampling.LANCZOS
                )
            else:
                preview_img = im  # already small enough

            # Prepare preview output paths (filesystem)
            jpeg_path = os.path.join(preview_dir, f"{name}.jpeg")
            webp_path = os.path.join(preview_dir, f"{name}.webp")
            avif_path = os.path.join(preview_dir, f"{name}.avif")

            # Save previews with size/quality control
            _save_with_size_cap(
                preview_img,
                jpeg_path,
                fmt="JPEG",
                target_bytes=max_preview_bytes,
            )
            _save_with_size_cap(
                preview_img,
                webp_path,
                fmt="WEBP",
                target_bytes=max_preview_bytes,
            )

            created = {
                "jpeg": jpeg_path,
                "webp": webp_path,
            }

            try:
                _save_with_size_cap(
                    preview_img,
                    avif_path,
                    fmt="AVIF",
                    target_bytes=max_preview_bytes,
                )
                created["avif"] = avif_path
            except Exception:
                # AVIF plugin present but failed — skip silently
                pass

        # ---------- Build JSON-facing public paths ----------
        # We assume that /media in URL maps to settings.storage_root on filesystem.
        url_root = settings.storage_root.rstrip("/")  # "/media"

        # Full image JSON path: "/media/arts/fullsize/<name>.<ext>"
        full_rel = os.path.join(
            settings.media_dir.lstrip("/"),
            settings.full_size.lstrip("/"),
            f"{name}{full_ext}",
        )
        full_json_path = _join_url(url_root, full_rel)

        # Preview JSON paths: "/media/arts/previews/<name>.<ext>"
        def to_preview_url(filename: str) -> str:
            rel = os.path.join(
                settings.media_dir.lstrip("/"),
                settings.previews.lstrip("/"),
                filename,
            )
            return _join_url(url_root, rel)

        previews = PreviewSources()

        if "jpeg" in created:
            previews.jpeg = to_preview_url(os.path.basename(created["jpeg"]))
        if "webp" in created:
            previews.webp = to_preview_url(os.path.basename(created["webp"]))
        if "avif" in created:
            previews.avif = to_preview_url(os.path.basename(created["avif"]))

        return cls(
            full=full_json_path,
            preview=previews,
            alt=None,  # can be filled later
        )


def _join_url(prefix: str, tail: str) -> str:
    # join like URL path, avoid double slashes
    if not prefix.endswith("/"):
        prefix += "/"
    return prefix + tail.lstrip("/")


def _save_with_size_cap(
    img: Image.Image,
    path: str,
    fmt: str,
    target_bytes: int,
    quality_start: int = 90,
    quality_min: int = 50,
) -> None:
    """
    Save image to `path` in `fmt` trying to keep file <= target_bytes by decreasing quality.
    For formats without 'quality' (rare), it just saves once.
    """
    # Pillow options per format
    options = {}
    fmt_upper = fmt.upper()

    if fmt_upper in ("JPEG", "JPG"):
        options = {
            "format": "JPEG",
            "quality": quality_start,
            "optimize": True,
            "progressive": True,
        }
        quality_key = "quality"
    elif fmt_upper == "WEBP":
        options = {"format": "WEBP", "quality": quality_start, "method": 6}
        quality_key = "quality"
    elif fmt_upper == "AVIF":
        # pillow-avif-plugin supports 'quality' 0..100
        options = {"format": "AVIF", "quality": quality_start}
        quality_key = "quality"
    else:
        # fallback: save as-is (e.g. PNG), no size loop
        img.save(path, format=fmt_upper)
        return

    q = quality_start
    # Try decreasing quality until under cap or min quality reached
    while True:
        options[quality_key] = q
        img.save(path, **options)
        size = os.path.getsize(path)
        if size <= target_bytes or q <= quality_min:
            break
        # decrease faster when far from target, slower when close
        q = max(quality_min, q - 10 if size > target_bytes * 1.6 else q - 5)
