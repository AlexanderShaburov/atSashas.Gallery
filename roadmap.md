  ---
  Current State
  
┌────────────────────────────────────────────┬──────────────────────────────┐
  │                    Area                    │            Status            
│
  
├────────────────────────────────────────────┼──────────────────────────────┤
  │ Public HomePage                            │ Done                         
│
  
├────────────────────────────────────────────┼──────────────────────────────┤
  │ Public GalleryPage                         │ Has type errors              
│
  
├────────────────────────────────────────────┼──────────────────────────────┤
  │ Public AboutPage                           │ Placeholder only             
│
  
├────────────────────────────────────────────┼──────────────────────────────┤
  │ Stream Editor                              │ Done                         
│
  
├────────────────────────────────────────────┼──────────────────────────────┤
  │ Block Editor                               │ Works, but has type 
errors   │
  
├────────────────────────────────────────────┼──────────────────────────────┤
  │ Catalog Editor                             │ WIP — delete flow 
incomplete │
  
├────────────────────────────────────────────┼──────────────────────────────┤
  │ Upload/Hopper                              │ Done                         
│
  
├────────────────────────────────────────────┼──────────────────────────────┤
  │ Journey flow (Stream→Block→Catalog→Hopper) │ Draft works                  
│
  
├────────────────────────────────────────────┼──────────────────────────────┤
  │ Backend API                                │ All endpoints exist          
│
  
├────────────────────────────────────────────┼──────────────────────────────┤
  │ Build (tsc)                                │ Fails — ~19 type errors      
│
  
└────────────────────────────────────────────┴──────────────────────────────┘
  ---
  Proposed Roadmap

  Phase 1 — Make it build (fix type errors & broken imports)

  - Fix isSaving vs saving prop mismatches across editors
  - Fix file case mismatch (Block-editor.types.ts)
  - Fix broken import paths (useBlocksEditor, MenuButton, etc.)
  - Remove legacy OldCatalogEditorSession.context.tsx
  - Add missing ImageBlock export to entities/block
  - Fix TextComponent accessing nonexistent properties
  - Goal: npm run build passes clean

  Phase 2 — Complete Catalog Editor

  - Implement delete with dependency resolution UI
  - Wire backend ArtItemDependents endpoint response handling
  - Fix argument count mismatch in deleteById
  - Stabilize save/edit flow end-to-end

  Phase 3 — Polish Public Gallery

  - Fix GalleryPage rendering (placeholder CSS class "???")
  - Build out AboutPage (beyond placeholder)
  - Ensure public gallery renders all block types correctly

  Phase 4 — Hardening & UX

  - Admin auth (token/basic auth for /admin and /api/*)
  - Error states & user feedback across editors
  - Journey edge cases (back navigation, cancellation, data loss 
prevention)

  ---
