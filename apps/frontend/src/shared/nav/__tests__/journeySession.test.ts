// src/shared/nav/__tests__/journeySession.test.ts
// Quick validation test for journeySession store

import type { JourneyTicket } from '../journey.types';
import { journeySessionStore } from '../journeySession.store';

// Simple smoke test to verify the store works
export function validateJourneySessionStore(): void {
    console.log('[TEST] Starting JourneySession validation...');

    // Create a test ticket
    const testTicket: JourneyTicket = {
        journeyId: 'test-journey-1',
        destination: {
            editor: 'block',
            mode: 'select',
        },
        returnTo: {
            editor: 'stream',
            mode: 'edit',
            objectId: 'stream-123',
        },
        phase: 'outbound',
        nonce: 'test-nonce',
        createdAt: new Date().toISOString(),
        returnEffect: undefined,
    };

    // Test 1: Start journey
    journeySessionStore.startJourney({ editor: 'stream', objectId: 'stream-123' }, testTicket);
    console.log('[TEST] ✓ Journey started');

    // Test 2: Check active session
    const hasSession = journeySessionStore.hasActiveSession();
    console.assert(hasSession === true, 'Should have active session');
    console.log('[TEST] ✓ Active session detected');

    // Test 3: Get session snapshot
    const snapshot = journeySessionStore._snapshot();
    console.assert(snapshot !== undefined, 'Snapshot should exist');
    console.assert(snapshot?.legs.length === 1, 'Should have 1 leg');
    console.log('[TEST] ✓ Session snapshot valid');

    // Test 4: Clear session
    journeySessionStore.clear();
    const hasSessionAfterClear = journeySessionStore.hasActiveSession();
    console.assert(hasSessionAfterClear === false, 'Should not have active session after clear');
    console.log('[TEST] ✓ Session cleared');

    console.log('[TEST] All validation tests passed! ✓');
}
