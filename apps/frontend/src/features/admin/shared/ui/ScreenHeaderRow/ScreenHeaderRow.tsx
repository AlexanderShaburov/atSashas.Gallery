// src/features/admin/shared/ui/ScreenHeaderRow/ScreenHeaderRow.tsx

import { ReactNode } from 'react';
import './ScreenHeaderRow.css';

type Props = {
    left?: ReactNode;
    right?: ReactNode;
    className?: string;
};

export function ScreenHeaderRow({ left, right, className }: Props) {
    return (
        <div className={`shr ${className ?? ''}`}>
            <div className="shr__lift">{left}</div>
            <div className="shr__right">{right}</div>
        </div>
    );
}
