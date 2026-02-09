export class Tags {
    constructor(initial) {
        this.set = new Set();
        if (initial)
            for (const t of initial)
                this.add(t);
    }
    add(tag) {
        const s = tag.trim();
        if (s)
            this.set.add(s);
        return this;
    }
    addMany(...tags) {
        for (const t of tags)
            this.add(t);
        return this;
    }
    remove(tag) {
        return this.set.delete(tag.trim());
    }
    has(tag) {
        return this.set.has(tag.trim());
    }
    clear() {
        this.set.clear();
    }
    toArray() {
        return [...this.set];
    }
    [Symbol.iterator]() {
        return this.set[Symbol.iterator]();
    }
}
