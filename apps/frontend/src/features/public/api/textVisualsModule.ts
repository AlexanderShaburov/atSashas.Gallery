// features/public/api/textVisualsModule.ts

import type { TextVisualCatalog, TextVisualData } from '@/entities/textVisual';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TEXT_VISUALS_URL = `${API_BASE}/public/text-visuals`;

let cache: TextVisualCatalog | null = null;
let inflight: Promise<TextVisualCatalog> | null = null;

export async function loadTextVisualsOnce(): Promise<TextVisualCatalog> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(TEXT_VISUALS_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`TextVisuals HTTP ${res.status}`);
      const data = (await res.json()) as TextVisualCatalog;
      cache = data;
      return data;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function getTextVisual(id: string): TextVisualData | undefined {
  return cache?.items?.[id];
}

export function invalidateTextVisualsCache(): void {
  cache = null;
  inflight = null;
}
