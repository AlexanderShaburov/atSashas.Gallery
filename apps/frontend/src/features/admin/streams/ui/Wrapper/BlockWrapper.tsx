// src/features/admin/streams/ui/Wrapper/BlockWrapper.tsx

import { ReactNode } from 'react';

type WrapperProps = {
    blockId: string;
    threeDotMenu: (id: string) => void;
    children: ReactNode;
};

export function BlockWrapper({ blockId, threeDotMenu, children }: WrapperProps) {
    return (
        <div className="bw_wrapper">
            <div className="bw__three-dot" role="button" onClick={() => threeDotMenu(blockId)}>
                ...
            </div>
            {children}
        </div>
    );
}
