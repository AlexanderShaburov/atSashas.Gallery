// src/features/admin/streams/ui/FilterControl/streamFilter.defaults.ts

import type { StreamFilterState } from './stream-filter.types';

export const DEFAULT_STREAM_FILTER: StreamFilterState = {
    query: '',
    tags: [],
    status: undefined,
    extended: false,
    updatedAfter: undefined,
    updatedBefore: undefined,
};
