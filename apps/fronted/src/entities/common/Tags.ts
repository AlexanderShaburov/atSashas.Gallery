export class Tags implements Iterable<string> {
  private set = new Set<string>();

  constructor(initial?: Iterable<string>) {
    if (initial) for (const t of initial) this.add(t);
  }

  add(tag: string): this {
    const s = tag.trim();
    if (s) this.set.add(s);
    return this;
  }

  addMany(...tags: string[]): this {
    for (const t of tags) this.add(t);
    return this;
  }

  remove(tag: string): boolean {
    return this.set.delete(tag.trim());
  }

  has(tag: string): boolean {
    return this.set.has(tag.trim());
  }

  clear(): void {
    this.set.clear();
  }

  toArray(): string[] {
    return [...this.set];
  }

  [Symbol.iterator](): Iterator<string> {
    return this.set[Symbol.iterator]();
  }
}
