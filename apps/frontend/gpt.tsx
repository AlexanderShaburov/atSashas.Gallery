import React, { useEffect, useMemo, useState } from "react";

// --- Types copied from your domain model (adjust if they already exist in your codebase) ---
export type ISODate = string; // e.g., new Date().toISOString().slice(0,10)
export type Localized = Record<string, string>; // { "en": "Title", "ru": "Название" }

export type Availability = "available" | "reserved" | "sold" | "not_for_sale";

export interface Dimensions {
  width: number; // in cm
  height: number; // in cm
  depth?: number | null; // for sculptures
  unit?: "cm" | "mm" | "in";
}

export interface PriceJSON {
  currency: string; // "EUR"
  amount: number; // 1234.56
}

export interface ImagesJSON {
  // At minimum we need a preview and original path(s). Add more sizes as your pipeline grows
  preview: string; // e.g. "/media/hopper/abcd1234_preview.jpg"
  fullsize: string; // e.g. "/media/hopper/abcd1234.jpg"
}

export interface ArtItemJSON {
  id?: string;
  title?: Localized;
  dateCreated: ISODate; // e.g. "2023-12-31"
  techniques: string[];
  price?: PriceJSON | null;
  availability: Availability;
  series?: string | null;
  tags?: string[];
  notes?: string | null;
  images: ImagesJSON;
  dimensions: Dimensions;
}

// --- Config: endpoints (tweak to your env) ---
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/"; // ensure trailing slash in env or concatenate carefully
const HOPPER_LIST_URL = `${API_BASE}vault/hopper/list`; // <- backend JSON listing (see notes below)
const CATALOG_POST_URL = `${API_BASE}catalog/items`; // <- where we POST a new ArtItemJSON

// --- Helper ---
const fmtDate = (d = new Date()) => d.toISOString().slice(0, 10);
const newId = () => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);

// A single preview item returned by the hopper listing endpoint
interface HopperItem {
  name: string; // basename like "abcd1234.jpg"
  url: string;  // absolute or root URL "/media/hopper/abcd1234.jpg"
  previewUrl?: string; // optional dedicated preview path
  size?: number; // bytes
  mtime?: string; // ISO timestamp
}

export default function CatalogEditor() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<HopperItem[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<HopperItem | null>(null);
  const [draft, setDraft] = useState<ArtItemJSON | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await fetch(HOPPER_LIST_URL, { credentials: "include" });
        if (!resp.ok) throw new Error(`Hopper list failed: ${resp.status}`);
        const data = (await resp.json()) as HopperItem[];
        setItems(data);
      } catch (e: any) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // filter by query
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(it => it.name.toLowerCase().includes(s));
  }, [items, q]);

  // when user clicks a tile → pick it and open form with a generated id
  const onPick = (it: HopperItem) => {
    setSelected(it);
    const id = newId();
    const baseNameNoExt = it.name.replace(/\.[^.]+$/, "");
    const preview = it.previewUrl ?? it.url; // fallback to same url if no preview generated
    const draftItem: ArtItemJSON = {
      id,
      title: { ru: baseNameNoExt },
      dateCreated: fmtDate(),
      techniques: [],
      price: null,
      availability: "available",
      series: null,
      tags: [],
      notes: null,
      images: {
        preview,
        fullsize: it.url,
      },
      dimensions: { width: 0, height: 0, unit: "cm" },
    };
    setDraft(draftItem);
    setSavedId(null);
  };

  const updateDraft = (patch: Partial<ArtItemJSON>) => setDraft(d => (d ? { ...d, ...patch } : d));

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setSavedId(null);
    try {
      const resp = await fetch(CATALOG_POST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(draft),
      });
      if (!resp.ok) throw new Error(`Save failed: ${resp.status}`);
      const payload = await resp.json();
      setSavedId(payload?.id || draft.id || null);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 p-4 md:grid-cols-2">
      {/* Left: tiles grid & search */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по имени"
            className="w-full rounded-xl border p-2"
          />
          <span className="text-sm text-gray-500">{filtered.length} шт</span>
        </div>

        {loading ? (
          <div className="text-gray-500">Загружаю превью…</div>
        ) : error ? (
          <div className="text-red-600">Ошибка: {error}</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((it) => (
              <button
                key={it.url}
                onClick={() => onPick(it)}
                className={`group overflow-hidden rounded-2xl border p-0 shadow-sm transition hover:shadow-md focus:outline-none ${
                  selected?.url === it.url ? "ring-2 ring-blue-500" : ""
                }`}
                title={it.name}
              >
                <img
                  src={it.previewUrl ?? it.url}
                  alt={it.name}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
                <div className="truncate p-2 text-left text-xs text-gray-600">
                  {it.name}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: selected item + form */}
      <div className="space-y-3">
        {!draft ? (
          <div className="rounded-2xl border p-6 text-gray-500">
            Выберите превью слева, чтобы начать заполнять карточку.
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-2xl border">
              <img src={draft.images.preview} alt={draft.id} className="w-full object-contain" />
            </div>

            <div className="rounded-2xl border p-4 shadow-sm">
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <label className="text-sm text-gray-600">ID</label>
                  <input
                    value={draft.id ?? ""}
                    onChange={(e) => updateDraft({ id: e.target.value })}
                    className="rounded-xl border p-2"
                  />
                </div>

                <div className="grid gap-1">
                  <label className="text-sm text-gray-600">Название (ru)</label>
                  <input
                    value={draft.title?.ru ?? ""}
                    onChange={(e) => updateDraft({ title: { ...(draft.title ?? {}), ru: e.target.value } })}
                    className="rounded-xl border p-2"
                  />
                </div>

                <div className="grid gap-1">
                  <label className="text-sm text-gray-600">Дата создания</label>
                  <input
                    type="date"
                    value={draft.dateCreated}
                    onChange={(e) => updateDraft({ dateCreated: e.target.value })}
                    className="rounded-xl border p-2"
                  />
                </div>

                <div className="grid gap-1">
                  <label className="text-sm text-gray-600">Техники (через запятую)</label>
                  <input
                    value={draft.techniques.join(", ")}
                    onChange={(e) => updateDraft({ techniques: e.target.value.split(/\s*,\s*/).filter(Boolean) })}
                    className="rounded-xl border p-2"
                  />
                </div>

                <div className="grid gap-1">
                  <label className="text-sm text-gray-600">Серия</label>
                  <input
                    value={draft.series ?? ""}
                    onChange={(e) => updateDraft({ series: e.target.value || null })}
                    className="rounded-xl border p-2"
                  />
                </div>

                <div className="grid gap-1">
                  <label className="text-sm text-gray-600">Теги (через запятую)</label>
                  <input
                    value={(draft.tags ?? []).join(", ")}
                    onChange={(e) => updateDraft({ tags: e.target.value.split(/\s*,\s*/).filter(Boolean) })}
                    className="rounded-xl border p-2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <label className="text-sm text-gray-600">Ширина</label>
                    <input
                      type="number"
                      min={0}
                      value={draft.dimensions.width}
                      onChange={(e) => updateDraft({ dimensions: { ...draft.dimensions, width: Number(e.target.value) } })}
                      className="rounded-xl border p-2"
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm text-gray-600">Высота</label>
                    <input
                      type="number"
                      min={0}
                      value={draft.dimensions.height}
                      onChange={(e) => updateDraft({ dimensions: { ...draft.dimensions, height: Number(e.target.value) } })}
                      className="rounded-xl border p-2"
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm text-gray-600">Ед. изм.</label>
                    <select
                      value={draft.dimensions.unit ?? "cm"}
                      onChange={(e) => updateDraft({ dimensions: { ...draft.dimensions, unit: e.target.value as Dimensions["unit"] } })}
                      className="rounded-xl border p-2"
                    >
                      <option value="cm">cm</option>
                      <option value="mm">mm</option>
                      <option value="in">in</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-1">
                  <label className="text-sm text-gray-600">Заметки</label>
                  <textarea
                    value={draft.notes ?? ""}
                    onChange={(e) => updateDraft({ notes: e.target.value || null })}
                    className="min-h-[80px] rounded-xl border p-2"
                  />
                </div>

                <fieldset className="grid gap-2 rounded-xl border p-3">
                  <legend className="px-2 text-sm text-gray-600">Цена (опционально)</legend>
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      placeholder="EUR"
                      value={draft.price?.currency ?? ""}
                      onChange={(e) => updateDraft({ price: { currency: e.target.value, amount: draft.price?.amount ?? 0 } })}
                      className="rounded-xl border p-2"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0"
                      value={draft.price?.amount ?? 0}
                      onChange={(e) => updateDraft({ price: { currency: draft.price?.currency ?? "EUR", amount: Number(e.target.value) } })}
                      className="rounded-xl border p-2"
                    />
                    <button
                      type="button"
                      className="rounded-xl border p-2 text-sm hover:bg-gray-50"
                      onClick={() => updateDraft({ price: null })}
                    >
                      Очистить цену
                    </button>
                  </div>
                </fieldset>

                <div className="grid gap-1">
                  <label className="text-sm text-gray-600">Статус доступности</label>
                  <select
                    value={draft.availability}
                    onChange={(e) => updateDraft({ availability: e.target.value as Availability })}
                    className="rounded-xl border p-2"
                  >
                    <option value="available">available</option>
                    <option value="reserved">reserved</option>
                    <option value="sold">sold</option>
                    <option value="not_for_sale">not_for_sale</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="rounded-2xl border px-4 py-2 shadow-sm transition hover:shadow disabled:opacity-60"
                  >
                    {saving ? "Сохраняю…" : "Сохранить в каталог"}
                  </button>
                  {savedId && <span className="text-sm text-green-700">Сохранено (id: {savedId})</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/*
--- BACKEND NOTE (minimal listing endpoint) ---
Create a small protected endpoint to list files from /vault/hopper and return URLs suitable for <img src>:

@router.get("/vault/hopper/list", dependencies=[Depends(require_admin_token)])
def hopper_list():
    base = Path("/vault/hopper")
    out = []
    for p in sorted(base.glob("*")):
        if p.is_file():
            out.append({
              "name": p.name,
              "url": f"/media/hopper/{p.name}",
              # optional: if you have generated previews put them here
              # "previewUrl": f"/media/arts/previews/{p.name}",
              "size": p.stat().st_size,
              "mtime": __import__("datetime").datetime.utcfromtimestamp(p.stat().st_mtime).isoformat()+"Z",
            })
    return out

POST /api/catalog/items should accept an ArtItemJSON and persist to catalog.json or DB.
*/
