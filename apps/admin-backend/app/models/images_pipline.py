# images_pipeline.py
# comments: English
import os
import shutil
from dataclasses import dataclass
from typing import List, Optional

from PIL import Image  # pip install pillow

# Optional AVIF support:
# pip install pillow-avif-plugin
try:
    import pillow_avif  # noqa: F401  # register AVIF with Pillow if installed

    AVIF_SUPPORTED = True
except Exception:
    AVIF_SUPPORTED = False


@dataclass
class ImagesJSON:
    full: str
    previews: List[str]

    @classmethod
    def from_hopper(
        cls,
        hopper_src: str,
        full_dir: str,
        preview_dir: str,
        public_full_prefix: Optional[str] = None,
        public_preview_prefix: Optional[str] = None,
        max_preview_px: int = 500,
        max_preview_bytes: int = 500 * 1024,
        base_name: Optional[str] = None,
        copy_instead_of_move: bool = False,
    ) -> "ImagesJSON":
        """
        Build ImagesJSON from a single source file in the hopper.

        - Moves (or copies) the hopper file to `full_dir`
        - Generates a single-size preview (longest edge <= max_preview_px) in JPEG, WebP and AVIF (if available)
        - Tries to keep each preview file under `max_preview_bytes`
        - Returns ImagesJSON with public or relative paths

        Args:
            hopper_src: path to the original file in hopper (e.g. ".../hopper/IMG_00123.jpg")
            full_dir: destination directory for full-size originals (e.g. ".../vault/arts/full")
            preview_dir: destination directory for previews (e.g. ".../vault/arts/preview")
            public_full_prefix: the URL/path prefix to expose "full" in JSON (e.g. "/vault/arts/full")
            public_preview_prefix: the URL/path prefix to expose previews in JSON (e.g. "/vault/arts/preview")
            max_preview_px: max longest edge for previews
            max_preview_bytes: soft size cap per preview file
            base_name: optional basename (without extension) for outputs; default: derived from hopper filename
            copy_instead_of_move: if True, copy full instead of move

        Returns:
            ImagesJSON(full=<public or relative path>, previews=[<jpg>, <webp>, <avif?>])
        """
        os.makedirs(full_dir, exist_ok=True)
        os.makedirs(preview_dir, exist_ok=True)

        src_basename = os.path.basename(hopper_src)
        name, _ext = os.path.splitext(src_basename)
        if base_name:
            name = base_name

        # ---- 1) Move/copy to full_dir with original extension preserved
        full_ext = _ext.lower() if _ext else ".jpg"
        full_dst_path = os.path.join(full_dir, f"{name}{full_ext}")
        if copy_instead_of_move:
            shutil.copy2(hopper_src, full_dst_path)
        else:
            shutil.move(hopper_src, full_dst_path)

        # ---- 2) Open the full image for preview generation
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

            # Prepare output file paths
            jpg_path = os.path.join(preview_dir, f"{name}.jpg")
            webp_path = os.path.join(preview_dir, f"{name}.webp")
            avif_path = os.path.join(preview_dir, f"{name}.avif")

            # Save previews with size/quality control
            _save_with_size_cap(
                preview_img,
                jpg_path,
                fmt="JPEG",
                target_bytes=max_preview_bytes,
            )
            _save_with_size_cap(
                preview_img,
                webp_path,
                fmt="WEBP",
                target_bytes=max_preview_bytes,
            )

            created_paths = [jpg_path, webp_path]

            if AVIF_SUPPORTED:
                try:
                    _save_with_size_cap(
                        preview_img,
                        avif_path,
                        fmt="AVIF",
                        target_bytes=max_preview_bytes,
                    )
                    created_paths.append(avif_path)
                except Exception:
                    # AVIF plugin present but failed — skip silently
                    pass

        # ---- 3) Build public/JSON-facing paths
        full_json_path = (
            _join_url(public_full_prefix, f"{name}{full_ext}")
            if public_full_prefix
            else full_dst_path
        )

        previews_json_paths = []
        for p in created_paths:
            if public_preview_prefix:
                previews_json_paths.append(
                    _join_url(public_preview_prefix, os.path.basename(p))
                )
            else:
                previews_json_paths.append(p)

        return cls(full=full_json_path, previews=previews_json_paths)


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
