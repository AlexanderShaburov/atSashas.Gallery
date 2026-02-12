// src/shared/nav/journeySession.types.ts

import type { EditorKind } from './editorKey.types';
import type { JourneyTicket, JumpResult } from './journey.types';

/**
 * Home address: where the journey started.
 * Represents the editor and object that initiated the journey.
 */
export type JourneyHome = {
    editor: EditorKind;
    objectId: string | undefined;
};

/**
 * Leg state: tracks whether this segment is outbound or has returned.
 */
export type LegState = 'outbound' | 'returning' | 'completed';

/**
 * A single leg of the journey.
 * Represents one navigation segment: outbound ticket + eventual return.
 */
export type SessionLeg = {
    ticket: JourneyTicket;
    state: LegState;
    loot?: JumpResult;
    completedAt?: string;
};

/**
 * A complete journey session.
 * Created when a non-journey editor dispatches the first outbound ticket.
 * Ends when we return home to the origin.
 */
export type JourneySession = {
    sessionId: string;
    home: JourneyHome;
    legs: SessionLeg[];
    startedAt: string;
    completedAt?: string;
};

/**
 * Next action after processing a journey step.
 * Returned by continueJourney() to tell the system what to do next.
 */
export type NextAction =
    | { kind: 'navigate'; editor: EditorKind; objectId?: string }
    | { kind: 'finishAtHome'; home: JourneyHome }
    | { kind: 'idle' };

/**
 * Diagnostics for detecting lost passengers.
 */
export type JourneyDiagnostic = {
    kind: 'lost-passenger' | 'orphan-return' | 'stack-mismatch' | 'unexpected-editor';
    message: string;
    sessionId?: string;
    expectedEditor?: EditorKind;
    actualEditor?: EditorKind;
};
