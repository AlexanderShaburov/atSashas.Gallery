import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  // ── Homepage Editor anti-regression (plan §12) ──────────────────────────────
  // The new Homepage Editor, HomeEventTile, and useHomeFeed must not depend on
  // legacy event infrastructure. Canonical event = EventPageData. Any new
  // reference to EventData, useEvent(), /api/public/events, or events/catalog.json
  // in these files is a plan violation and must fail lint.
  {
    files: [
      'src/features/admin/homeEditor/**/*.{ts,tsx}',
      'src/features/public/ui/HomeEventTile/**/*.{ts,tsx}',
      'src/features/public/hooks/useHomeFeed.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/shared/EventsProvider/useEvent',
              message:
                'Homepage must not depend on useEvent() — resolve events via EventPageData (eventPagesStore).',
            },
            {
              name: '@/shared/EventsProvider',
              importNames: ['useEvent'],
              message:
                'Homepage must not depend on useEvent() — resolve events via EventPageData (eventPagesStore).',
            },
            {
              name: '@/entities/event',
              importNames: ['EventData'],
              message:
                'Homepage must use EventPageData only, never EventData.',
            },
            {
              name: '@/features/public/api/eventPagesModule',
              message:
                'Homepage Editor must resolve events against the admin catalog (eventPagesStore / refreshEventPages), not the public status-filtered module.',
            },
          ],
          patterns: [
            {
              group: ['**/shared/EventsProvider/useEvent*'],
              message:
                'Homepage must not depend on useEvent() — resolve events via EventPageData (eventPagesStore).',
            },
            {
              group: ['**/public/api/eventPagesModule*'],
              message:
                'Homepage Editor must resolve events against the admin catalog (eventPagesStore / refreshEventPages), not the public status-filtered module.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          // Matches /api/public/events (legacy EventData endpoint).
          // Dots match the literal forward slashes (esquery's selector regex does
          // not parse escaped slashes reliably). Does NOT match /api/public/event-pages
          // because the terminal "s" in the pattern does not match "-" in the target.
          selector: 'Literal[value=/api.public.events/]',
          message:
            'Homepage must not hit /api/public/events — use /api/public/event-pages (canonical).',
        },
        {
          selector: 'Literal[value=/events.catalog.json/]',
          message:
            'Homepage must not reference events/catalog.json (legacy EventData store).',
        },
      ],
    },
  },
])
