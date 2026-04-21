# CLAUDE.md

This file provides minimal operational guidance for Claude when working in this repository.

---

## 1. Core Principle

This project uses the Knowledge Vault as the **primary source of project context and memory**.

Claude MUST:

- use the Knowledge Vault for all non-trivial work;
- treat it as the source of truth for architecture, behavior, and decisions;
- keep it synchronized with implementation when required.

Claude’s internal reasoning process is NOT replaced or constrained by this file.

---

## 2. Knowledge Vault Location

```text
./knowledge/
```

The vault contains:

- invariants
- architecture
- specs
- decisions
- patterns
- bugs
- sessions
- plans (if present)

---

## 3. Mandatory Reading (before non-trivial work)

Before performing non-trivial tasks, Claude MUST:

1. Read:
   - `knowledge/index/index--system--project-navigation.md`

2. Identify relevant documents

3. Retrieve only the minimal required context, prioritizing:

   1. invariants
   2. architecture
   3. specs
   4. decisions
   5. patterns

Claude MUST NOT rely on memory alone.

---

## 4. Orchestration & Sync Rules

Claude MUST follow:

- `knowledge/specs/spec--system--knowledge-driven-task-orchestration.md`
- `knowledge/specs/spec--devops--knowledge-sync-classification.md`

### Responsibility split

- Orchestration spec → how to work with knowledge (retrieve, ground, sync)
- Sync classification → what must be validated and persisted

If these documents conflict with assumptions or prior habits:

→ follow the specifications.

---

## 5. Knowledge Sync Requirement

After any non-trivial task, Claude MUST:

- determine whether the task changed durable project knowledge;
- update the Knowledge Vault if required;
- or explicitly state that no update is needed.

A task is NOT complete until this check is performed.

---

## 6. Plans (Important Clarification)

Plans are **optional artifacts**, not mandatory for all tasks.

Claude SHOULD create or update a plan when:

- the task is multi-step;
- multiple subsystems are involved;
- migration or phased work is described;
- intent should be preserved for future work.

If a structured plan is already expressed in the response:

→ it SHOULD be materialized into a plan document.

Plan lifecycle is defined in the orchestration spec.

---

## 7. General Rules

- Do not duplicate knowledge across multiple sources.
- Prefer updating existing documents over creating new ones.
- Keep one concept per file.
- Keep knowledge consistent with implementation.

---

## 8. Practical Rule of Thumb

If a future agent reading only the Knowledge Vault would make a wrong decision:

→ the Knowledge Vault must be updated now.

---

## 9. Scope of This File

This file intentionally contains:

- minimal operational rules
- no architecture duplication
- no behavioral specifications

All detailed rules belong in the Knowledge Vault.
