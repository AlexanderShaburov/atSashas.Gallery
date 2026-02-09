export function artItemToGridItem(a) {
    const thumbUrl = a.images.full;
    return {
        id: a.id,
        thumbUrl: thumbUrl,
        title: a.title?.en ?? a.title?.ru ?? '',
    };
}
