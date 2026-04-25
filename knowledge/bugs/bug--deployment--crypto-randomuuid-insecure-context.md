---
type: bug
scope: [deployment, frontend, runtime-compat]
status: fixed
date: 2026-04-23
fixed_date: 2026-04-23
source_of_truth: true
tags: [deployment, http, secure-context, web-crypto, nonce, journey]
---

# `crypto.randomUUID is not a function` on the deployed (non-secure-context) server

## Symptom

In the deployed catalog editor list mode, clicking the Add button threw
an unhandled runtime error:

```
TypeError: crypto.randomUUID is not a function
```

UI read as "button does nothing" because the throw happened inside a
synchronous React event handler before any state setter or navigation
call — nothing re-rendered, nothing dispatched, no visible change.

The same handler worked in local development.

**This is NOT an old-browser compatibility issue.** The failure was
reproduced on:

- Safari 17.6
- Chrome 147

Both ship `crypto.randomUUID` natively. The API was unavailable on the
deployed page because of runtime environment gating, not browser age.

## Root cause

`apps/frontend/src/shared/lib/dateAndLabels/nonceAndNow.ts` called
`crypto.randomUUID()` unconditionally:

```ts
export const createNonce = (): string => crypto.randomUUID();
```

`createNonce` is the shared helper behind every `JourneyTicket.nonce`
(11 call sites across home, stream, block, media, catalog,
eventPage editors, plus two delete hooks) and the
`destructiveActions.store` job ID fallback. A single failure there
cascaded into every ticket-dispatching button.

## Why local worked but deployed did not

`crypto.randomUUID()` is a **secure-context-gated** API. Per the
Web Crypto / Secure Contexts spec, browsers expose it only when the
page is running in a secure context. The same browser version
produces two different results depending on the URL:

| Origin                                   | Secure context? | `crypto.randomUUID`   |
| ---------------------------------------- | --------------- | --------------------- |
| `http://localhost:3000`                  | Yes (loopback)  | Available             |
| `http://127.0.0.1:8080`                  | Yes (loopback)  | Available             |
| `https://admin.example.com`              | Yes (TLS)       | Available             |
| `http://admin.example.com`               | **No**          | **`undefined`**       |
| `http://192.168.1.12:8080` (LAN IP)      | **No**          | **`undefined`**       |

Modern Chrome and Safari (and Firefox) all implement the feature;
they just refuse to expose it to insecure origins. The browser
console message — `TypeError: crypto.randomUUID is not a function` —
is the same regardless of whether the API was "not implemented" or
"not exposed due to insecure context". That makes the bug look like
a compatibility problem when it is actually a deployment problem.

The server exposes the admin at `http://<host>:8080` (Caddy binding
in `docker/docker-compose.yml`, `SITE_URL=http://localhost:8080` in
`docker/.env`). Any admin hitting the app by LAN IP or hostname
over plain HTTP is in an insecure context, so `crypto.randomUUID`
is literally missing. This also explains the split behavior
between two machines on the same LAN: whoever connects through
`localhost` keeps the API; whoever connects through the hostname
does not.

**Primary trigger**: plain-HTTP deployment to a non-loopback origin.
**Secondary triggers** that would produce the same failure even on
HTTPS: sandboxed iframes without `allow-same-origin`, some
file:// contexts, and anywhere else the UA marks the context as
insecure.

The evidence that both Safari 17.6 and Chrome 147 reproduced the
failure on the same URL confirms this reading — it is
unambiguously environment gating, not a browser-version gap.

## Why the UI said "does nothing"

- The throw was synchronous and inside an event handler, before any
  `setState` / `navigate` / store write.
- React does not re-render for a thrown handler — nothing changed
  in the DOM.
- The error went to the browser console; it was never surfaced in
  the UI because the handler had no try/catch wrapper at the throw
  site.
- No Journey ticket was pushed and no route navigation occurred, so
  from the outside it looked identical to "button not wired".

## Fix

Guard the secure-context-only API and fall back to a timestamp +
`Math.random()` composite. Nonces here are used for identity only
(journey ticket IDs, job IDs) — no cryptographic guarantees are
needed.

```ts
export const createNonce = (): string => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
};
```

Deployed 2026-04-23; the affected buttons (catalog Add, block slot
click, stream thumbnail selection, …) work again on the server.

## Audit

All `nonce: createNonce()` call sites in the frontend go through this
helper. A grep for `crypto.randomUUID` across `apps/frontend/src`
returns exactly one hit — the call inside the guarded branch above.
No other secure-context-only API (`crypto.subtle`, etc.) is used.

## Lessons

### Runtime environment ≠ browser version

The reflex reading of `TypeError: crypto.randomUUID is not a function`
is "old browser" — and it will usually be wrong. In current Chrome,
Firefox, and Safari the API is present in the build; whether it is
exposed to a given page is a property of the **runtime context**
(origin, protocol, frame sandboxing), not of the browser release.

Reproducing on two current browsers at the same URL is a strong
signal of an environment issue rather than a compatibility gap.
Always check the deploy URL's secure-context status before treating
a Web API absence as a browser bug.

### Secure-context APIs you cannot assume on a plain-HTTP deploy

Even in current Chrome / Firefox / Safari, these are unavailable at
any non-loopback HTTP origin:

- `crypto.randomUUID`
- `crypto.subtle` (the whole SubtleCrypto surface)
- Many other Web APIs (Clipboard, Geolocation in some flows,
  ServiceWorker, MediaDevices, …)

**Never call them unguarded from frontend code that may run over
plain HTTP.** The single-line guard pattern
(`if (globalThis.crypto?.randomUUID)`) is the bare minimum.

### Handler-throw failure mode

Any uncaught synchronous throw inside a React event handler produces
a silent UI — no visible change, error only in the console. The
user sees "button does nothing". Mitigations:

- Wrap handlers that do non-trivial work in try/catch so errors
  become visible state.
- Runtime error reporter (Sentry etc.) in production so these do
  not rely on someone opening the console.
- Prefer centralizing side-effect primitives (like `createNonce`)
  so one guard covers every call site.

### Deployment parity

Plain-HTTP deployment is strictly weaker than HTTPS or `localhost`.
If HTTPS is not imminent, audit other secure-context APIs the same
way. The longer-term answer is to put the admin behind a real TLS
cert — then `crypto.randomUUID` and friends are unconditionally
available and the fallback branch becomes theoretical.

## Recommendations

1. **Same-class audit on every new dependency.** Any library that
   internally calls `crypto.subtle` / `crypto.randomUUID` will hit
   the same wall; check before adopting.
2. **Plain-HTTP deploy is a known hazard.** Add HTTPS to the
   deployment roadmap; until then, treat the admin surface as a
   "reduced-API environment" during development.
3. **Error boundary + console reporter.** The same two measures
   called out in
   `bug--deployment--clean-vault-boot-blocked.md` would have
   surfaced this within the first click instead of during manual
   QA.

## Related

- `bug--deployment--clean-vault-boot-blocked.md` — sibling
  deployment-time bug class (env substitution)
- `invariant--navigation--all-cross-editor-flows-use-journey.md` —
  journey ticket infrastructure that depends on `createNonce`
- `decision--data--json-vault-no-database.md` — deployment layout
  the secure-context issue surfaced on
