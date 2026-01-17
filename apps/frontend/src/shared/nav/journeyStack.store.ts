// src/shared/nav/ReturnStack.store.ts

import type { JourneyTicket, JumpResult } from './journeyStack.types';

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

    consumeLeg(): JourneyTicket | undefined {
        const topIndex = this.stack.length - 1;
        const top = this.stack[topIndex];
        if (!top) throw new Error('[JourneyStackStore]: ConsumeLeg nonexisting ticket');
        if (top.phase === 'outbound') {
            this.stack[topIndex] = {
                ...top,
                phase: 'return',
            };
            this.emit();
            return this.stack[topIndex];
        }
        return this.pop();
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
            this.emit();
            return true;
        }
        return false;
    }

    _snapshot(): JourneyTicket[] {
        return [...this.stack];
    }

    pickOrThrow(): JourneyTicket {
        const top = this.peek();
        if (!top) {
            throw new Error('[JourneyStackStore]: expected journey ticket, but stack is empty');
        }
        return top;
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
