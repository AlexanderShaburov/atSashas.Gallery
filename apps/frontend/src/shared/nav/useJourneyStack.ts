// src/shared/nav/useReturnStack.ts

import { useSyncExternalStore } from 'react';
import { journeyStackStore } from './journeyStack.store';
import type { JourneyTicket } from './journeyStack.types';

export function useTravelDoc(): JourneyTicket | undefined {
    return useSyncExternalStore(
        (onStoreChange) => journeyStackStore.subscribe(onStoreChange),
        () => journeyStackStore.peek(),
        () => journeyStackStore.peek(),
    );
}

export function useJourneyMachine() {
    return {
        push: journeyStackStore.push,
        pop: journeyStackStore.pop,
        clear: journeyStackStore.clear,
    };
}
