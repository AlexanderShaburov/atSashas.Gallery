// src/shared/nav/ReturnStack.store.ts
class JourneyStackStore {
    constructor() {
        this.stack = [];
        this.listeners = new Set();
    }
    push(t) {
        this.stack.push(t);
        this.emit();
    }
    peek() {
        return this.stack[this.stack.length - 1];
    }
    pop() {
        const v = this.stack.pop();
        this.emit();
        return v;
    }
    consumeLeg() {
        const topIndex = this.stack.length - 1;
        const top = this.stack[topIndex];
        if (!top)
            throw new Error('[JourneyStackStore]: ConsumeLeg nonexisting ticket');
        if (top.phase === 'outbound') {
            this.stack[topIndex] = {
                ...top,
                phase: 'return',
            };
            this.emit();
            // Return unconsumed ticket to use in logic
            return top;
        }
        return this.pop();
    }
    clear() {
        this.stack = [];
        this.emit();
    }
    checkInLuggage(id, luggage) {
        const topIndex = this.stack.length - 1;
        const top = this.stack[topIndex];
        if (top && top.journeyId === id) {
            this.stack[topIndex] = {
                ...top,
                loot: luggage,
            };
            this.emit();
            return true;
        }
        return false;
    }
    _snapshot() {
        return [...this.stack];
    }
    pickOrThrow() {
        const top = this.peek();
        if (!top) {
            throw new Error('[JourneyStackStore]: expected journey ticket, but stack is empty');
        }
        return top;
    }
    subscribe(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }
    emit() {
        for (const fn of this.listeners)
            fn();
    }
}
export const journeyStackStore = new JourneyStackStore();
