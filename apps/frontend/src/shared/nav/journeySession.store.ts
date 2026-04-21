// src/shared/nav/journeySession.store.ts

import type { EditorKind } from './editorKey.types';
import type { JourneyTicket, JumpResult } from './journey.types';
import type {
    JourneyDiagnostic,
    JourneyHome,
    JourneySession,
    NextAction,
    SessionLeg,
} from './journeySession.types';

type Listener = () => void;

const LOG_PREFIX = '[JourneySession]';

/**
 * Session-based Journey Store
 *
 * Manages a single active JourneySession representing the full navigation chain.
 * Replaces the simple ticket stack with a structured session + legs model.
 */
class JourneySessionStore {
    private activeSession: JourneySession | undefined = undefined;
    private listeners = new Set<Listener>();
    private diagnostics: JourneyDiagnostic[] = [];

    // ========== Session Management ==========

    /**
     * Start a new journey session.
     * Creates a session with home and the first outbound leg.
     */
    startJourney(home: JourneyHome, firstTicket: JourneyTicket): void {
        if (this.activeSession) {
            this.logDiagnostic({
                kind: 'stack-mismatch',
                message: 'startJourney called but session already active',
                sessionId: this.activeSession.sessionId,
            });
        }

        const session: JourneySession = {
            sessionId: firstTicket.journeyId,
            home,
            legs: [
                {
                    ticket: firstTicket,
                    state: 'outbound',
                },
            ],
            startedAt: firstTicket.createdAt,
        };

        this.activeSession = session;
        console.log(`${LOG_PREFIX} Journey started:`, {
            sessionId: session.sessionId,
            home,
            destination: firstTicket.destination,
        });
        this.emit();
    }

    /**
     * Add an outbound leg to the active session.
     * If no session exists, starts one (requires home).
     */
    pushOutbound(ticket: JourneyTicket, home?: JourneyHome): void {
        if (!this.activeSession) {
            if (!home) {
                throw new Error(
                    `${LOG_PREFIX} pushOutbound called with no active session and no home provided`,
                );
            }
            this.startJourney(home, ticket);
            return;
        }

        const leg: SessionLeg = {
            ticket,
            state: 'outbound',
        };

        this.activeSession.legs.push(leg);
        console.log(`${LOG_PREFIX} Outbound leg added:`, {
            destination: ticket.destination,
            legCount: this.activeSession.legs.length,
        });
        this.emit();
    }

    /**
     * Peek at the next ticket for a specific editor.
     * Returns the ticket if the top leg matches the editor.
     */
    peekNextTicketFor(editor: EditorKind): JourneyTicket | undefined {
        if (!this.activeSession) return undefined;

        const topLeg = this.activeSession.legs[this.activeSession.legs.length - 1];
        if (!topLeg) return undefined;

        // Check if this editor should handle this leg
        const expectedEditor =
            topLeg.state === 'outbound'
                ? topLeg.ticket.destination.editor
                : topLeg.ticket.returnTo.editor;

        if (expectedEditor !== editor) {
            this.logDiagnostic({
                kind: 'unexpected-editor',
                message: `Editor ${editor} called peekNextTicketFor but expected ${expectedEditor}`,
                sessionId: this.activeSession.sessionId,
                expectedEditor,
                actualEditor: editor,
            });
            return undefined;
        }

        return topLeg.ticket;
    }

    /**
     * Process arrival at an editor.
     * Consumes the leg: outbound → returning, or returning → completed (pop).
     */
    arrival(editor: EditorKind): JourneyTicket | undefined {
        if (!this.activeSession) return undefined;

        const topLeg = this.activeSession.legs[this.activeSession.legs.length - 1];
        if (!topLeg) return undefined;


        const expectedEditor =
            topLeg.state === 'outbound'
                ? topLeg.ticket.destination.editor
                : topLeg.ticket.returnTo.editor;

        if (expectedEditor !== editor) {
            this.logDiagnostic({
                kind: 'unexpected-editor',
                message: `Arrival at ${editor} but expected ${expectedEditor}`,
                sessionId: this.activeSession.sessionId,
                expectedEditor,
                actualEditor: editor,
            });
            throw new Error(
                `${LOG_PREFIX} Arrival on unexpected editor ${editor} instead of ${expectedEditor}`,
            );
        }

        console.log(`${LOG_PREFIX} Arrival at ${editor}, leg state: ${topLeg.state}`);

        // Consume the leg
        if (topLeg.state === 'outbound') {
            // Flip to returning
            // topLeg.state = 'returning';
            // this.emit();
            return topLeg.ticket;
        } else if (topLeg.state === 'returning') {
            // Complete and pop
            this.activeSession.legs.pop();
            console.log(
                `${LOG_PREFIX} Leg completed and popped, remaining legs: ${this.activeSession.legs.length}`,
            );

            // If no legs remain, session is complete
            if (this.activeSession.legs.length === 0) {
                console.log(`${LOG_PREFIX} Journey session completed`);
                this.activeSession.completedAt = new Date().toISOString();
                this.activeSession = undefined;
            }

            this.emit();
            // IMPORTANT: Include loot in the returned ticket (loot is stored on leg, not ticket)
            return { ...topLeg.ticket, loot: topLeg.loot };
        }

        return undefined;
    }

    /**
     * Mark the current leg as returning and attach loot.
     * Called when an editor finishes work and is ready to return.
     */
    completeReturn(editor: EditorKind, loot: JumpResult): void {
        if (!this.activeSession) {
            this.logDiagnostic({
                kind: 'orphan-return',
                message: `completeReturn called by ${editor} but no active session`,
                actualEditor: editor,
            });
            console.warn(`${LOG_PREFIX} completeReturn called but no active session`);
            return;
        }

        const topLeg = this.activeSession.legs[this.activeSession.legs.length - 1];
        if (!topLeg) {
            console.warn(`${LOG_PREFIX} completeReturn called but no legs in session`);
            return;
        }

        // Attach loot
        topLeg.loot = loot;
        topLeg.completedAt = new Date().toISOString();
        topLeg.state = 'returning';

        console.log(`${LOG_PREFIX} Return completed by ${editor}:`, {
            loot,
            returnTo: topLeg.ticket.returnTo,
        });

        this.emit();
    }

    /**
     * CRITICAL: Determine the next action after a step completes.
     * This is the universal continuation logic that prevents nested journeys from getting stuck.
     */
    continueJourney(): NextAction {
        if (!this.activeSession) {
            return { kind: 'idle' };
        }

        const topLeg = this.activeSession.legs[this.activeSession.legs.length - 1];

        // If no legs remain, go home
        if (!topLeg) {
            const action: NextAction = {
                kind: 'finishAtHome',
                home: this.activeSession.home,
            };
            console.log(`${LOG_PREFIX} continueJourney: finish at home`, this.activeSession.home);
            return action;
        }

        // If top leg is returning, navigate to return target
        if (topLeg.state === 'returning') {
            const action: NextAction = {
                kind: 'navigate',
                editor: topLeg.ticket.returnTo.editor,
                objectId: topLeg.ticket.returnTo.objectId,
            };
            console.log(`${LOG_PREFIX} continueJourney: navigate to`, action);
            return action;
        }

        // Otherwise idle (leg is still outbound, editor should handle it)
        return { kind: 'idle' };
    }

    // ========== Diagnostics ==========

    private logDiagnostic(diagnostic: JourneyDiagnostic): void {
        this.diagnostics.push(diagnostic);
        console.warn(`${LOG_PREFIX} [${diagnostic.kind}]`, diagnostic.message);
    }

    getDiagnostics(): JourneyDiagnostic[] {
        return [...this.diagnostics];
    }

    clearDiagnostics(): void {
        this.diagnostics = [];
    }

    // ========== State Access ==========

    hasActiveSession(): boolean {
        return !!this.activeSession;
    }

    getActiveSession(): JourneySession | undefined {
        return this.activeSession ? { ...this.activeSession } : undefined;
    }

    getCurrentHome(): JourneyHome | undefined {
        return this.activeSession?.home;
    }

    /**
     * Check if a specific editor is part of the current journey.
     */
    isEditorInJourney(editor: EditorKind): boolean {
        if (!this.activeSession) return false;

        // Check if editor is home
        if (this.activeSession.home.editor === editor) return true;

        // Check if editor is in any leg
        return this.activeSession.legs.some(
            (leg) =>
                leg.ticket.destination.editor === editor || leg.ticket.returnTo.editor === editor,
        );
    }

    /**
     * Clear the active session (emergency reset).
     */
    clear(): void {
        console.log(`${LOG_PREFIX} Session cleared`);
        this.activeSession = undefined;
        this.emit();
    }

    // ========== Subscription ==========

    subscribe(fn: Listener): () => void {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    private emit(): void {
        for (const fn of this.listeners) fn();
    }

    // ========== Debug ==========

    _snapshot(): JourneySession | undefined {
        return this.activeSession ? JSON.parse(JSON.stringify(this.activeSession)) : undefined;
    }
}

export const journeySessionStore = new JourneySessionStore();
