import '@/pages/public/header/headerComponents/menuButton/Menu.css';
import MenuIcon from '@/pages/public/header/headerComponents/menuButton/MenuIcon';
import { usePublicStream } from '@/features/public/hooks/usePublicStream';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Menu() {
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const { streams } = usePublicStream();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const sheetRef = useRef<HTMLElement>(null);

    const close = useCallback(() => {
        setOpen(false);
        // Return focus to trigger
        requestAnimationFrame(() => triggerRef.current?.focus());
    }, []);

    // Close on route change
    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    // ESC + body scroll lock + focus trap
    useEffect(() => {
        if (!open) return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                close();
                return;
            }
            // Focus trap
            if (e.key === 'Tab' && sheetRef.current) {
                const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
                    'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
                );
                if (focusable.length === 0) return;
                const first = focusable[0]!;
                const last = focusable[focusable.length - 1]!;
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }

        window.addEventListener('keydown', onKey);

        // Auto-focus first link
        requestAnimationFrame(() => {
            const firstLink = sheetRef.current?.querySelector<HTMLElement>('a, button');
            firstLink?.focus();
        });

        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, close]);

    const isActive = (path: string) => location.pathname === path;
    const isStreamActive = (id: string) => location.pathname === `/gallery/${id}`;

    return (
        <>
            <button
                ref={triggerRef}
                className="menu-trigger"
                aria-label="Open menu"
                aria-expanded={open}
                onClick={() => setOpen(true)}
            >
                <MenuIcon />
            </button>

            {open && (
                <>
                    <div className="menu-overlay" onClick={close} />
                    <nav
                        ref={sheetRef}
                        className="menu-sheet"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Navigation menu"
                    >
                        <header className="menu-topbar">
                            <button
                                className="menu-close"
                                aria-label="Close menu"
                                onClick={close}
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                    <line x1="4" y1="4" x2="16" y2="16" />
                                    <line x1="16" y1="4" x2="4" y2="16" />
                                </svg>
                            </button>
                        </header>

                        <div className="menu-primary">
                            <Link
                                className={`menu-link${isActive('/about') ? ' is-active' : ''}`}
                                to="/about"
                                onClick={close}
                            >
                                About
                            </Link>

                            {streams.map((s) => (
                                <Link
                                    key={s.streamId}
                                    className={`menu-link${isStreamActive(s.streamId) ? ' is-active' : ''}`}
                                    to={`/gallery/${s.streamId}`}
                                    onClick={close}
                                >
                                    {s.title}
                                </Link>
                            ))}

                            <Link
                                className={`menu-link${isActive('/contacts') ? ' is-active' : ''}`}
                                to="/contacts"
                                onClick={close}
                            >
                                Contacts
                            </Link>
                        </div>

                        <div className="menu-secondary">
                            <a
                                className="menu-link-secondary"
                                href="https://instagram.com/alexanrshaburo"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={close}
                            >
                                Instagram
                            </a>
                            <a
                                className="menu-link-secondary"
                                href="https://www.behance.net/alexanrshaburo"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={close}
                            >
                                Behance
                            </a>
                        </div>
                    </nav>
                </>
            )}
        </>
    );
}
