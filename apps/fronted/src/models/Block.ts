export const LAYOUT_TYPES = ['mosaicRight', 'mosaicLeft', 'pair', 'single'];
export type Layout = (typeof LAYOUT_TYPES)[number];

export const BLOCK_TYPES = ['image', 'text'];
export type BlockType = (typeof BLOCK_TYPES)[number];

export type ImageId = string & { _brand: 'ImageId' };

export type NonEmptyArray<T> = readonly [T, ...T[]];

export interface ImageBlock {
  id: string;
  type: 'image';
  layout: Layout;
  itemIds: NonEmptyArray<ImageId>;
  blockCaption: string;
}

export interface TextBlock {
  id: string;
  type: 'text';
  noteContent: string;
  align?: 'start' | 'center' | 'end';
}

export type Block = ImageBlock | TextBlock;

export interface StreamData {
  title: string;
  blocks: Block[];
}
