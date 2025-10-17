import { JSX, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface LightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export default function Lightbox({ src, alt = '', onClose }: LightboxProps): JSX.Element {
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return createPortal(
    <div className="lb-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <img className="lb-img" src={src} alt={alt} onClick={onClose} />
    </div>,
    document.body,
  );
}
