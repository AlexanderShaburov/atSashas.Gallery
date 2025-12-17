# Block description:

### 1. Block is union of four of different kind:

    - GalleryBlock
    - TextBlock
    - CtaBlock (Call to the action)
    - VideoBlock

### 2. BaseBlock type has common attributes:

```ts
blockKind: 'GalleryBlock' | 'TextBlock' | 'CTA' | 'VideoBlock';
id: string;
tags: string[];
dateCreated: string;
```

### 3. Then GalleryBlock extends BaseBlock with:

    ```ts
        blockKind: 'GalleryBlock';
        layout: GalleryLayout;
        content: GalleryBlockItem[];
    ```

    where:

    ```ts
    export type GalleryLayout =
        | 'single'
        | 'pairHorizontal'
        | 'pairVertical'
        | 'triptychLeft'
        | 'triptychRight'
        | 'triptychHorizontal';

    interface GalleryBlockItem {
        artId: string;
        position: ItemPosition;
        caption?: Localized;
    }
    ```

### 4. TextBlock extends BaseBlock with:

    ```ts
    export interface TextBlock extends BlockBase {
    blockKind: 'text';
    title?: Localized;
    body: Localized;
    tweaks?: string;  // For future, to arrange text  in textBlock separately of common style
    variant?: 'full' | 'narrow' | 'quote'; // ???????

}
```

### 5. CtaBlock extends BaseBlock with:

```ts
interface CtaTargetStream {
    type: 'stream';
    slug: string; // например, 'mixart' или 'event-rome-workshop'
}

interface CtaTargetExternal {
    type: 'external';
    url: string; // например, ссылка на оплату
}

interface CtaTargetEvent {
    type: 'event';
    eventId: string; // пригодится, когда заведём сущность Event
}

type CtaTarget = CtaTargetStream | CtaTargetExternal | CtaTargetEvent;

interface CtaBlock extends BlockBase {
    blockKind: 'cta';
    title: Localized; // «Записаться на воркшоп»
    body?: Localized; // краткое описание
    buttonLabel: Localized; // «Записаться», «Подробнее»
    target: CtaTarget;
}
```

### 6. Block union:

```ts
export type Block = GalleryBlock | TextBlock | CtaBlock;
```
