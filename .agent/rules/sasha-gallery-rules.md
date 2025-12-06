---
trigger: always_on
---

📌 GRAVITY RULES — SashaGallery AI Coding Agent
(copy-paste ready — English, structured, authoritative)
1️⃣ Project Identity & Purpose
Project name: SashaGallery
Mission: a digital art gallery for artworks by Sasha — with a public 
gallery site and admin editor for uploading, organizing, and publishing 
works in curated streams.
2️⃣ Technical Stack — MUST follow
Frontend: React + Vite + TypeScript
Backend: FastAPI (Python 3.12) using Pydantic models
Storage: JSON-based catalogs in /vault/json/
Deployment: Docker Compose + Nginx reverse proxy
Image pipeline: Pillow (with AVIF/WebP/JPEG previews)
3️⃣ Core Architecture — DO NOT break
Workflow must always remain:
Hopper → ArtItem → Stream → Publish
Hopper = temporary image storage, admin preview only
ArtItem = metadata entry + move image to full storage
Stream = ordered layout blocks forming a gallery page
📌 Every new feature or API must respect this pipeline.
4️⃣ JSON Data Contracts — MUST comply
Use the existing JSON structures:
ArtCatalog
Index of all artworks with IDs and metadata
BlocksCollectionJSON
Stores blocks grouped in collections
Admin-only editing context
Block Types
Only these block kinds currently exist:
BlockKind	UI Purpose
gallery	image tiles + captions
text	title + body content
cta	call-to-action blocks
⚠️ No new block kinds without explicit user approval
⚠️ Layout logic is handled separately — keep blockKind clean.
5️⃣ Editor Session Rules
State is controlled by BlockEditorSession context
setIdentity(), snapshots, dirty flag must stay intact
NEVER mutate session state outside hooks exposed by context
All writes must persist via existing API endpoints
6️⃣ Backend Rules
File operations must use settings paths (settings.storage_root, etc.)
Use Pydantic models that already exist
Validation is required for any new metadata fields
7️⃣ Frontend UI Rules
Design system:
Minimalistic, clean
English comments in code
Tailwind for styling
Avoid custom inline CSS except minor utility overrides
Responsive behavior required for:
GalleryComponent previews
Caption rendering even without image ID
8️⃣ Safety Constraints
Never invent API fields or JSON structures
Never introduce magic constants for vault paths
Always request clarification when:
Changing the block model schema
Adding a new Stream layout
Modifying Hopper → ArtItem transition logic
9️⃣ Output Style Expectations
Provide complete, working code blocks
Include file paths for every snippet
Offer unitary changes — evolve, do not rewrite
Explanations: short and tactical
Propose follow-up TODOS if large changes are needed
10️⃣ Role of Agent
The agent is:
A senior developer maintaining consistency, not reinventing design.
If unsure → ask.
If change is risky → propose alternative.
💡 Extra: Self-check checklist for every answer
Before sending code, the agent verifies:
Check	Yes/No
Uses existing types and folder structure?	
Supports Hopper→ArtItem→Stream pipeline?	
Honors BlockEditorSession logic?	
UI styled with Tailwind & existing classes?	
No breaking schema or storage changes?	
Comments in English?	
If any answer = No → revise or ask clarifying question.
