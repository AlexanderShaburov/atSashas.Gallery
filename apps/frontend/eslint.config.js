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
    rules: {
      // Treat `_`-prefixed identifiers as intentionally unused. Matches the
      // common convention for destructuring discards, handler args that the
      // signature requires but the body ignores, etc.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
    },
  },
  // ── Event retirement anti-regression ────────────────────────────────────────
  // Project-wide guardrail per `invariant--architecture--single-event-entity.md`.
  // The legacy EventData entity, its editor, its provider, its repo, and its
  // JSON catalog were retired on 2026-04-21. The system has exactly one event
  // entity: EventPage (EventPageData). Any import of the retired paths is a
  // violation and must fail lint.
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/entities/event',
              importNames: ['EventData'],
              message:
                'EventData retired 2026-04-21. Use EventPageData (the canonical event entity).',
            },
          ],
          patterns: [
            {
              group: [
                '**/shared/EventsProvider/**',
                '**/features/admin/eventEditor/**',
                '**/features/public/api/eventsModule*',
              ],
              message:
                'Legacy event infrastructure retired 2026-04-21 — see `decision--event--event-page-is-canonical-event.md`. Use EventPageData / event_pages APIs.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          // Legacy EventData endpoint. Dots in esquery literal regex match
          // the forward slashes; the trailing literal "s" ensures we do not
          // also match `/api/public/event-pages` (which has `-` after `event`).
          selector: 'Literal[value=/api.public.events[^-]/]',
          message:
            'Legacy /api/public/events endpoint retired 2026-04-21 — use /api/public/event-pages.',
        },
        {
          selector: 'Literal[value=/events.catalog.json/]',
          message:
            'Legacy events/catalog.json retired 2026-04-21 — use event_pages/catalog.json.',
        },
      ],
    },
  },
])
