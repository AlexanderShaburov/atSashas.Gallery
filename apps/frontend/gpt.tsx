return (
    <figure className={`gc-block-${ctx.identity?.blockKind}`}>
        {imgPositions.map((pos) => {
            const blockItem = item.items.find((i) => i.position === pos);
            const imgId = blockItem?.artId;

            // хендлер клика по слоту (один на все случаи)
            const handleSlotClick = (e: React.MouseEvent<HTMLDivElement | HTMLPictureElement>) => {
                e.stopPropagation();

                // если есть onHit (редактор) — отдаём hit
                if (onHit) {
                    onHit(
                        Hit.galleryImage(pos), // slot = pos
                        e,
                    );
                    return;
                }

                // если есть onSelectBlock (грид) — выбираем блок
                if (onSelectBlock) {
                    onSelectBlock(item);
                }
            };

            if (!imgId) {
                // Empty slot for this position
                return (
                    <div
                        key={pos}
                        className={`gc-slot gc-slot-empty gc-slot-${pos.toLowerCase()}`}
                        role="button"
                        onClick={handleSlotClick}
                    />
                );
            }

            const img = gCtx.currentArtCatalog?.items[imgId] as ArtItemData | undefined;

            if (!img) {
                // Art not found in catalog
                return (
                    <div
                        key={`${imgId}-${pos}`}
                        className={`gc-slot gc-slot-missing gc-slot-${pos.toLowerCase()}`}
                        role="button"
                        onClick={handleSlotClick}
                    >
                        Missing art: {imgId}
                    </div>
                );
            }

            return (
                <picture
                    key={imgId ?? `${imgId}-${pos}`}
                    role="button"
                    className={`gc-slot gc-slot-${pos.toLowerCase()}`}
                    onClick={handleSlotClick}
                >
                    <source type="image/avif" srcSet={img.images.preview.avif} />
                    <source type="image/webp" srcSet={img.images.preview.webp} />
                    <img
                        src={img.images.preview.jpeg}
                        alt={img.images.alt.en || ''}
                        loading="lazy"
                    />
                </picture>
            );
        })}
    </figure>
);
