import { ArtCatalog } from '@/features/gallery/types/catalog';
import type { StreamData } from '@/models/Block';
import { useEffect, useState } from 'react';
import { getCatalog, getStreams, saveCatalog, saveStreams, uploadImage } from './api';

export default function AdminApp() {
  const [catalog, setCatalog] = useState<ArtCatalog>(() => ({
    catalogVersion: 1,
    updatedAt: '',
    order: [],
    items: {},
  }));
  const [streamData, setStreamData] = useState<StreamData>({ title: '', blocks: [] });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setCatalog(await getCatalog());
      setStreamData(await getStreams());
    })();
  }, []);

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        const { url } = await uploadImage(f, 'watercolor');
        const id = f.name
          .replace(/\.[^.]+$/, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-');
        setCatalog((prev) => ({
          ...prev,
          [id]: {
            ...(prev.items[id] ?? null),
            id,
            title: { en: id },
            dateCreated: '2025-01-01',
            materials: [],
            dimensions: { width: 0, height: 0, unit: 'cm' },
            price: null,
            availability: 'available',
            series: null,
            tags: [],
            notes: null,
            images: { alt: { en: id }, preview: {}, full: url },
          },
        }));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 grid gap-6">
      <h2>Admin Page</h2>
      <section>
        <h2>Upload</h2>
        <input type="file" multiple onChange={(e) => onUpload(e.target.files)} />
      </section>
      <section>
        <h2>Catalog</h2>
        <button disabled={busy} onClick={() => saveCatalog(catalog)}>
          Save Catalog
        </button>
        <ul>
          {Object.entries(catalog.items).map(([id, it]) => (
            <li key={id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: 8 }}>
              <input value={id} readOnly />
              <input
                value={it.title?.en ?? ''}
                onChange={(e) => {
                  setCatalog((prev) => ({
                    ...prev,
                    [id]: { ...it, images: { ...(it.images || {}), full: e.target.value } },
                  }));
                }}
                placeholder="images.full"
              />
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Streams</h2>
        <button disabled={busy} onClick={() => saveStreams(streamData)}>
          Save Streams
        </button>
      </section>
    </div>
  );
}
