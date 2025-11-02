// CatalogEditorPage.tsx (фрагмент)
import { EditorSessionProvider } from './model/editor-session.context';
import SingleItemEditor from '@/features/admin/ui/SingleItemEditor/SingleItemEditor';
import CreateForm from '@/features/admin/ui/CreateForm/CreateForm';
import { generateArtId } from '@/features/admin/ui/CatalogGrid/utils/generateArtId';
import { todayISO } from '@/features/admin/ui/CreateForm/CreateForm';
import type { ISODate } from '@/entities/common';

/* адаптеры для init/build/save */

function prepareInitials(id: { mode: 'create'|'edit'; id: string }): FormValues {
  if (id.mode === 'create') {
    return {
      id: generateArtId(),
      dateCreated: todayISO() as ISODate,
      title: undefined,
      technique: undefined,
      availability: undefined,
      dimensions: undefined,
      price: undefined,
      alt: undefined,
      series: undefined,
      tags: undefined,
      notes: undefined,
    };
  }
  // edit — подтянуть ArtItem и спроецировать в FormValues (пример)
  // тут можно использовать заранее загруженный catalog.items[id.id]
  const item = /* getArtItemById(id.id) */;
  return mapArtItemToForm(item);
}

function buildJSON(identity: { mode:'create'|'edit'; id: string }, form: FormValues): ArtItemJSON {
  if (identity.mode === 'create') {
    return buildFromCreate(form, identity.id); // привязка к hopper/preview basename
  }
  return buildFromEdit(form, identity.id);     // сохраняем существующий id и media
}

async function saveJSON(payload: ArtItemJSON) {
  await fetch('/api/catalog/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export default function CatalogEditorPage() {
  const [mode, setMode] = useState<'create'|'edit'>('create');
  const [hopper, setHopper] = useState<Thumb[]>([]);
  const [selectedThumb, setSelectedThumb] = useState<Thumb | null>(null);
  const [selectedItem, setSelectedItem] = useState<ArtItem | null>(null);
  // загрузки/ошибки/series/techniques — как у тебя

  /* выбор из сетки хоппера */
  const onThumbClick = (h: Thumb) => {
    setSelectedThumb(h);
    // при желании генерируй artId здесь же и клади в form initial — но удобнее через prepareInitials
  };

  // Ветвление рендера:
  if (mode !== 'create' && !selectedItem) {
    return /* список для выбора существующего ArtItem */;
  }
  if (mode === 'create' && !selectedThumb) {
    return /* грид hopper + кнопки переключения режима */;
  }

  const identity = mode === 'create'
    ? { mode: 'create' as const, id: selectedThumb!.id }
    : { mode: 'edit'   as const, id: selectedItem!.id };

  const exitSession = () => {
    // единая точка выхода — обнуляем выбор и возвращаемся к списку
    setSelectedThumb(null);
    setSelectedItem(null);
  };

  return (
    <EditorSessionProvider
      identity={identity}
      prepareInitials={prepareInitials}
      buildJSON={buildJSON}
      saveJSON={saveJSON}
      exitSession={exitSession}
    >
      {/* Внутри провайдера — сам экран редактора */}
      <SingleItemEditor
        // внутри уже можно НЕ передавать save/exit/isDirty/saving — они из контекста
        // покажи тулбар с кнопками Save/Close, читая useEditorSession()
        FormComponent={CreateForm}
        thumb={mode === 'create' ? selectedThumb! : undefined}
        item={mode === 'edit' ? selectedItem! : undefined}
      />
    </EditorSessionProvider>
  );
}
