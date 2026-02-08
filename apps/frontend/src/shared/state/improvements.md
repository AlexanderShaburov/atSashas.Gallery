Отлично, теперь видно, откуда у тебя “шум” и где можно сделать очень точечные улучшения.
Что у тебя сейчас по факту
get(key) возвращает ссылку на объект, который лежит в Map.
Но при saveDraft/commit/setSnapshot ты делаешь:

```ts

next = prev ? { ...prev, draft, updatedAt } : ...
```

и потом

```ts
sessions.set(k, { key, data: next });
```

То есть на каждое изменение ты создаёшь новый объект DraftSnapshot. Это ок и правильно.
Проблема в другом: BaseStore.emit() уведомляет всех слушателей вообще, а useSyncExternalStore подписывает каждого consumer на глобальный emit, и они все пересчитывают get(key).
Это означает
Если поменялся один ключ, всё приложение, где есть подписчики на store, дернется (проверит снапшот).
React может “не перерендерить” часть компонентов, если get(key) вернул ту же ссылку (для их ключа), но всё равно будет лишняя работа + иногда лишние ререндеры, если где-то снапшот пересоздают.
Это не “сломано”, но на большом UI станет чувствоваться.
Минимальные правки, которые реально облегчат жизнь
A) Подписка по ключу (лучшее улучшение за 15 минут)
Сделай в store подписки по конкретному key-string, чтобы emit бил только нужных.
Как
В BaseStore добавь keyed listeners (и оставь общий на всякий случай):

```ts
export type Listener = () => void;

export class BaseStore {
    private listeners = new Set<Listener>();
    private keyed = new Map<string, Set<Listener>>();

    subscribe(fn: Listener): () => void {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    subscribeKey(key: string, fn: Listener): () => void {
        let set = this.keyed.get(key);
        if (!set) {
            set = new Set();
            this.keyed.set(key, set);
        }
        set.add(fn);
        return () => {
            set!.delete(fn);
            if (set!.size === 0) this.keyed.delete(key);
        };
    }

    protected emit(): void {
        for (const fn of this.listeners) fn();
    }

    protected emitKey(key: string): void {
        const set = this.keyed.get(key);
        if (set) for (const fn of set) fn();
        // при желании можно ещё и общий emit дергать:
        // this.emit();
    }
}
```

А в EditSessionsDataStore вместо this.emit() делай this.emitKey(k) там, где меняется конкретный ключ:

```ts
saveDraft<T>(key: EditorKey, draft: T): void {
const k = keyToString(key);
...
this.sessions.set(k, { key, data: next as DraftSnapshot<unknown> });
this.emitKey(k);
}
```

clearKind — там много ключей, можно либо:
звать emit() общий
или собрать список ключей и emitKey по каждому (если хочется идеально)
И в hook менять subscribe

```ts
function useDataStore<T>(key?: EditorKey): DraftSnapshot<T> | undefined {
    const k = key ? keyToString(key) : null;

    return useSyncExternalStore(
        (cb) => (k ? editSessionsDataStore.subscribeKey(k, cb) : () => {}),
        () => (key ? editSessionsDataStore.get<T>(key) : undefined),
        () => (key ? editSessionsDataStore.get<T>(key) : undefined),
    );
}
```

Этого одного изменения обычно достаточно, чтобы “вся система перестала дергаться”.
B) Мелкий баг в логах: console.log(key) печатает [object Object]
В ensure у тебя:
console.log(`[EditSessionsDataStore]: key assigned as ${key}`);
Там будет [object Object]. Лучше:
console.log(`[EditSessionsDataStore]: key assigned as ${keyToString(key)}`);
C) Тонкий UX/dirty: updatedAt меняется всегда, значит snapshot всегда “новый”
updatedAt обновляется при любом изменении, то есть DraftSnapshot всегда новый объект — это норм.
Но если где-то в UI ты сравниваешь “изменилось ли что-то” по shallow equality, то updatedAt будет постоянно ломать это. Обычно dirty лучше считать как draft !== snapshot (deepEqual/структурное сравнение) или отдельным флагом в store, а updatedAt оставлять чисто для отладки/индикации.
По твоему исходному вопросу (“можно ли без локальных стейтов?”)
Да. С таким store + useSyncExternalStore это идеальная схема.
Только:
actions у тебя уже стабилизированы (useMemo по key) — 👍
snapshot возвращается ссылкой из Map — 👍
но подписка глобальная — вот это единственное, что реально стоит поправить (см. A).
Самая короткая рекомендация
Сделай subscribeKey/emitKey и используй её в useSyncExternalStore.
Это минимальная эволюционная правка, не ломает архитектуру, но радикально снижает “гимор” и лишние ререндеры.
Если хочешь, я могу написать прям готовый патч (точные изменения в обоих файлах) в твоём стиле (английские inline-комменты, без переписывания всего с нуля).
