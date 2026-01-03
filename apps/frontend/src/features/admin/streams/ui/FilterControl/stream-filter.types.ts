import type { StreamStatus } from '@/entities/stream';

export interface StreamFilterState {
    /** Free text search (title / description) */
    query: string;

    /** Selected tags */
    tags: string[];

    /** Stream publication status */
    status?: StreamStatus;

    /** UI mode */
    extended: boolean;

    /** Advanced: updated date range (ISO yyyy-mm-dd) */
    updatedAfter?: string;
    updatedBefore?: string;
}
