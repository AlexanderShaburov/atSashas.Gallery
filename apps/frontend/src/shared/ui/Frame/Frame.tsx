// shared/ui/Frame/Frame.tsx

import type { CSSProperties, ReactNode } from 'react';
import './Frame.css';

export type FrameMode = 'embedded' | 'card' | 'thumbnail';

type Props = {
    mode: FrameMode;
    aspectRatio?: string;
    className?: string;
    children: ReactNode;
    onClick?: (e: React.MouseEvent) => void;
};

export function Frame({ mode, aspectRatio, className, children, onClick }: Props) {
    const style: CSSProperties | undefined = aspectRatio ? { aspectRatio } : undefined;
    const cls = ['frame', `frame--${mode}`, className].filter(Boolean).join(' ');

    return (
        <div className={cls} style={style} onClick={onClick}>
            {children}
        </div>
    );
}
