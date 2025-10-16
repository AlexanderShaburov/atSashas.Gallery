Завтрашний спринт (чек-лист)

Роутинг

Создай маршрут /admin (если у тебя react-router):

```ts
// src/main.tsx
<Route path="/admin" element={<AdminApp />} />
```

API-слой (тонкий)

```ts
src/admin/api.ts:

export async function getCatalog() { return (await fetch('/api/catalog')).json(); }
export async function saveCatalog(data:any) {
await fetch('/api/catalog', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
}
export async function getStreams() { return (await fetch('/api/streams')).json(); }
export async function saveStreams(data:any) {
await fetch('/api/streams', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
}
export async function uploadImage(file: File, category: string, filename?: string) {
const fd = new FormData();
fd.append('file', file); fd.append('category', category);
if (filename) fd.append('filename', filename);
return (await fetch('/api/upload-image', { method:'POST', body: fd })).json();
}
```

Каркас админки

```tsx
src/admin/AdminApp.tsx:

import { useEffect, useState } from 'react';
import { getCatalog, saveCatalog, getStreams, saveStreams, uploadImage } from './api';

export default function AdminApp() {
const [catalog, setCatalog] = useState<{[id:string]: any}>({});
const [streams, setStreams] = useState<any>({});
const [busy, setBusy] = useState(false);

useEffect(() => { (async () => {
setCatalog(await getCatalog());
setStreams(await getStreams());
})(); }, []);

async function onUpload(files: FileList | null) {
if (!files?.length) return;
setBusy(true);
try {
for (const f of Array.from(files)) {
const { url } = await uploadImage(f, 'watercolor');
const id = f.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
setCatalog(prev => ({ ...prev, [id]: {
...(prev[id] ?? {}),
id, title:{ en: id }, dateCreated: '2025-01-01',
materials: [], dimensions: { width:0, height:0, unit:'cm' },
price: null, availability: 'available', series: null, tags: [], notes: null,
images: { alt:{ en: id }, preview:{}, full: url }
}}));
}
} finally { setBusy(false); }
}

return (
<div className="p-4 grid gap-6">
<h1>Admin</h1>

      <section>
        <h2>Upload</h2>
        <input type="file" multiple onChange={e => onUpload(e.target.files)} />
      </section>

      <section>
        <h2>Catalog</h2>
        <button disabled={busy} onClick={() => saveCatalog(catalog)}>Save Catalog</button>
        <ul>
          {Object.entries(catalog).map(([id, it]) => (
            <li key={id} style={{display:'grid', gridTemplateColumns:'1fr 2fr 2fr', gap:8}}>
              <input value={id} readOnly />
              <input value={it.title?.en ?? ''} onChange={e => {
                setCatalog(prev => ({...prev, [id]: { ...it, title: { ...(it.title||{}), en: e.target.value }}}));
              }} placeholder="title.en"/>
              <input value={it.images?.full ?? ''} onChange={e => {
                setCatalog(prev => ({...prev, [id]: { ...it, images: { ...(it.images||{}), full: e.target.value }}}));
              }} placeholder="images.full"/>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Streams</h2>
        <button disabled={busy} onClick={() => saveStreams(streams)}>Save Streams</button>
        {/* Завтра: UI для добавления text/image/gallery блоков */}
      </section>
    </div>

);
}
```

Данные

На сервере отдай временно наши catalog.fixed.json и streams.fixed.json с предыдущего шага как ответы /api/catalog и /api/streams. Пустая страница сразу оживёт.

Коммит

Зафиксируй текущее «заработало»:

```bash
git add .
git commit -m "feat: boot frontend + admin scaffold, Vite fs.allow fix"
```

После кофе (второй час завтра)

Добавим Drag-n-Drop на стримы (перетаскивать блоки).

Выбор ArtItem по ID из каталога (автокомплит).

Валидацию ISODate, dimensions.unit и т. п. прямо в форме (минимальные подсказки).
