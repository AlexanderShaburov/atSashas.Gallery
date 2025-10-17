import type { ArtCatalog } from '@entities/catalog';
import type { StreamData } from '@entities/stream';

const BASE = import.meta.env.VITE_VAULT_BASE_URL;
const CATALOG_URL = `${BASE}api/catalog.json`;
const STREAMS_URL = `${BASE}api/streams.json`;
const VAULT_URL = `${BASE}api/vault/`;

export async function getCatalog() {
  return (await fetch(CATALOG_URL)).json();
}

export async function saveCatalog(data: ArtCatalog) {
  await fetch(CATALOG_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function getStreams() {
  return (await fetch(STREAMS_URL)).json();
}

export async function saveStreams(data: StreamData) {
  await fetch(STREAMS_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function uploadImage(file: File, category: string, filename?: string) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('category', category);
  if (filename) fd.append('filename', filename);
  return (await fetch(VAULT_URL, { method: 'POST', body: fd })).json();
}
