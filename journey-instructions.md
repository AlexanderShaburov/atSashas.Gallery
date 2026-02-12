Refactor Journey Mechanism to Session-Based Journey Store
Context

We have a React + TypeScript admin app with multiple editors: 
StreamEditor, BlockEditor, CatalogEditor, Hopper. Navigation between 
editors is implemented as a “Journey” mechanic (outbound/return tickets). 
The current implementation uses a simple ticket stack (“travelStack”) and 
editor-local logic. This leads to holes:

After handling a return or outbound ticket, the app often does not check 
if another pending ticket exists, so nested journeys can get stuck.

Tickets can become “lost passengers” when nested journeys occur (Stream → 
Block → Catalog → Hopper → Catalog → Block …).

Local isJourney flags drift from reality and cause inconsistent behavior.

We want a single JourneySession object created when the user starts a 
journey from a “native” (non-journey) editor state. All subsequent 
outbound/return steps attach to this session as legs. The session ends 
only when we “return home” to the origin.

Goals

Replace the existing travelStack array mechanism with a Journey Store that 
tracks an active JourneySession (plus optionally history).

Model the journey as:

A single JourneySession created at the moment a non-journey editor 
dispatches the first outbound ticket.

A list/stack of legs (segments). Each leg represents an outbound 
navigation and its return payload.

Provide universal transporter-level logic:

After processing a ticket (outbound/return), the system must immediately 
determine whether another step should be processed (continue return 
chain).

This must not be editor-specific.

Update editors (Stream / Block / Catalog / Hopper) to integrate with the 
new store while keeping changes minimal and evolutionary.

Hard Constraints

Do not rewrite the entire navigation system. Keep modifications minimal 
and incremental.

Preserve as much of the existing editor structure as possible.

Prefer to keep the existing hooks surface if they already exist:

useArrival(), useDispatch(), usePeekTicket(), useReturnHome()

If you must change API, keep compatibility wrappers.

No major UI redesign; focus on correctness + deterministic navigation.

Existing Behavior (to preserve)

Editors can be opened in normal mode (select/edit) without a journey.

Outbound tickets navigate to another editor with destination mode 
(select/edit) and optional objectId.

Return tickets carry a returnEffect (command) + loot (payload) used by the 
returning editor.

Apply/Save should:

Commit local work (draft/snapshot/external store)

Then decide whether to return further up the journey chain or finish at 
home.

Store Responsibilities

The Journey Store must support these operations:

startJourney(home, firstOutboundTicket)
Creates a new JourneySession if none active; stores home, pushes first 
leg.

pushOutbound(ticket)
Adds a new leg to the active session if session exists; if no session 
exists, start one (home must be provided by caller / derived from current 
editor).

peekNextTicketFor(editor) / arrival(editor)
Returns the ticket the current editor should process:

If the session top leg is outbound and destination.editor matches current 
editor → return that.

If the top leg is in “returning” state and the return target matches 
current editor → return that.

Otherwise undefined.

completeReturn(editor, loot, returnEffect)
Marks the current leg done (or sets loot and marks returning complete).

continueJourney() (IMPORTANT)
Universal function:

Called after any step completion (Apply/Save/ReturnHome).

Decides if we must navigate further up (return to previous editor) or 
finish the session at home.

Performs the navigation action via transporter (or returns a “NextAction” 
for caller).

Diagnostics:

Detect and log “lost passengers”:

active session exists but current editor is not expected

return without matching leg

leg stack mismatch

Provide clear console logs (prefixed) for debugging.

Transporter-Level Universal Procedure
Implement a deterministic loop (no editor-specific logic)

Create a function in transporter/travel runtime layer, e.g. 
drainJourney():

After a ticket is processed, call drainJourney() which:

checks the session top leg

determines whether:

we should navigate to another editor to continue processing

we should finalize and go home

or we are “idle” (no pending steps)

This prevents the current bug:

Return from Hopper → Catalog must detect whether it must return further 
(e.g., to Block or Stream) and do so deterministically.
Editor Integration Changes
Principle

Editors should do only:

const ticket = arrival('<editor>')

Process ticket (outbound or return)

On Apply/Save, call something like:

journey.completeReturn(...)

then journey.continueJourney() (or transporter wrapper returnHome() which 
internally triggers continuation)

Remove / de-emphasize local isJourney

Local isJourney flags should become derived:

isJourney = journeyStore.hasActiveSession() AND “this editor is part of 
it”
or provided by a hook: useJourneyStatus(editorId).

Update these editors:

StreamEditor

BlockEditor

CatalogEditor

Hopper

Make sure repeated nested sequence works:

Stream → Block → Catalog → Hopper → (return) Catalog → (return) Block 
→ (return) Stream

Re-enter Hopper multiple times in the same overall journey and still 
return correctly.

Migration Plan

Introduce JourneyStore alongside the old stack store.

Create compatibility wrappers so existing calls still work:

dispatch(ticket) routes into journeyStore.pushOutbound(ticket)

arrival(editor) reads from journeyStore.peekNextTicketFor(editor)

returnHome(editor, loot) calls journeyStore.completeReturn(...) + 
continueJourney()

Gradually remove old stack logic after end-to-end works.

Required Deliverables

New journeyStore.ts (or folder) implementing JourneySession + operations 
above.

Updated transporter hooks implementing the universal continuation logic:

useArrival, useDispatch, useReturnHome, usePeekTicket

Editor updates for Stream/Block/Catalog/Hopper so they:

process tickets via the new store

call continuation after Apply/Save

Add debug logs to validate correctness during development.

Acceptance Tests (manual)

Must pass these flows:

Flow A: Single Journey

Start in StreamEditor (native)

Jump to BlockEditor (outbound)

Return back and finish → you land exactly where you started (home)

Flow B: Deep Nested Journey

Stream → Block → Catalog → Hopper (upload/select) → return Catalog → 
return Block → return Stream

Must return to exact origin after each Apply.

Flow C: Multiple Hopper dives in one journey

From Stream, create block

In block, add image 3 times:

each time go Catalog → Hopper

each time Apply returns to the right editor and preserves state

No “lost passenger” behavior.

Flow D: Orphan detection

If the session expects a different editor than currently mounted, log a 
clear error and recover safely (either finish or reset session).

Notes / Implementation Guidance

Keep everything deterministic: do not rely on “timing” or async refresh 
order.

Prefer storing minimal UI restoration info in home (enough to route).

Keep the design compatible with existing ticket types: do not redesign 
tickets unless necessary.

Ensure store updates are atomic and easy to reason about.
