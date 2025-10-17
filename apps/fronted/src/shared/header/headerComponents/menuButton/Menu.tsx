import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MenuIcon from './MenuIcon';
import './menu.css';

export default function Menu() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const location = useLocation();

  // Закрывать при переходе по роуту
  useEffect(() => {
    close();
  }, [location.pathname]);

  // Закрытие по Esc + фиксация скролла body
  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button className="menu-trigger" aria-label="Open menu" onClick={() => setOpen(true)}>
        <MenuIcon />
      </button>

      {open && (
        <>
          <div className="menu-backdrop is-open" onClick={close} />
          <aside className={`menu-panel ${open ? 'is-open' : ''}`} role="dialog" aria-modal="true">
            <div className="menu-head">
              <div className="menu-title">Menu</div>
              <button className="menu-close" aria-label="Close" onClick={close}>
                ×
              </button>
            </div>

            <ul className="menu-list">
              {/* internal links */}
              <li className="menu-item">
                <Link className="router-link" to="/about" onClick={close}>
                  About
                </Link>
              </li>
              <li className="menu-item">
                <Link className="router-link" to="/watercolor" onClick={close}>
                  Watercolor
                </Link>
              </li>
              <li className="menu-item">
                <Link className="router-link" to="/mixed-media" onClick={close}>
                  Mix Media
                </Link>
              </li>
              <li className="menu-item">
                <Link className="router-link" to="/contacts" onClick={close}>
                  Contacts
                </Link>
              </li>

              {/* внешние */}
              <li className="menu-item">
                <a
                  href="https://instagram.com/alexanrshaburo"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                >
                  Instagram
                </a>
              </li>
              <li className="menu-item">
                <a
                  href="https://www.behance.net/alexanrshaburo"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                >
                  Behance
                </a>
              </li>
            </ul>

            <div className="menu-foot">© {new Date().getFullYear()} — Watercolor / Mix Media</div>
          </aside>
        </>
      )}
    </>
  );
}
