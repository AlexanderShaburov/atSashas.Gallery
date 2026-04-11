// features/public/eventPage/EventPageRenderer.tsx
// Skeleton renderer — renders debug placeholders for each section.
// Will be replaced with real section components in a later stage.

import type { EventRenderContext } from '@/entities/event/eventRenderContext';
import type { ResolvedEventPageData } from '@/entities/event/eventPage.types';

import {
  assembleEventSections,
  getRenderedSections,
} from './assembleEventSections';
import type { RenderMode, SectionOutput } from './assembleEventSections';

interface EventPageRendererProps {
  event: ResolvedEventPageData;
  context: EventRenderContext;
  mode?: RenderMode;
}

function SectionPlaceholder({ output }: { output: SectionOutput }) {
  if (output.status === 'error-placeholder') {
    return (
      <section
        data-kind={output.kind}
        data-status={output.status}
        style={{
          padding: '24px',
          margin: '8px 0',
          border: '2px dashed #e53e3e',
          background: '#fff5f5',
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#c53030',
        }}
      >
        [ERROR] {output.kind} — required data missing
      </section>
    );
  }

  if (output.status === 'editor-placeholder') {
    return (
      <section
        data-kind={output.kind}
        data-status={output.status}
        style={{
          padding: '24px',
          margin: '8px 0',
          border: '2px dashed #d69e2e',
          background: '#fffff0',
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#975a16',
        }}
      >
        [PLACEHOLDER] {output.kind} — fill in required data
      </section>
    );
  }

  return (
    <section
      data-kind={output.kind}
      data-status={output.status}
      style={{
        padding: '16px',
        margin: '8px 0',
        border: '1px solid #e2e8f0',
        background: '#f7fafc',
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#4a5568',
      }}
    >
      {output.kind}
    </section>
  );
}

export function EventPageRenderer({ event, context, mode = 'production' }: EventPageRendererProps) {
  const allOutputs = assembleEventSections(event, context, { mode });
  const visible = getRenderedSections(allOutputs);

  return (
    <div data-preset={event.preset} data-event-id={event.id}>
      {visible.map((output, i) => (
        <SectionPlaceholder key={`${output.kind}-${i}`} output={output} />
      ))}
    </div>
  );
}
