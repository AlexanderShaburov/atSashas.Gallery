// src/entities/art/ArtItem.ts

import type { ArtItemData } from '@/entities/art/artUnit';

export class ArtItem {
    readonly data: ArtItemData;

    constructor(data: ArtItemData) {
        this.validateBasic(data);

        this.data = {
            ...data,
            tags: data.tags ?? [],
        };
    }

    private validateBasic(data: ArtItemData): void {
        if (!data.id || !/^\w/.test(data.id)) {
            throw new Error('ArtItem.id is required and must start with a word character');
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dateCreated)) {
            throw new Error('dateCreated must be ISO YYYY-MM-DD');
        }

        // Only validate dimensions if they exist
        if (data.dimensions && !['cm', 'in'].includes(data.dimensions.unit)) {
            throw new Error('dimensions.unit must be "cm" or "in"');
        }
    }

    static fromJSON(json: ArtItemData): ArtItem {
        return new ArtItem(json);
    }

    toJSON(): ArtItemData {
        return this.data;
    }
}
