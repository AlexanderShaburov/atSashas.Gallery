// src/features/admin/streams/ui/Wrapper/BlockWrapper.tsx

import { ReactNode } from 'react';

export type ThreeDotUiApi = {
    toggle: (el: HTMLElement) => void;
    close: () => void;
};

type WrapperProps = {
    threeDotMenu: ThreeDotUiApi;
    children: ReactNode;
};

export function BlockWrapper({ threeDotMenu, children }: WrapperProps) {
    return (
        <div className="bw">
            <button
                type="button"
                className="bw__threeDot"
                onClick={(e) => threeDotMenu.toggle(e.currentTarget)}
            >
                ⋯
            </button>
            {children}
        </div>
    );
}
