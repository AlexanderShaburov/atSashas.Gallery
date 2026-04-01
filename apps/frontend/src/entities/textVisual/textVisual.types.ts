// entities/textVisual/textVisual.types.ts

import type { EntityLifecycle, ISODate, Localized } from '@/entities/common';

export type TextVisualBackground =
  | { kind: 'image'; imageUrl: string }
  | { kind: 'color'; color: string }
  | { kind: 'gradient'; gradient: string };

export interface TextVisualTypography {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  color: string;
}

export interface TextVisualTextBox {
  x: number; // % position
  y: number;
  width: number; // % of container
  height: number;
  padding: number;
}

export interface TextVisualOverlay {
  color: string;
  opacity: number;
  blur?: number;
}

export interface TextVisualData {
  id: string;
  lifecycle: EntityLifecycle;
  dateCreated: ISODate;
  title?: Localized;
  subtitle?: Localized;
  body?: Localized;
  caption?: Localized;
  background: TextVisualBackground;
  typography: TextVisualTypography;
  textBox: TextVisualTextBox;
  overlay?: TextVisualOverlay;
  tags?: string[];
}
