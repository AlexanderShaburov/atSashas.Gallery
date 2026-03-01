// shared/ui/ArtPicture/ArtPicture.tsx

import type { PreviewSources } from '@/entities/art';

type Props = {
    sources: PreviewSources;
    alt?: string;
    onClick?: (e: React.MouseEvent<HTMLElement>) => void;
    className?: string;
    loading?: 'lazy' | 'eager';
    role?: string;
    draggable?: boolean;
};

export function ArtPicture({ sources, alt = '', onClick, className, loading = 'lazy', role, draggable }: Props) {
    return (
        <picture role={role} className={className} onClick={onClick}>
            {sources.avif && <source type="image/avif" srcSet={sources.avif} />}
            {sources.webp && <source type="image/webp" srcSet={sources.webp} />}
            <img src={sources.jpeg} alt={alt} loading={loading} draggable={draggable} />
        </picture>
    );
}
