// features/admin/shared/ui/adminHeader/GuardedNavLink.tsx

import { journeySessionStore } from '@/shared/nav';
import { type ComponentProps, useCallback } from 'react';
import { NavLink } from 'react-router-dom';

type GuardedNavLinkProps = ComponentProps<typeof NavLink>;

export function GuardedNavLink(props: GuardedNavLinkProps) {
    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            if (journeySessionStore.hasActiveSession()) {
                e.preventDefault();
                const ok = confirm(
                    'A journey is currently active. Navigating away will abandon it. Continue?',
                );
                if (ok) {
                    journeySessionStore.clear();
                    // Re-trigger navigation by calling the original onClick if any,
                    // or programmatically navigate
                    if (typeof props.onClick === 'function') {
                        props.onClick(e);
                    }
                    // Allow the browser to follow the link after clearing
                    const target = e.currentTarget;
                    setTimeout(() => target.click(), 0);
                }
                return;
            }
            if (typeof props.onClick === 'function') {
                props.onClick(e);
            }
        },
        [props],
    );

    return <NavLink {...props} onClick={handleClick} />;
}
