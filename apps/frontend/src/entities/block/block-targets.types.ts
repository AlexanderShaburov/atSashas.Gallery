import { ItemPosition } from './block.types';

// What exactly is being edited (typed target)
export type EditTarget =
    | {
          blockKind: 'gallery';
          slot: ItemPosition | undefined;
          kind: 'imageCaption' | 'blockCaption' | 'image' | 'eventSlot';
      }
    | { blockKind: 'text'; kind: 'title' | 'body' }
    | { blockKind: 'cta'; kind: 'label' | 'url' }
    | { blockKind: 'eventCta'; kind: 'eventId' | 'buttonLabel' };
