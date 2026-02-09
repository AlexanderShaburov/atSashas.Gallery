// src/entities/art/ArtItem.ts
export class ArtItem {
    constructor(data) {
        this.validateBasic(data);
        this.data = {
            ...data,
            tags: data.tags ?? [],
        };
    }
    validateBasic(data) {
        if (!data.id || !/^\w/.test(data.id)) {
            throw new Error('ArtItem.id is required and must start with a word character');
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dateCreated)) {
            throw new Error('dateCreated must be ISO YYYY-MM-DD');
        }
        if (!['cm', 'in'].includes(data.dimensions.unit)) {
            throw new Error('dimensions.unit must be "cm" or "in"');
        }
    }
    static fromJSON(json) {
        return new ArtItem(json);
    }
    toJSON() {
        return this.data;
    }
}
