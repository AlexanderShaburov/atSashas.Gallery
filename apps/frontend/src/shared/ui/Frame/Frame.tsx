// shared/ui/Frame/Frame.tsx

import type { CSSProperties, ReactNode } from 'react';
import './Frame.css';

export type FrameMode = 'embedded' | 'card' | 'thumbnail';

type Props = {
    mode: FrameMode;
    aspectRatio?: string;
    className?: string;
    children: ReactNode;
};

export function Frame({ mode, aspectRatio, className, children }: Props) {
    const style: CSSProperties | undefined = aspectRatio ? { aspectRatio } : undefined;
    const cls = ['frame', `frame--${mode}`, className].filter(Boolean).join(' ');

    return (
        <div className={cls} style={style}>
            {children}
        </div>
    );
}
