// src/shared/nav/ReturnStack.store.ts

import type { JourneyLeg, JourneyTicket, JumpResult } from './journeyStack.types';

type Listener = () => void;

class JourneyStackStore {
    private stack: JourneyTicket[] = [];
    private listeners = new Set<Listener>();

    push(t: JourneyTicket): void {
        this.stack.push(t);
        this.emit();
    }
    peek(): JourneyTicket | undefined {
        return this.stack[this.stack.length - 1];
    }

    pop(): JourneyTicket | undefined {
        const v = this.stack.pop();
        this.emit();
        return v;
    }
    clear(): void {
        this.stack = [];
        this.emit();
    }

    checkInLuggage(id: string, luggage: JumpResult): boolean {
        const topIndex = this.stack.length - 1;
        const top = this.stack[topIndex];

        if (top && top.journeyId === id) {
            this.stack[topIndex] = {
                ...top,
                loot: luggage,
            };
            return true;
        }
        return false;
    }

    _snapshot(): JourneyTicket[] {
        return [...this.stack];
    }

    checkTicket(id: string): JourneyLeg | undefined {
        const index = this.stack.findIndex((t) => t.journeyId === id);
        return index === -1 ? undefined : this.stack[index]?.phase;
    }
    subscribe(fn: Listener): () => void {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    private emit(): void {
        for (const fn of this.listeners) fn();
    }
}
export const journeyStackStore = new JourneyStackStore();

export function resolveReturn(result: JumpResult): { target?: JourneyTicket; result: JumpResult } {
    const target = journeyStackStore.pop();
    return { target, result };
}
