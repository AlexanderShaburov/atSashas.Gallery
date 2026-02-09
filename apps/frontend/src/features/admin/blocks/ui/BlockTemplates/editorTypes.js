export const Hit = {
    galleryImage: (slot) => ({
        blockKind: 'gallery',
        kind: 'image',
        slot,
    }),
    galleryCaption: (slot) => ({
        blockKind: 'gallery',
        kind: 'imageCaption',
        slot,
    }),
    galleryBlockCaption: () => ({
        blockKind: 'gallery',
        kind: 'blockCaption',
    }),
    textTitle: () => ({
        blockKind: 'text',
        kind: 'textTitle',
    }),
    textBody: () => ({
        blockKind: 'text',
        kind: 'textBody',
    }),
    ctaTitle: () => ({
        blockKind: 'cta',
        kind: 'ctaTitle',
    }),
    ctaBody: () => ({
        blockKind: 'cta',
        kind: 'ctaBody',
    }),
    ctaButton: () => ({
        blockKind: 'cta',
        kind: 'ctaButton',
    }),
};
