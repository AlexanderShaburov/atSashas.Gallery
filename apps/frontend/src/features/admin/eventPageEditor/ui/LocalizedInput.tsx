// features/admin/eventPageEditor/ui/LocalizedInput.tsx
// Reusable localized text input — single-line and multi-line variants.

import type { Localized } from '@/entities/common';

type Props = {
  value: Localized | undefined;
  onChange: (next: Localized) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  hint?: string;
};

export function LocalizedInput({ value, onChange, placeholder, multiline, rows = 3, hint }: Props) {
  const en = value?.en ?? '';

  const handleChange = (raw: string) => {
    onChange({ ...value, en: raw });
  };

  return (
    <div className="epe__localized-input">
      {multiline ? (
        <textarea
          value={en}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <input
          type="text"
          value={en}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
      {hint && <span className="epe__field-hint">{hint}</span>}
    </div>
  );
}
